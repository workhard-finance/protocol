//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Enumerable.sol";
import "../../core/governance/interfaces/IVotingEscrowToken.sol";
import "../../core/governance/interfaces/IVotingEscrowLock.sol";
import "../../core/governance/Governed.sol";
import "../../utils/Utils.sol";
import "../../utils/HasInitializer.sol";

struct Distribution {
    uint256 totalDistribution;
    uint256 balance;
    mapping(uint256 => uint256) tokenPerWeek; // key is week num
    mapping(uint256 => uint256) claimStartWeekNum; // key is lock id
}

/** @title Vision Farm */
contract DividendPool is Governed, HasInitializer {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using Utils for address[];

    address public immutable veVISION; // a.k.a RIGHT
    address public immutable veLocker;

    mapping(address => bool) distributors;

    mapping(address => Distribution) public distributions;

    address[] public distributedTokens;

    /** @notice The block timestamp when the contract is deployed */
    uint256 public genesis;

    uint256 public immutable epochUnit = 1 weeks; // default 1 epoch is 1 week

    address private _initalizer;

    constructor(address _gov, address _RIGHT) Governed() HasInitializer() {
        veVISION = _RIGHT;
        veLocker = IVotingEscrowToken(_RIGHT).veLocker();
        Governed.setGovernance(_gov);
    }

    modifier distributorsOnly {
        require(distributors[msg.sender], "Not a registered distributor");
        _;
    }

    // distribution

    function distribute(address _token, uint256 _amount) public {
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        uint256 newBalance = IERC20(_token).balanceOf(address(this));
        Distribution storage distribution = distributions[_token];
        if (distribution.totalDistribution == 0) {
            distributedTokens.push(_token);
        }
        uint256 increment = newBalance - distribution.balance;
        distribution.balance = newBalance;
        distribution.totalDistribution += increment;
        uint256 weekNum = getCurrentEpoch();
        distribution.tokenPerWeek[weekNum] += increment;
    }

    // claim

    function claim(address token) public {
        uint256 until = getCurrentEpoch().sub(1);
        claim(token, until);
    }

    function claim(address token, uint256 until) public {
        uint256 myLocks = IVotingEscrowLock(veLocker).balanceOf(msg.sender);
        for (uint256 i = 0; i < myLocks; i++) {
            uint256 lockId =
                IERC721Enumerable(veLocker).tokenOfOwnerByIndex(msg.sender, i);
            _claim(token, lockId, until);
        }
    }

    function claim(address[] memory tokens) public {
        for (uint256 i = 0; i < tokens.length; i++) {
            claim(tokens[i]);
        }
    }

    // governance or initializer

    function init(address jobBoard, address marketplace) public initializer {
        _addDistributor(jobBoard);
        _addDistributor(marketplace);
        genesis = (block.timestamp / 1 weeks) * 1 weeks;
    }

    function addDistributor(address distributor) public governed {
        _addDistributor(distributor);
    }

    function removeDistributor(address distributor) public governed {
        require(distributors[distributor], "Not a registered distributor");
        distributors[distributor] = false;
    }

    /** @notice 1 epoch is 1 week */
    function getCurrentEpoch() public view returns (uint256) {
        return getEpoch(block.timestamp);
    }

    function getNextEpoch() public view returns (uint256) {
        return getCurrentEpoch() + 1;
    }

    function getEpoch(uint256 timestamp) public view returns (uint256) {
        return (timestamp - genesis) / epochUnit;
    }

    function _addDistributor(address distributor) internal {
        require(!distributors[distributor], "Already registered");
        distributors[distributor] = true;
    }

    function _claim(
        address _token,
        uint256 _tokenId,
        uint256 _until
    ) internal {
        Distribution storage distribution = distributions[_token];
        uint256 claimable = _claimable(distribution, _tokenId, _until);
        distribution.claimStartWeekNum[_tokenId] = _until + 1;
        IERC20(_token).safeTransfer(msg.sender, claimable);
    }

    function _claimable(
        Distribution storage distribution,
        uint256 _tokenId,
        uint256 _until
    ) internal view returns (uint256 amount) {
        uint256 currentEpoch = getCurrentEpoch();
        require(_until < currentEpoch, "Current epoch is being updated.");
        uint256 accumulated;
        uint256 epochCursor = distribution.claimStartWeekNum[_tokenId];
        while (epochCursor <= _until) {
            uint256 timestamp = genesis + epochCursor * 1 weeks;
            // calculate amount;
            uint256 bal =
                IVotingEscrowToken(veVISION).balanceOfAt(msg.sender, timestamp);
            uint256 supply =
                IVotingEscrowToken(veVISION).totalSupplyAt(timestamp);
            accumulated += distribution.tokenPerWeek[epochCursor].mul(bal).div(
                supply
            );
            // update cursor
            epochCursor += 1;
        }
        return accumulated;
    }
}
