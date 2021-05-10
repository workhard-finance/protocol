//SPDX-License-Identifier: GPL-3.0
// This contract referenced Sushi's MasterChef.sol logic
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../tokens/VisionToken.sol";
import "../interfaces/IMiningPool.sol";
import "../interfaces/IMiningPoolFactory.sol";
import "../governance/Governed.sol";

contract VisionTokenEmitter is Governed {
    using SafeMath for uint256;

    uint256 public constant INITIAL_EMISSION = 24000000 ether; // 1e24
    uint256 public constant DENOMINATOR = 10000;
    uint256 public minEmissionRatePerWeek = 60; // 0.006 per week ~= 36% yearly inflation
    uint256 public emissionCutRate = 3000; // 30%

    VisionToken public visionToken;

    IMiningPoolFactory public burnMiningPoolFactory;
    IMiningPoolFactory public stakeMiningPoolFactory;

    uint256 public emission = INITIAL_EMISSION;

    address public dev;

    address public protocolFund;

    uint256 public constant emissionPeriod = 1 weeks;

    IMiningPool[] public pools;

    mapping(address => address) public burnMiningPools;
    mapping(address => address) public stakeMiningPools;

    struct Rate {
        uint256 numerator;
        uint256 denominator;
    }

    struct EmissionWeight {
        uint256[] pools;
        uint256 protocolFund;
        uint256 caller;
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
    event NewStakeMiningPool(address baseToken, address pool);
    event NewBurnMiningPool(address baseToken, address pool);

    constructor(
        address _devShares,
        address _protocolFund,
        address _gov,
        address _visionToken,
        address _burnMiningPoolFactory,
        address _stakeMiningPoolFactory
    ) Governed() {
        setProtocolFund(_protocolFund);
        visionToken = VisionToken(_visionToken);
        burnMiningPoolFactory = IMiningPoolFactory(_burnMiningPoolFactory);
        stakeMiningPoolFactory = IMiningPoolFactory(_stakeMiningPoolFactory);
        dev = newBurnMiningPool(_devShares);
        Governed.setGovernance(_gov);
    }

    function newBurnMiningPool(address _burningToken) public returns (address) {
        address _pool =
            burnMiningPoolFactory.newPool(
                address(visionToken),
                address(this),
                _burningToken,
                gov
            );
        burnMiningPools[_burningToken] = _pool;
        emit NewBurnMiningPool(_burningToken, _pool);
        return _pool;
    }

    function newStakeMiningPool(address _stakingToken)
        public
        returns (address)
    {
        address _pool =
            stakeMiningPoolFactory.newPool(
                address(visionToken),
                address(this),
                _stakingToken,
                gov
            );
        stakeMiningPools[_stakingToken] = _pool;
        emit NewStakeMiningPool(_stakingToken, _pool);
        return _pool;
    }

    function setEmission(
        address[] memory _miningPools,
        uint256[] memory _weights,
        uint256 _protocolFund,
        uint256 _caller
    ) public governed {
        require(
            _miningPools.length == _weights.length,
            "Both should have the same length."
        );
        IMiningPool[] memory _pools = new IMiningPool[](_miningPools.length);
        uint256 _sum = _protocolFund + _caller; // doesn't overflow
        for (uint256 i = 0; i < _miningPools.length; i++) {
            IMiningPool pool = IMiningPool(_miningPools[i]);
            address _baseToken = pool.baseToken();
            require(
                stakeMiningPools[_baseToken] == address(pool) ||
                    burnMiningPools[_baseToken] == address(pool),
                "The mining pool should be created via newBurnMiningPool or newStakeMiningPool"
            );
            require(_weights[i] < 1e4, "prevent overflow");
            _pools[i] = pool;
            _sum += _weights[i]; // doesn't overflow
        }
        require(_protocolFund < 1e4, "prevent overflow");
        require(_caller < 1e4, "prevent overflow");
        uint256 _dev = _sum / 20; // doesn't overflow;
        _sum += _dev;
        pools = _pools;
        emissionWeight = EmissionWeight(
            _weights,
            _protocolFund,
            _caller,
            _dev,
            _sum
        );
        emit EmissionWeightUpdated(_pools.length);
    }

    function setProtocolFund(address _fund) public governed {
        protocolFund = _fund;
    }

    function start() public governed {
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

    function distribute() public {
        // current week from the mining start;
        uint256 weekNum =
            block.timestamp.sub(emissionStarted).div(emissionPeriod);
        // The first vision token drop will be started a week after the "start" func called.
        require(
            weekNum > emissionWeekNum,
            "Already minted or not started yet."
        );
        // update emission week num
        emissionWeekNum = weekNum;
        // allocate to mining pools
        uint256 weightSum = emissionWeight.sum;
        uint256 prevSupply = visionToken.totalSupply();
        for (uint256 i = 0; i < emissionWeight.pools.length; i++) {
            require(i < pools.length, "out of index");
            uint256 weighted =
                emissionWeight.pools[i].mul(emission).div(weightSum);
            _mintAndNotifyAllocation(pools[i], weighted);
        }

        // Protocol fund(protocol treasury)
        visionToken.mint(
            protocolFund,
            emissionWeight.protocolFund.mul(emission).div(weightSum)
        );
        // Caller
        visionToken.mint(
            msg.sender,
            emissionWeight.caller.mul(emission).div(weightSum)
        );
        // Frontier
        _mintAndNotifyAllocation(
            IMiningPool(dev),
            emission - (visionToken.totalSupply() - prevSupply)
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
        visionToken.mint(address(_miningPool), _amount);
        _miningPool.allocate(_amount);
    }

    function _updateEmission() private returns (uint256) {
        if (emissionWeekNum == 0) return 0;
        // Minimum emission 0.05% per week will make 2.63% of inflation per year
        uint256 minEmission =
            visionToken.totalSupply().mul(minEmissionRatePerWeek).div(
                DENOMINATOR
            );
        // Emission will be continuously halved until it reaches to its minimum emission. It will be about 10 weeks.
        uint256 cutEmission =
            emission.mul(DENOMINATOR - emissionCutRate).div(DENOMINATOR);
        // uint256 halvedEmission =
        //     INITIAL_EMISSION.div(1 << (emissionWeekNum - 1));
        emission = Math.max(cutEmission, minEmission);
        return emission;
    }
}
