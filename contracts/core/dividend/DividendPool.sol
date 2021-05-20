//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";
import "../../core/governance/interfaces/IVotingEscrowToken.sol";
import "../../core/governance/interfaces/IVotingEscrowLock.sol";
import "../../core/dividend/interfaces/IDividendPool.sol";
import "../../core/governance/Governed.sol";
import "../../utils/Utils.sol";

struct Distribution {
    uint256 totalDistribution;
    uint256 balance;
    mapping(uint256 => uint256) tokenPerWeek; // key is week num
    mapping(uint256 => uint256) claimStartWeekNum; // key is lock id
}

/** @title Dividend Pool */
contract DividendPool is
    IDividendPool,
    Governed,
    Initializable,
    ReentrancyGuard
{
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using Utils for address[];

    address public override veVISION; // a.k.a RIGHT
    address public override veLocker;

    mapping(address => Distribution) public distributions;

    mapping(address => bool) public override distributed;

    address[] internal _featuredRewards;

    /** @notice The block timestamp when the contract is deployed */
    uint256 public genesis;

    uint256 public constant epochUnit = 1 weeks; // default 1 epoch is 1 week

    mapping(address => bool) admin;

    event NewReward(address token);

    event NewDistribution(address indexed token, uint256 amount);

    function initialize(address _gov, address _RIGHT) public initializer {
        veVISION = _RIGHT;
        veLocker = IVotingEscrowToken(_RIGHT).veLocker();
        Governed.initialize(_gov);
        genesis = (block.timestamp / epochUnit) * epochUnit;
    }

    modifier onlyAdmin() {
        require(admin[msg.sender] || msg.sender == gov, "Not allowed");
        _;
    }

    // distribution

    function distribute(address _token, uint256 _amount)
        public
        override
        nonReentrant
    {
        if (!distributed[_token]) {
            distributed[_token] = true;
            emit NewReward(_token);
        }
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        uint256 newBalance = IERC20(_token).balanceOf(address(this));
        Distribution storage distribution = distributions[_token];
        uint256 increment = newBalance.sub(distribution.balance);
        distribution.balance = newBalance;
        distribution.totalDistribution += increment;
        uint256 weekNum = getCurrentEpoch();
        distribution.tokenPerWeek[weekNum] += increment;
        emit NewDistribution(_token, _amount);
    }

    // claim

    function claim(address token) public nonReentrant {
        uint256 prevEpochTimestamp = block.timestamp - epochUnit;
        _claimUpTo(token, prevEpochTimestamp);
    }

    function claimUpTo(address token, uint256 timestamp) public nonReentrant {
        _claimUpTo(token, timestamp);
    }

    function claimBatch(address[] memory tokens) public nonReentrant {
        uint256 prevEpochTimestamp = block.timestamp - epochUnit;
        for (uint256 i = 0; i < tokens.length; i++) {
            _claimUpTo(tokens[i], prevEpochTimestamp);
        }
    }

    /** @notice 1 epoch is 1 week */
    function getCurrentEpoch() public view override returns (uint256) {
        return getEpoch(block.timestamp);
    }

    function getNextEpoch() public view returns (uint256) {
        return getCurrentEpoch() + 1;
    }

    function getEpoch(uint256 timestamp) public view returns (uint256) {
        return (timestamp - genesis) / epochUnit;
    }

    function totalDistributed(address token)
        public
        view
        override
        returns (uint256)
    {
        return distributions[token].totalDistribution;
    }

    function distributionBalance(address token)
        public
        view
        override
        returns (uint256)
    {
        return distributions[token].balance;
    }

    function distributionOfWeek(address token, uint256 epochNum)
        public
        view
        override
        returns (uint256)
    {
        return distributions[token].tokenPerWeek[epochNum];
    }

    function claimStartWeek(address token, uint256 veLockId)
        public
        view
        override
        returns (uint256)
    {
        return distributions[token].claimStartWeekNum[veLockId];
    }

    function claimable(address _token) public view override returns (uint256) {
        Distribution storage distribution = distributions[_token];
        uint256 currentEpoch = getCurrentEpoch();
        uint256 myLocks = IVotingEscrowLock(veLocker).balanceOf(msg.sender);
        uint256 acc;
        for (uint256 i = 0; i < myLocks; i++) {
            uint256 lockId =
                IERC721Enumerable(veLocker).tokenOfOwnerByIndex(msg.sender, i);
            acc += _claimable(distribution, lockId, currentEpoch - 1);
        }
        return acc;
    }

    function featuredRewards() public view override returns (address[] memory) {
        return _featuredRewards;
    }

    function setFeaturedRewards(address[] memory featured) public governed {
        _featuredRewards = featured;
    }

    function _claimUpTo(address token, uint256 timestamp) internal {
        uint256 epoch = getEpoch(timestamp);
        uint256 myLocks = IVotingEscrowLock(veLocker).balanceOf(msg.sender);
        for (uint256 i = 0; i < myLocks; i++) {
            uint256 lockId =
                IERC721Enumerable(veLocker).tokenOfOwnerByIndex(msg.sender, i);
            _claim(token, lockId, epoch);
        }
    }

    function _claim(
        address _token,
        uint256 _tokenId,
        uint256 _epoch
    ) internal {
        Distribution storage distribution = distributions[_token];
        uint256 amount = _claimable(distribution, _tokenId, _epoch);
        distribution.claimStartWeekNum[_tokenId] = _epoch + 1;
        distribution.balance = distribution.balance.sub(amount);
        IERC20(_token).safeTransfer(msg.sender, amount);
    }

    function _claimable(
        Distribution storage distribution,
        uint256 _tokenId,
        uint256 _epoch
    ) internal view returns (uint256 amount) {
        uint256 currentEpoch = getCurrentEpoch();
        require(_epoch < currentEpoch, "Current epoch is being updated.");
        uint256 accumulated;
        uint256 epochCursor = distribution.claimStartWeekNum[_tokenId];
        if (epochCursor == 0) {
            (, uint256 _start, ) = IVotingEscrowLock(veLocker).locks(_tokenId);
            epochCursor = getEpoch(_start);
        }
        while (epochCursor <= _epoch) {
            // check the balance when the epoch ends
            uint256 timestamp = genesis + epochCursor * epochUnit + 1 weeks;
            // calculate amount;
            uint256 bal =
                IVotingEscrowToken(veVISION).balanceOfAt(msg.sender, timestamp);
            uint256 supply =
                IVotingEscrowToken(veVISION).totalSupplyAt(timestamp);
            if (supply != 0) {
                accumulated += distribution.tokenPerWeek[epochCursor]
                    .mul(bal)
                    .div(supply);
            }
            // update cursor
            epochCursor += 1;
        }
        return accumulated;
    }
}
