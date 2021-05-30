//SPDX-License-Identifier: GPL-3.0
// This contract referenced Sushi's MasterChef.sol logic
pragma solidity ^0.7.0;
pragma abicoder v2;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";
import "../../../core/emission/interfaces/ITokenEmitter.sol";
import "../../../core/emission/interfaces/IMiningPool.sol";
import "../../../core/emission/interfaces/IMiningPoolFactory.sol";
import "../../../core/emission/libraries/PoolType.sol";
import "../../../core/governance/Governed.sol";
import "../../../core/dividend/interfaces/IDividendPool.sol";
import "../../../utils/IERC20Mintable.sol";
import "../../../utils/Utils.sol";
import "../../../utils/ERC20Recoverer.sol";

struct EmitterConfig {
    uint256 projId;
    uint256 initialEmission;
    uint256 minEmissionRatePerWeek;
    uint256 emissionCutRate;
    uint256 founderShareRate;
    address treasury;
    address gov;
    address token;
    address protocolPool;
    address contributionBoard;
    address erc20BurnMiningFactory;
    address erc20StakeMiningFactory;
    address erc721StakeMiningFactory;
    address erc1155StakeMiningFactory;
    address erc1155BurnMiningFactory;
    address initialContributorShareFactory;
}

struct EmissionWeight {
    uint256[] pools;
    uint256 treasury;
    uint256 caller;
    uint256 protocol;
    uint256 dev;
    uint256 sum;
}

struct MiningPoolConfig {
    uint256 weight;
    bytes4 poolType;
    address baseToken;
}

struct MiningConfig {
    MiningPoolConfig[] pools;
    uint256 treasuryWeight;
    uint256 callerWeight;
}

contract TokenEmitter is
    Governed,
    ReentrancyGuard,
    ITokenEmitter,
    Initializable,
    ERC20Recoverer
{
    using ERC165Checker for address;
    using SafeMath for uint256;
    using Utils for bytes4[];

    uint256 public constant DENOMINATOR = 10000;

    uint256 public minEmissionRatePerWeek = 60; // 0.006 per week ~= 36% yearly inflation

    uint256 public emissionCutRate = 3000; // 30%

    address public override token;

    uint256 public emission;

    uint256 public INITIAL_EMISSION;

    uint256 public FOUNDER_SHARE_DENOMINATOR;

    address public initialContributorPool;

    address public treasury;

    address public protocolPool;

    uint256 public constant override emissionPeriod = 1 weeks;

    IMiningPool[] public pools;

    mapping(bytes4 => address) public factories;

    mapping(address => bytes4) public override poolTypes;

    EmissionWeight public emissionWeight;

    uint256 public emissionStarted;

    uint256 public emissionWeekNum;

    uint256 public override projId;

    event Start();
    event TokenEmission(uint256 amount);
    event EmissionCutRateUpdated(uint256 rate);
    event EmissionRateUpdated(uint256 rate);
    event EmissionWeightUpdated(uint256 numberOfPools);
    event NewMiningPool(bytes4 poolTypes, address baseToken, address pool);

    function initialize(EmitterConfig memory params) public initializer {
        require(params.treasury != address(0), "Should not be zero");
        Governed.initialize(msg.sender);
        // set params
        projId = params.projId;
        INITIAL_EMISSION = params.initialEmission;
        emission = params.initialEmission;
        minEmissionRatePerWeek = params.minEmissionRatePerWeek;
        emissionCutRate = params.emissionCutRate;
        protocolPool = params.protocolPool;
        // set contract addresses
        token = params.token;
        setTreasury(params.treasury);
        require(params.founderShareRate < DENOMINATOR);
        FOUNDER_SHARE_DENOMINATOR = params.founderShareRate != 0
            ? DENOMINATOR / params.founderShareRate
            : 0;
        ERC20Recoverer.initialize(params.gov, new address[](0));
        setFactory(params.erc20BurnMiningFactory);
        setFactory(params.erc20StakeMiningFactory);
        setFactory(params.erc721StakeMiningFactory);
        setFactory(params.erc1155StakeMiningFactory);
        setFactory(params.erc1155BurnMiningFactory);
        setFactory(params.initialContributorShareFactory);
        address _initialContributorPool =
            newPool(PoolType.InitialContributorShare, params.contributionBoard);
        initialContributorPool = _initialContributorPool;
        Governed.setGovernance(params.gov);
    }

    /**
     * StakeMiningV1:
     */
    function newPool(bytes4 poolType, address _token) public returns (address) {
        return _newPool(poolType, _token);
    }

    function setEmission(MiningConfig memory config) public governed {
        require(config.treasuryWeight < 1e4, "prevent overflow");
        require(config.callerWeight < 1e4, "prevent overflow");
        // starting the summation with treasury and caller weights
        uint256 _sum = config.treasuryWeight + config.callerWeight;
        // prepare list to store
        IMiningPool[] memory _pools = new IMiningPool[](config.pools.length);
        uint256[] memory _weights = new uint256[](config.pools.length);
        // deploy pool if not the pool exists and do the weight summation
        // udpate the pool & weight arr on memory
        for (uint256 i = 0; i < config.pools.length; i++) {
            address _pool =
                _getOrDeployPool(
                    config.pools[i].poolType,
                    config.pools[i].baseToken
                );
            IMiningPool pool = IMiningPool(_pool);
            require(
                poolTypes[address(pool)] != bytes4(0),
                "Not a deployed mining pool"
            );
            require(config.pools[i].weight < 1e4, "prevent overflow");
            _weights[i] = config.pools[i].weight;
            _pools[i] = pool;
            _sum += config.pools[i].weight; // doesn't overflow
        }
        // compute the founder share
        uint256 _dev =
            FOUNDER_SHARE_DENOMINATOR != 0
                ? _sum / FOUNDER_SHARE_DENOMINATOR
                : 0; // doesn't overflow;
        _sum += _dev;
        // compute the protocol share
        uint256 _protocol = protocolPool == address(0) ? 0 : _sum / 33;
        _sum += _protocol;
        pools = _pools;
        // store the updated emission weight
        emissionWeight = EmissionWeight(
            _weights,
            config.treasuryWeight,
            config.callerWeight,
            _protocol,
            _dev,
            _sum
        );
        emit EmissionWeightUpdated(_pools.length);
    }

    function setFactory(address _factory) public governed {
        bytes4[] memory interfaces = new bytes4[](2);
        interfaces[0] = IMiningPoolFactory(0).newPool.selector;
        interfaces[1] = IMiningPoolFactory(0).poolType.selector;
        require(
            _factory.supportsAllInterfaces(interfaces),
            "Not a valid factory"
        );
        bytes4 _sig = IMiningPoolFactory(_factory).poolType();
        require(factories[_sig] == address(0), "Factory already exists.");
        factories[_sig] = _factory;
    }

    function setTreasury(address _treasury) public governed {
        treasury = _treasury;
    }

    function start() public override governed {
        require(emissionStarted == 0, "Already started");
        emissionStarted = block.timestamp;
        emit Start();
    }

    function setEmissionCutRate(uint256 rate) public governed {
        require(
            1000 <= rate && rate <= 9000,
            "Emission cut should be greater than 10% and less than 90%"
        );
        emissionCutRate = rate;
        emit EmissionCutRateUpdated(rate);
    }

    function setMinimumRate(uint256 rate) public governed {
        require(
            rate <= 134,
            "Protect from the superinflationary(99.8% per year) situation"
        );
        minEmissionRatePerWeek = rate;
        emit EmissionRateUpdated(rate);
    }

    function distribute() public override nonReentrant {
        // current week from the mining start;
        uint256 weekNum =
            block.timestamp.sub(emissionStarted).div(emissionPeriod);
        // The first token token drop will be started a week after the "start" func called.
        require(
            weekNum > emissionWeekNum,
            "Already minted or not started yet."
        );
        // update emission week num
        emissionWeekNum = weekNum;
        // allocate to mining pools
        uint256 weightSum = emissionWeight.sum;
        uint256 prevSupply = IERC20(token).totalSupply();
        for (uint256 i = 0; i < emissionWeight.pools.length; i++) {
            require(i < pools.length, "out of index");
            uint256 weighted =
                emissionWeight.pools[i].mul(emission).div(weightSum);
            _mintAndNotifyAllocation(pools[i], weighted);
        }
        // Caller
        IERC20Mintable(token).mint(
            msg.sender,
            emissionWeight.caller.mul(emission).div(weightSum)
        );
        if (treasury != address(0)) {
            // Protocol fund(protocol treasury)
            IERC20Mintable(token).mint(
                treasury,
                emissionWeight.treasury.mul(emission).div(weightSum)
            );
        }
        // Protocol
        if (protocolPool != address(0)) {
            IERC20Mintable(token).mint(
                protocolPool,
                emissionWeight.protocol.mul(emission).div(weightSum)
            );
            // balance diff automatically distributed. no approval needed
            IDividendPool(protocolPool).distribute(token, 0);
        }
        if (initialContributorPool != address(0)) {
            // Founder
            _mintAndNotifyAllocation(
                IMiningPool(initialContributorPool),
                emission.sub(IERC20(token).totalSupply().sub(prevSupply))
            );
        }
        emit TokenEmission(emission);
        _updateEmission();
    }

    function getNumberOfPools() public view returns (uint256) {
        return pools.length;
    }

    function getPoolWeight(uint256 poolIndex) public view returns (uint256) {
        return emissionWeight.pools[poolIndex];
    }

    function _mintAndNotifyAllocation(IMiningPool _miningPool, uint256 _amount)
        private
    {
        IERC20Mintable(token).mint(address(_miningPool), _amount);
        try _miningPool.allocate(_amount) {
            // success
        } catch {
            // pool does not handled the emission
        }
    }

    function _updateEmission() private returns (uint256) {
        // Minimum emission 0.05% per week will make 2.63% of inflation per year
        uint256 minEmission =
            IERC20(token).totalSupply().mul(minEmissionRatePerWeek).div(
                DENOMINATOR
            );
        // Emission will be continuously halved until it reaches to its minimum emission. It will be about 10 weeks.
        uint256 cutEmission =
            emission.mul(DENOMINATOR.sub(emissionCutRate)).div(DENOMINATOR);
        emission = Math.max(cutEmission, minEmission);
        return emission;
    }

    function _getOrDeployPool(bytes4 poolType, address baseToken)
        internal
        returns (address _pool)
    {
        address _factory = factories[poolType];
        require(_factory != address(0), "Factory not exists");
        // get predicted pool address
        _pool = IMiningPoolFactory(_factory).poolAddress(
            address(this),
            baseToken
        );
        if (poolTypes[_pool] == poolType) {
            // pool is registered successfully
            return _pool;
        } else {
            // try to deploy new pool and register
            return _newPool(poolType, baseToken);
        }
    }

    function _newPool(bytes4 poolType, address _token)
        public
        returns (address)
    {
        address _factory = factories[poolType];
        require(_factory != address(0), "Factory not exists");
        address _pool =
            IMiningPoolFactory(_factory).getPool(address(this), _token);
        if (_pool == address(0)) {
            _pool = IMiningPoolFactory(_factory).newPool(address(this), _token);
        }
        require(
            _pool.supportsInterface(poolType),
            "Does not have the given pool type"
        );
        require(
            _pool.supportsInterface(IMiningPool(0).allocate.selector),
            "Cannot allocate reward"
        );
        require(poolTypes[_pool] == bytes4(0), "Pool already exists");
        poolTypes[_pool] = poolType;
        emit NewMiningPool(poolType, _token, _pool);
        return _pool;
    }
}
