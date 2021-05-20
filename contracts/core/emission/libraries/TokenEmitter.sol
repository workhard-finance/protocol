//SPDX-License-Identifier: GPL-3.0
// This contract referenced Sushi's MasterChef.sol logic
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";
import "../../../core/emission/interfaces/ITokenEmitter.sol";
import "../../../core/emission/interfaces/IMiningPool.sol";
import "../../../core/emission/interfaces/IMiningPoolFactory.sol";
import "../../../core/governance/Governed.sol";
import "../../../core/dividend/interfaces/IDividendPool.sol";
import "../../../utils/IERC20Mintable.sol";
import "../../../utils/Utils.sol";

contract TokenEmitter is
    Governed,
    ReentrancyGuard,
    ITokenEmitter,
    Initializable
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

    address public founderPool;

    address public treasury;

    address public protocolPool;

    uint256 public constant override emissionPeriod = 1 weeks;

    IMiningPool[] public pools;

    mapping(bytes4 => address) public factories;

    mapping(address => bytes4) public override poolTypes;

    struct EmissionWeight {
        uint256[] pools;
        uint256 treasury;
        uint256 caller;
        uint256 protocol;
        uint256 dev;
        uint256 sum;
    }

    EmissionWeight public emissionWeight;

    uint256 public emissionStarted;

    uint256 public emissionWeekNum;

    event Start();
    event TokenEmission(uint256 amount);
    event EmissionCutRateUpdated(uint256 rate);
    event EmissionRateUpdated(uint256 rate);
    event EmissionWeightUpdated(uint256 numberOfPools);
    event NewMiningPool(bytes4 poolTypes, address baseToken, address pool);

    function initialize(
        uint256 _initialEmission,
        uint256 _minEmissionRatePerWeek,
        uint256 _emissionCutRate,
        uint256 _founderShare,
        address _founderPool,
        address _treasury,
        address _gov,
        address _token,
        address _protocolPool
    ) public initializer {
        // set params
        INITIAL_EMISSION = _initialEmission;
        emission = _initialEmission;
        minEmissionRatePerWeek = _minEmissionRatePerWeek;
        emissionCutRate = _emissionCutRate;
        protocolPool = _protocolPool;

        // set contract addresses
        token = _token;
        setTreasury(_treasury);
        require(
            _founderPool.supportsInterface(IMiningPool(0).allocate.selector),
            "Cannot allocate reward"
        );
        require(_founderShare < DENOMINATOR);
        FOUNDER_SHARE_DENOMINATOR = _founderShare != 0
            ? DENOMINATOR / _founderShare
            : 0;
        founderPool = _founderPool;
        Governed.initialize(_gov);
    }

    /**
     * StakeMiningV1:
     */
    function newPool(bytes4 sig, address _token) public returns (address) {
        address _factory = factories[sig];
        require(_factory != address(0), "Factory not exists");

        address _pool =
            IMiningPoolFactory(_factory).newPool(address(this), _token, gov);
        require(_pool.supportsInterface(sig), "Does not have the given sig");
        require(
            _pool.supportsInterface(IMiningPool(0).allocate.selector),
            "Cannot allocate reward"
        );
        require(poolTypes[_pool] == bytes4(0), "Pool already exists");
        poolTypes[_pool] = sig;

        emit NewMiningPool(sig, _token, _pool);
        return _pool;
    }

    function setEmission(
        address[] memory _miningPools,
        uint256[] memory _weights,
        uint256 _treasury,
        uint256 _caller
    ) public governed {
        require(
            _miningPools.length == _weights.length,
            "Both should have the same length."
        );
        IMiningPool[] memory _pools = new IMiningPool[](_miningPools.length);
        uint256 _sum = _treasury + _caller; // doesn't overflow
        for (uint256 i = 0; i < _miningPools.length; i++) {
            IMiningPool pool = IMiningPool(_miningPools[i]);
            require(
                poolTypes[address(pool)] != bytes4(0),
                "Not a deployed mining pool"
            );
            require(_weights[i] < 1e4, "prevent overflow");
            _pools[i] = pool;
            _sum += _weights[i]; // doesn't overflow
        }
        require(_treasury < 1e4, "prevent overflow");
        require(_caller < 1e4, "prevent overflow");
        uint256 _dev =
            FOUNDER_SHARE_DENOMINATOR != 0
                ? _sum / FOUNDER_SHARE_DENOMINATOR
                : 0; // doesn't overflow;
        _sum += _dev;
        uint256 _protocol = protocolPool == address(0) ? 0 : _sum / 33;
        _sum += _protocol;
        pools = _pools;
        emissionWeight = EmissionWeight(
            _weights,
            _treasury,
            _caller,
            _protocol,
            _dev,
            _sum
        );
        emit EmissionWeightUpdated(_pools.length);
    }

    function setFactory(address _factory) public governed {
        bytes4[] memory interfaces = new bytes4[](2);
        interfaces[0] = IMiningPoolFactory(0).newPool.selector;
        interfaces[1] = IMiningPoolFactory(0).poolSig.selector;
        require(
            _factory.supportsAllInterfaces(interfaces),
            "Not a valid factory"
        );
        bytes4 _sig = IMiningPoolFactory(_factory).poolSig();
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

        // Protocol fund(protocol treasury)
        IERC20Mintable(token).mint(
            treasury,
            emissionWeight.treasury.mul(emission).div(weightSum)
        );
        // Caller
        IERC20Mintable(token).mint(
            msg.sender,
            emissionWeight.caller.mul(emission).div(weightSum)
        );
        // Protocol
        IERC20Mintable(token).mint(
            protocolPool,
            emissionWeight.protocol.mul(emission).div(weightSum)
        );
        // balance diff automatically distributed. no approval needed
        IDividendPool(protocolPool).distribute(token, 0);
        // Founder
        _mintAndNotifyAllocation(
            IMiningPool(founderPool),
            emission.sub(IERC20(token).totalSupply().sub(prevSupply))
        );
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
}
