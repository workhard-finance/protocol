//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";
import "../../core/dividend/interfaces/IDividendPool.sol";
import "../../core/governance/Governed.sol";
import "../../core/governance/TimelockedGovernance.sol";
import "../../core/governance/interfaces/IVoteCounter.sol";
import "../../utils/Sqrt.sol";
struct Proposal {
    address proposer;
    uint256 start;
    uint256 end;
    uint256 totalForVotes;
    uint256 totalAgainstVotes;
    mapping(uint256 => uint256) forVotes; // votingRightId => for vote amount
    mapping(uint256 => uint256) againstVotes; // votingRightId => against vote amount
}

struct VotingRule {
    uint256 minimumPending;
    uint256 maximumPending;
    uint256 minimumVotingPeriod;
    uint256 maximumVotingPeriod;
    uint256 minimumVotesForProposing;
    uint256 minimumVotes;
    IVoteCounter voteCounter;
}

/**
 * @notice referenced openzeppelin's TimelockController.sol
 */
contract WorkersUnion is Pausable, Governed, Initializable {
    using SafeMath for uint256;
    using Sqrt for uint256;

    enum VotingState {Pending, Voting, Passed, Rejected, Executed} // Enum

    bytes32 public constant NO_DEPENDENCY = bytes32(0);

    VotingRule public votingRule;

    mapping(bytes32 => Proposal) public proposals;

    uint256 private _launch;

    event TxProposed(
        bytes32 indexed txHash,
        address target,
        uint256 value,
        bytes data,
        bytes32 predecessor,
        bytes32 salt,
        uint256 start,
        uint256 end
    );

    event BatchTxProposed(
        bytes32 indexed txHash,
        address[] target,
        uint256[] value,
        bytes[] data,
        bytes32 predecessor,
        bytes32 salt,
        uint256 start,
        uint256 end
    );

    event Vote(bytes32 txHash, address voter, bool forVote);
    event VoteUpdated(bytes32 txHash, uint256 forVotes, uint256 againsVotes);

    function initialize(
        address _voteCounter,
        address _timelockGov,
        uint256 _launchDelay
    ) public initializer {
        votingRule = VotingRule(
            1 days, // minimum pending for vote
            1 weeks, // maximum pending for vote
            1 weeks, // minimum voting period
            4 weeks, // maximum voting period
            0 gwei, // minimum votes for proposing
            0 gwei, // minimum votes
            IVoteCounter(_voteCounter)
        );
        Governed.initialize(_timelockGov);
        _pause();
        _launch = block.timestamp.add(_launchDelay);
    }

    /**
     * @dev Contract might receive/hold ETH as part of the maintenance process.
     */
    receive() external payable {}

    function launch() public {
        require(block.timestamp >= _launch, "Wait a bit please.");
        _unpause();
    }

    function changeVotingRule(
        uint256 minimumPendingPeriod,
        uint256 maximumPendingPeriod,
        uint256 minimumVotingPeriod,
        uint256 maximumVotingPeriod,
        uint256 minimumVotesForProposing,
        uint256 minimumVotes,
        IVoteCounter voteCounter
    ) public governed {
        uint256 totalVotes = voteCounter.getTotalVotes();

        require(minimumPendingPeriod <= maximumPendingPeriod, "invalid arg");
        require(minimumVotingPeriod <= maximumVotingPeriod, "invalid arg");
        require(minimumVotingPeriod >= 1 days, "too short");
        require(minimumPendingPeriod >= 1 days, "too short");
        require(maximumVotingPeriod <= 30 days, "too long");
        require(maximumPendingPeriod <= 30 days, "too long");
        require(
            minimumVotesForProposing <= totalVotes.div(10),
            "too large number"
        );
        require(minimumVotes <= totalVotes.div(2), "too large number");
        require(address(voteCounter) != address(0), "null address");
        votingRule = VotingRule(
            minimumPendingPeriod,
            maximumPendingPeriod,
            minimumVotingPeriod,
            maximumVotingPeriod,
            minimumVotesForProposing,
            minimumVotes,
            voteCounter
        );
    }

    function proposeTx(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt,
        uint256 startsIn,
        uint256 votingPeriod
    ) public {
        _beforePropose(startsIn, votingPeriod);
        bytes32 txHash =
            _timelock().hashOperation(target, value, data, predecessor, salt);
        _propose(txHash, startsIn, votingPeriod);
        emit TxProposed(
            txHash,
            target,
            value,
            data,
            predecessor,
            salt,
            block.timestamp + startsIn,
            block.timestamp + startsIn + votingPeriod
        );
    }

    function proposeBatchTx(
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 predecessor,
        bytes32 salt,
        uint256 startsIn,
        uint256 votingPeriod
    ) public whenNotPaused {
        _beforePropose(startsIn, votingPeriod);
        bytes32 txHash =
            _timelock().hashOperationBatch(
                target,
                value,
                data,
                predecessor,
                salt
            );
        _propose(txHash, startsIn, votingPeriod);
        emit BatchTxProposed(
            txHash,
            target,
            value,
            data,
            predecessor,
            salt,
            block.timestamp + startsIn,
            block.timestamp + startsIn + votingPeriod
        );
    }

    /**
     * @notice Should use vote(bytes32, uint256[], bool) when too many voting rights are delegated to avoid out of gas.
     */
    function vote(bytes32 txHash, bool agree) public {
        uint256[] memory votingRights =
            votingRule.voteCounter.votingRights(msg.sender);
        manualVote(txHash, votingRights, agree);
    }

    /**
     * @notice The voting will be updated if the voter already voted. Please
     *      note that the voting power may change by the locking period or others.
     *      To have more detail information about how voting power is computed,
     *      Please go to the QVCounter.sol.
     */
    function manualVote(
        bytes32 txHash,
        uint256[] memory rightIds,
        bool agree
    ) public {
        Proposal storage proposal = proposals[txHash];
        uint256 timestamp = proposal.start;
        require(
            getVotingStatus(txHash) == VotingState.Voting,
            "Not in the voting period"
        );
        uint256 totalForVotes = proposal.totalForVotes;
        uint256 totalAgainstVotes = proposal.totalAgainstVotes;
        for (uint256 i = 0; i < rightIds.length; i++) {
            uint256 id = rightIds[i];
            require(
                votingRule.voteCounter.voterOf(id) == msg.sender,
                "not the voting right owner"
            );
            uint256 prevForVotes = proposal.forVotes[id];
            uint256 prevAgainstVotes = proposal.againstVotes[id];
            uint256 votes = votingRule.voteCounter.getVotes(id, timestamp);
            proposal.forVotes[id] = agree ? votes : 0;
            proposal.againstVotes[id] = agree ? 0 : votes;
            totalForVotes = totalForVotes.add(agree ? votes : 0).sub(
                prevForVotes
            );
            totalAgainstVotes = totalAgainstVotes.add(agree ? 0 : votes).sub(
                prevAgainstVotes
            );
        }
        proposal.totalForVotes = totalForVotes;
        proposal.totalAgainstVotes = totalAgainstVotes;
        emit Vote(txHash, msg.sender, agree);
        emit VoteUpdated(txHash, totalForVotes, totalAgainstVotes);
    }

    function getVotingStatus(bytes32 txHash) public view returns (VotingState) {
        Proposal storage proposal = proposals[txHash];
        require(proposal.start != 0, "Not an existing proposal");
        if (block.timestamp < proposal.start) return VotingState.Pending;
        else if (block.timestamp <= proposal.end) return VotingState.Voting;
        else if (_timelock().isOperationDone(txHash))
            return VotingState.Executed;
        else if (proposal.totalForVotes < votingRule.minimumVotes)
            return VotingState.Rejected;
        else if (proposal.totalForVotes > proposal.totalAgainstVotes)
            return VotingState.Passed;
        else return VotingState.Rejected;
    }

    function getVotesFor(address account, bytes32 txHash)
        public
        view
        returns (uint256)
    {
        uint256 timestamp = proposals[txHash].start;
        return getVotesAt(account, timestamp);
    }

    function getVotesAt(address account, uint256 timestamp)
        public
        view
        returns (uint256)
    {
        uint256[] memory votingRights =
            votingRule.voteCounter.votingRights(account);
        uint256 votes;
        for (uint256 i = 0; i < votingRights.length; i++) {
            votes = votes.add(
                votingRule.voteCounter.getVotes(votingRights[i], timestamp)
            );
        }
        return votes;
    }

    function schedule(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) public {
        bytes32 txHash =
            _timelock().hashOperation(target, value, data, predecessor, salt);
        require(
            getVotingStatus(txHash) == VotingState.Passed,
            "vote is not passed"
        );
        _timelock().forceSchedule(
            target,
            value,
            data,
            predecessor,
            salt,
            _timelock().getMinDelay()
        );
    }

    function scheduleBatch(
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) public {
        bytes32 txHash =
            _timelock().hashOperationBatch(
                target,
                value,
                data,
                predecessor,
                salt
            );
        require(
            getVotingStatus(txHash) == VotingState.Passed,
            "vote is not passed"
        );
        _timelock().forceScheduleBatch(
            target,
            value,
            data,
            predecessor,
            salt,
            _timelock().getMinDelay()
        );
    }

    function execute(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) public payable {
        bytes32 txHash =
            _timelock().hashOperation(target, value, data, predecessor, salt);
        require(
            getVotingStatus(txHash) == VotingState.Passed,
            "vote is not passed"
        );
        _timelock().execute{value: value}(
            target,
            value,
            data,
            predecessor,
            salt
        );
    }

    function executeBatch(
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) public payable {
        require(target.length == value.length, "length mismatch");
        require(target.length == data.length, "length mismatch");
        bytes32 txHash =
            _timelock().hashOperationBatch(
                target,
                value,
                data,
                predecessor,
                salt
            );
        require(
            getVotingStatus(txHash) == VotingState.Passed,
            "vote is not passed"
        );
        uint256 valueSum = 0;
        for (uint256 i = 0; i < value.length; i++) {
            valueSum += value[i];
        }
        _timelock().executeBatch{value: valueSum}(
            target,
            value,
            data,
            predecessor,
            salt
        );
    }

    function _propose(
        bytes32 txHash,
        uint256 startsIn,
        uint256 votingPeriod
    ) private whenNotPaused {
        require(proposals[txHash].proposer == address(0));
        Proposal storage proposal = proposals[txHash];
        proposal.proposer = msg.sender;
        proposal.start = block.timestamp + startsIn;
        proposal.end = proposal.start + votingPeriod;
    }

    function _beforePropose(uint256 startsIn, uint256 votingPeriod)
        private
        view
    {
        uint256 votes = getVotesAt(msg.sender, block.timestamp);
        require(
            votingRule.minimumVotesForProposing <= votes,
            "Not enough votes for proposing."
        );
        require(
            votingRule.minimumPending <= startsIn,
            "Pending period is too short."
        );
        require(
            startsIn <= votingRule.maximumPending,
            "Pending period is too long."
        );
        require(
            votingRule.minimumVotingPeriod <= votingPeriod,
            "Voting period is too short."
        );
        require(
            votingPeriod <= votingRule.maximumVotingPeriod,
            "Voting period is too long."
        );
    }

    function _timelock() internal view returns (TimelockedGovernance) {
        return TimelockedGovernance(payable(_gov));
    }
}
