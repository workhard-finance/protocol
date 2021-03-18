//SPDX-License-Identifier: Unlicense
// This contract referenced Sushi's MasterChef.sol logic
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../tokens/VisionToken.sol";
import "../interfaces/IMiningPool.sol";
import "../governance/Governed.sol";

contract VisionTokenEmitter is Governed {
    using SafeMath for uint256;

    VisionToken public immutable visionToken;

    address public immutable dev;

    address public protocolFund;

    uint256 public emissionPeriod = 1 weeks; // default is 1 week

    IMiningPool[] public pools;

    uint256 public constant INITIAL_EMISSION = 1000000 ether; // 1e24
    uint256 public constant MIN_RATE_NUMERATOR = 5; // 0.0005
    uint256 public constant MIN_RATE_DENOMINATOR = 10000; // 0.0005

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

    // Commitment mining: 42.45%, Liquidity mining: 42.45%, DevFund: 5%, Airdrops: 5%, Frontiers: 5%, Caller: 0.1%
    EmissionWeight public weight;

    uint256 public emissionStarted;

    uint256 public emissionWeekNum;

    event TokenEmission(uint256 amount);
    event EmissionPeriodUpdated(uint256 newPeriod);

    constructor(
        address _protocolFund,
        address _dev,
        address _gov,
        address _visionToken
    ) Governed() {
        dev = _dev;
        setProtocolFund(_protocolFund);
        visionToken = VisionToken(_visionToken);
        Governed.setGovernance(_gov);
    }

    function addMiningPools(address[] memory _miningPools) public governed {
        for (uint256 i = 0; i < _miningPools.length; i++) {
            pools.push(IMiningPool(_miningPools[i]));
        }
    }

    function setProtocolFund(address _fund) public governed {
        protocolFund = _fund;
    }

    function start() public governed {
        emissionStarted = block.timestamp;
    }

    function setEmissionWeight(
        uint256[] memory _pools,
        uint256 _protocolFund,
        uint256 _caller
    ) public governed {
        require(_protocolFund < 1e4, "prevent overflow");
        require(_caller < 1e4, "prevent overflow");
        uint256 _sum = _protocolFund + _caller; // doesn't overflow
        require(_pools.length <= pools.length, "out of index");
        for (uint256 i = 0; i < _pools.length; i++) {
            require(_pools[i] < 1e4, "prevent overflow");
            _sum += _pools[i]; // doesn't overflow
        }
        uint256 _dev = _sum / 19; // doesn't overflow;
        _sum += _dev;
        weight = EmissionWeight(_pools, _protocolFund, _caller, _dev, _sum);
    }

    function setEmissionPeriod(uint256 period) public governed {
        require(emissionPeriod != period, "no update");
        emissionPeriod = period;
        emit EmissionPeriodUpdated(period);
    }

    function distribute() public {
        // current week from the mining start;
        uint256 weekNum =
            emissionStarted.sub(block.timestamp).div(emissionPeriod);
        // The first vision token drop will be started a week after the "start" func called.
        require(
            weekNum > emissionWeekNum,
            "Already minted or not started yet."
        );
        // update emission week num
        emissionWeekNum = weekNum;
        // Minimum emission 0.05% per week will make 2.63% of inflation per year
        uint256 minEmission =
            visionToken.totalSupply().mul(MIN_RATE_NUMERATOR).div(
                MIN_RATE_DENOMINATOR
            );
        // Emission will be continuously halved until it reaches to its minimum emission. It will be about 10 weeks.
        uint256 halvedEmission = INITIAL_EMISSION.div(1 << (weekNum - 1));
        uint256 emissionAmount = Math.max(halvedEmission, minEmission);

        // allocate to mining pools
        for (uint256 i = 0; i < weight.pools.length; i++) {
            require(i < pools.length, "out of index");
            _mintAndNotifyAllocation(
                pools[i],
                emissionAmount,
                weight.pools[i],
                weight.sum
            );
        }

        // Dev fund(protocol treasury)
        visionToken.mint(
            protocolFund,
            weight.protocolFund.mul(emissionAmount).div(weight.sum)
        );
        // Frontier
        visionToken.mint(dev, weight.dev.mul(emissionAmount).div(weight.sum));
        // Caller
        visionToken.mint(
            msg.sender,
            weight.caller.mul(emissionAmount).div(weight.sum)
        );
        emit TokenEmission(emissionAmount);
    }

    function _mintAndNotifyAllocation(
        IMiningPool _miningPool,
        uint256 _amount,
        uint256 _weight,
        uint256 _weightSum
    ) private {
        uint256 _weightedAmount = _weight.mul(_amount).div(_weightSum);
        visionToken.mint(address(_miningPool), _weightedAmount);
        _miningPool.allocate(_weightedAmount);
    }
}
