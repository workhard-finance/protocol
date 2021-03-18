// SPDX-License-Identifier: Unlicense
// Refactored synthetix StakingRewards.sol for general purpose mining pool logic.
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./ERC20Recoverer.sol";
import "../tokens/CommitmentToken.sol";
import "../interfaces/ITokenEmitter.sol";

contract MiningPool is ReentrancyGuard, Pausable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    ITokenEmitter public immutable tokenEmitter;

    uint256 public miningEnds = 0;
    uint256 public miningRate = 0;
    uint256 public lastUpdateTime;
    uint256 private _tokenPerMiner;

    mapping(address => uint256) public paidTokenPerMiner;
    mapping(address => uint256) public _mined;

    uint256 public totalMiners;
    mapping(address => uint256) public dispatchedMiners;

    event Allocated(uint256 amount);
    event Dispatched(address indexed user, uint256 numOfMiners);
    event Withdrawn(address indexed user, uint256 numOfMiners);
    event Mined(address indexed user, uint256 amount);

    constructor(address _token, address _tokenEmitter) {
        token = IERC20(_token);
        tokenEmitter = ITokenEmitter(_tokenEmitter);
    }

    modifier onlyTokenEmitter() {
        require(
            msg.sender == address(tokenEmitter),
            "Only the token emitter can call this function"
        );
        _;
    }

    modifier recordMining(address account) {
        _tokenPerMiner = tokenPerMiner();
        lastUpdateTime = lastTimeMiningApplicable();
        if (account != address(0)) {
            _mined[account] = mined(account);
            paidTokenPerMiner[account] = _tokenPerMiner;
        }
        _;
    }

    function allocate(uint256 amount)
        public
        onlyTokenEmitter
        recordMining(address(0))
    {
        uint256 miningPeriod = tokenEmitter.emissionPeriod();
        if (block.timestamp >= miningEnds) {
            miningRate = amount.div(miningPeriod);
        } else {
            uint256 remaining = miningEnds.sub(block.timestamp);
            uint256 leftover = remaining.mul(miningRate);
            miningRate = amount.add(leftover).div(miningPeriod);
        }

        // Ensure the provided mining amount is not more than the balance in the contract.
        // This keeps the mining rate in the right range, preventing overflows due to
        // very high values of miningRate in the mined and tokenPerMiner functions;
        // (allocated_amount + leftover) must be less than 2^256 / 10^18 to avoid overflow.
        uint256 balance = token.balanceOf(address(this));
        require(
            miningRate <= balance.div(miningPeriod),
            "mining rate is too high"
        );

        lastUpdateTime = block.timestamp;
        miningEnds = block.timestamp.add(miningPeriod);
        emit Allocated(amount);
    }

    function _dispatchMiners(uint256 miners)
        internal
        nonReentrant
        whenNotPaused
        recordMining(msg.sender)
    {
        require(miners > 0, "Cannot stake 0");
        totalMiners = totalMiners.add(miners);
        dispatchedMiners[msg.sender] = dispatchedMiners[msg.sender].add(miners);
        emit Dispatched(msg.sender, miners);
    }

    function _withdrawMiners(uint256 miners)
        internal
        nonReentrant
        recordMining(msg.sender)
    {
        require(miners > 0, "Cannot withdraw 0");
        totalMiners = totalMiners.sub(miners);
        dispatchedMiners[msg.sender] = dispatchedMiners[msg.sender].sub(miners);
        emit Withdrawn(msg.sender, miners);
    }

    function _mine() internal nonReentrant recordMining(msg.sender) {
        uint256 amount = _mined[msg.sender];
        if (amount > 0) {
            _mined[msg.sender] = 0;
            token.safeTransfer(msg.sender, amount);
            emit Mined(msg.sender, amount);
        }
    }

    function lastTimeMiningApplicable() public view returns (uint256) {
        return Math.min(block.timestamp, miningEnds);
    }

    function tokenPerMiner() public view returns (uint256) {
        if (totalMiners == 0) {
            return _tokenPerMiner;
        }
        return
            _tokenPerMiner.add(
                lastTimeMiningApplicable()
                    .sub(lastUpdateTime)
                    .mul(miningRate)
                    .mul(1e18)
                    .div(totalMiners)
            );
    }

    function mined(address account) public view returns (uint256) {
        // prev mined + ((token/miner - paidToken/miner) 1e18 unit) * dispatchedMiner
        return
            dispatchedMiners[account]
                .mul(tokenPerMiner().sub(paidTokenPerMiner[account]))
                .div(1e18)
                .add(_mined[account]);
    }

    function getMineableForPeriod() public view returns (uint256) {
        uint256 miningPeriod = tokenEmitter.emissionPeriod();
        return miningRate.mul(miningPeriod);
    }
}
