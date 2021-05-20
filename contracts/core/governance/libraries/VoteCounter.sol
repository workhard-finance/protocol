//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/EnumerableMap.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";
import "../../../core/governance/interfaces/IVoteCounter.sol";
import "../../../core/governance/interfaces/IVotingEscrowToken.sol";
import "../../../core/governance/interfaces/IVotingEscrowLock.sol";
import "../../../utils/Sqrt.sol";

contract VoteCounter is IVoteCounter, Initializable {
    IVotingEscrowLock veLock;
    IVotingEscrowToken veToken;

    function initialize(address _veToken) public initializer {
        veToken = IVotingEscrowToken(_veToken);
        veLock = IVotingEscrowLock(IVotingEscrowToken(_veToken).veLocker());
    }

    function getTotalVotes() public view virtual override returns (uint256) {
        return veToken.totalSupply();
    }

    function getVotes(uint256 veLockId, uint256 timestamp)
        public
        view
        virtual
        override
        returns (uint256)
    {
        return veToken.balanceOfLockAt(veLockId, timestamp);
    }

    function voterOf(uint256 veLockId)
        external
        view
        virtual
        override
        returns (address)
    {
        return veLock.delegateeOf(veLockId);
    }

    function votingRights(address voter)
        external
        view
        virtual
        override
        returns (uint256[] memory rights)
    {
        uint256 totalLocks = veLock.delegatedRights(voter);
        rights = new uint256[](totalLocks);
        for (uint256 i = 0; i < rights.length; i++) {
            rights[i] = veLock.delegatedRightByIndex(voter, i);
        }
    }
}
