//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/EnumerableMap.sol";

import "../../../core/governance/libraries/VotingEscrowLib.sol";
import "../../../core/governance/libraries/VotingEscrowToken.sol";
import "../../../core/governance/interfaces/IVotingEscrowLock.sol";
import "../../../utils/HasInitializer.sol";

/**
 * @dev Voting Escrow Lock is the refactored solidity implementation of veCRV.
 *      The token lock is ERC721 and transferrable.
 *      Its original code https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/VotingEscrow.vy
 */

contract VotingEscrowLock is
    IVotingEscrowLock,
    ERC721,
    ReentrancyGuard,
    HasInitializer
{
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableMap for EnumerableMap.UintToAddressMap;

    address public override baseToken;
    address public override veToken;
    uint256 public override totalLockedSupply;
    uint256 public constant override MAXTIME = 4 * (365 days);

    mapping(uint256 => Lock) public override locks;

    mapping(address => EnumerableSet.UintSet) private _delegated;
    EnumerableMap.UintToAddressMap private _rightOwners;

    event LockCreated(uint256 veLockId);
    event LockUpdate(uint256 veLockId, uint256 amount, uint256 end);
    event Withdraw(uint256 veLockId, uint256 amount);
    event VoteDelegated(uint256 veLockId, address to);

    modifier onlyOwner(uint256 veLockId) {
        require(
            ownerOf(veLockId) == msg.sender,
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

    function createLock(uint256 amount, uint256 epochs) public override {
        uint256 until = block.timestamp + epochs * 1 weeks;
        createLockUntil(amount, until);
    }

    function createLockUntil(uint256 amount, uint256 lockEnd) public override {
        require(amount > 0, "should be greater than zero");
        uint256 roundedEnd = (lockEnd / 1 weeks) * 1 weeks;

        uint256 veLockId =
            uint256(keccak256(abi.encodePacked(block.number, msg.sender)));
        require(!_exists(veLockId), "Already exists");
        locks[veLockId].start = block.timestamp;
        _safeMint(msg.sender, veLockId);
        _updateLock(veLockId, amount, roundedEnd);
        emit LockCreated(veLockId);
    }

    function increaseAmount(uint256 veLockId, uint256 amount) public override {
        require(amount > 0, "should be greater than zero");
        uint256 newAmount = locks[veLockId].amount + amount;
        _updateLock(veLockId, newAmount, locks[veLockId].end);
    }

    function extendLock(uint256 veLockId, uint256 epochs)
        public
        override
        onlyOwner(veLockId)
    {
        uint256 until = block.timestamp + epochs * 1 weeks;
        extendLockUntil(veLockId, until);
    }

    function extendLockUntil(uint256 veLockId, uint256 end)
        public
        override
        onlyOwner(veLockId)
    {
        uint256 roundedEnd = (end / 1 weeks) * 1 weeks;
        _updateLock(veLockId, locks[veLockId].amount, roundedEnd);
    }

    function withdraw(uint256 veLockId) public override onlyOwner(veLockId) {
        Lock memory lock = locks[veLockId];
        require(block.timestamp >= lock.end, "Locked.");
        // transfer
        IERC20(baseToken).safeTransfer(msg.sender, lock.amount);
        totalLockedSupply -= lock.amount;
        VotingEscrowToken(veToken).checkpoint(veLockId, lock, Lock(0, 0, 0));
        locks[veLockId].amount = 0;
        emit Withdraw(veLockId, lock.amount);
    }

    function delegate(uint256 veLockId, address to) external override {
        require(
            ownerOf(veLockId) == msg.sender,
            "Only owner can decide the delegatee"
        );
        _delegate(veLockId, to);
    }

    function delegateeOf(uint256 veLockId)
        public
        view
        override
        returns (address)
    {
        if (!_exists(veLockId)) {
            return address(0);
        }
        (bool delegated, address delegatee) = _rightOwners.tryGet(veLockId);
        return delegated ? delegatee : ownerOf(veLockId);
    }

    function delegatedRights(address voter)
        public
        view
        override
        returns (uint256)
    {
        require(
            voter != address(0),
            "VotingEscrowLock: delegate query for the zero address"
        );
        return _delegated[voter].length();
    }

    function delegatedRightByIndex(address voter, uint256 idx)
        public
        view
        override
        returns (uint256 veLockId)
    {
        require(
            voter != address(0),
            "VotingEscrowLock: delegate query for the zero address"
        );
        return _delegated[voter].at(idx);
    }

    function _updateLock(
        uint256 veLockId,
        uint256 amount,
        uint256 end
    ) internal nonReentrant {
        Lock memory prevLock = locks[veLockId];
        Lock memory newLock = Lock(amount, prevLock.start, end);
        require(_exists(veLockId), "Lock does not exist.");
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
        locks[veLockId] = newLock;

        // 4. updateCheckpoint
        VotingEscrowToken(veToken).checkpoint(veLockId, prevLock, newLock);
        emit LockUpdate(veLockId, amount, end);
    }

    function _delegate(uint256 veLockId, address to) internal {
        address _voter = delegateeOf(veLockId);
        _delegated[_voter].remove(veLockId);
        _delegated[to].add(veLockId);
        _rightOwners.set(veLockId, to);
        emit VoteDelegated(veLockId, to);
    }

    function _beforeTokenTransfer(
        address,
        address to,
        uint256 veLockId
    ) internal override {
        _delegate(veLockId, to);
    }
}
