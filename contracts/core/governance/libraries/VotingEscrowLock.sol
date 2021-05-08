//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {Lock} from "../../../core/governance/libraries/VotingEscrowLib.sol";
import {
    VotingEscrowToken
} from "../../../core/governance/libraries/VotingEscrowToken.sol";
import {
    IVotingEscrowLock
} from "../../../core/governance/interfaces/IVotingEscrowLock.sol";

/**
 * @dev Voting Escrow Lock is the refactored solidity implementation of veCRV.
 *      The token lock is ERC721 and transferrable.
 *      Its original code https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/VotingEscrow.vy
 */

contract VotingEscrowLock is IVotingEscrowLock, ERC721, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public baseToken;
    address public veToken;

    uint256 public totalLockedSupply;

    uint256 constant MAXTIME = 4 * (365 days);

    event LockUpdate(uint256 tokenId, uint256 amount, uint256 end);

    mapping(uint256 => Lock) public override locks;

    modifier onlyOwner(uint256 tokenId) {
        require(
            ownerOf(tokenId) == msg.sender,
            "Only the owner can call this function"
        );
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        address _baseToken,
        address _veToken
    ) ERC721(_name, _symbol) {
        _setBaseURI(_baseURI);
        baseToken = _baseToken;
        veToken = _veToken;
    }

    function createLock(uint256 amount, uint256 lockEnd) public nonReentrant {
        require(amount > 0, "should be greater than zero");
        uint256 roundedEnd = (lockEnd / 1 weeks) * 1 weeks;

        uint256 tokenId =
            uint256(keccak256(abi.encodePacked(block.number, msg.sender)));
        _safeMint(msg.sender, tokenId);
        _updateLock(tokenId, amount, roundedEnd);
    }

    function increaseAmount(uint256 tokenId, uint256 amount) public {
        require(amount > 0, "should be greater than zero");
        uint256 newAmount = locks[tokenId].amount + amount;
        _updateLock(tokenId, newAmount, locks[tokenId].end);
    }

    function extendLock(uint256 tokenId, uint256 end)
        public
        onlyOwner(tokenId)
    {
        uint256 roundedEnd = (end / 1 weeks) * 1 weeks;
        _updateLock(tokenId, locks[tokenId].amount, roundedEnd);
    }

    function _updateLock(
        uint256 tokenId,
        uint256 amount,
        uint256 end
    ) internal nonReentrant {
        Lock memory prevLock = locks[tokenId];
        Lock memory newLock = Lock(amount, end);
        require(_exists(tokenId), "Lock does not exist.");
        require(
            prevLock.end == 0 || prevLock.end > block.timestamp,
            "Cannot update expired. Create a new lock."
        );
        require(
            newLock.end > block.timestamp,
            "Unlock time should be in the future"
        );
        require(
            newLock.end <= block.timestamp + MAXTIME,
            "Max lock is 4 years"
        );
        require(
            !(prevLock.amount == newLock.amount && prevLock.end == newLock.end),
            "No update"
        );
        require(
            prevLock.amount <= newLock.amount,
            "new amount should be greater than before"
        );
        require(
            prevLock.end <= newLock.end,
            "new end timestamp should be greater than before"
        );

        uint256 increment = (newLock.amount - prevLock.amount);
        // 2. transfer
        IERC20(baseToken).safeTransferFrom(
            msg.sender,
            address(this),
            increment
        );

        // 3. increase locked amount
        totalLockedSupply += increment;
        locks[tokenId] = newLock;

        // 4. updateCheckpoint
        VotingEscrowToken(veToken).checkpoint(tokenId, prevLock, newLock);
        emit LockUpdate(tokenId, amount, end);
    }

    function withdraw(uint256 tokenId) public nonReentrant onlyOwner(tokenId) {
        Lock memory lock = locks[tokenId];
        require(block.timestamp >= lock.end, "Locked.");
        // transfer
        IERC20(baseToken).safeTransfer(msg.sender, lock.amount);
        totalLockedSupply -= lock.amount;
        VotingEscrowToken(veToken).checkpoint(tokenId, lock, Lock(0, 0));
        locks[tokenId].amount = 0;
    }
}
