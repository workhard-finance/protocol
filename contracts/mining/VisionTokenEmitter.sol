//SPDX-License-Identifier: Unlicense
// This contract referenced Sushi's MasterChef.sol logic
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../tokens/VisionToken.sol";
import "./LiquidityMining.sol";
import "./CommitmentMining.sol";
import "../interfaces/IMiningPool.sol";
import "../governance/Governed.sol";

contract VisionTokenEmitter is Governed {
    using SafeMath for uint256;

    VisionToken public immutable visionToken;

    address public immutable devAddr;

    uint256 public emissionPeriod = 1 weeks; // default is 1 week

    IMiningPool public liquidityMining;
    IMiningPool public commitmentMining;

    uint256 public constant INITIAL_EMISSION = 1000000 ether; // 1e24
    uint256 public constant MIN_RATE_NUMERATOR = 5; // 0.0005
    uint256 public constant MIN_RATE_DENOMINATOR = 10000; // 0.0005

    struct Rate {
        uint256 numerator;
        uint256 denominator;
    }

    struct Weight {
        uint256 commitmentMining;
        uint256 liquidityMining;
        uint256 dev;
        uint256 caller;
    }

    // Commitment mining: 47.45%, Liquidity mining: 47.45%, Dev: 5%, Caller: 0.1%
    Weight public weight = Weight(4745, 4745, 500, 10);

    uint256 public emissionStarted;

    uint256 public emissionWeekNum;

    event TokenEmission(uint256 amount);
    event EmissionPeriodUpdated(uint256 newPeriod);

    constructor(
        address _devAddr,
        address _gov,
        address _visionToken
    ) Governed() {
        devAddr = _devAddr;
        visionToken = VisionToken(_visionToken);
        Governed.setGovernance(_gov);
    }

    /**
     * @notice It starts the 7 days countdown to the mining launch.
     */
    function setMiningPool(address _liquidityMining, address _commitmentMining)
        public
        governed
    {
        liquidityMining = IMiningPool(_liquidityMining);
        commitmentMining = IMiningPool(_commitmentMining);
    }

    function start() public governed {
        emissionStarted = block.timestamp;
    }

    function setWeight(
        uint256 commitment,
        uint256 liquidity,
        uint256 dev,
        uint256 caller
    ) public governed {
        require(commitment < 1e4, "prevent overflow");
        require(liquidity < 1e4, "prevent overflow");
        require(dev < 1e4, "prevent overflow");
        require(caller < 1e4, "prevent overflow");
        weight = Weight(commitment, liquidity, dev, caller);
    }

    function setEmissionPeriod(uint256 period) public governed {
        require(address(liquidityMining) != address(0), "Not configured");
        require(address(commitmentMining) != address(0), "Not configured");
        emissionPeriod = period;
        liquidityMining.setMiningPeriod(period);
        commitmentMining.setMiningPeriod(period);
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
        Weight memory emission = _weighted(emissionAmount);
        visionToken.mint(address(commitmentMining), emission.commitmentMining);
        visionToken.mint(address(liquidityMining), emission.liquidityMining);
        visionToken.mint(devAddr, emission.dev);
        visionToken.mint(msg.sender, emission.caller);
        commitmentMining.allocate(emission.commitmentMining);
        liquidityMining.allocate(emission.liquidityMining);
        emit TokenEmission(emissionAmount);
    }

    function _weighted(uint256 num) internal view returns (Weight memory) {
        uint256 sum =
            weight
                .commitmentMining
                .add(weight.liquidityMining)
                .add(weight.dev)
                .add(weight.caller);
        return
            Weight(
                num.mul(weight.commitmentMining).div(sum),
                num.mul(weight.liquidityMining).div(sum),
                num.mul(weight.dev).div(sum),
                num.mul(weight.caller).div(sum)
            );
    }
}
