//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/TimelockController.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../interfaces/IVoteCounter.sol";
import "../mining/VisionFarm.sol";

struct Proposal {
    address proposer;
    bytes32 txHash;
    uint256 start;
    uint256 end;
    uint256 totalForVotes;
    uint256 totalAgainstVotes;
    bool executed;
    mapping(address => uint256) forVotes;
    mapping(address => uint256) againstVotes;
}

struct Memorandom {
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
contract FarmersUnion {
    VisionFarm public visionFarm;
    using SafeMath for uint256;

    enum VotingState {Pending, Voting, Passed, Rejected, Executed} // Enum

    uint256 public constant NO_DEPENDENCY = uint256(0) - 1;

    Memorandom public memorandom;

    Proposal[] public proposals;

    /**
     * @dev Emitted when a call is scheduled as part of operation `id`.
     */
    event NewProposal(uint256 indexed index, bytes32 txHash, bool batchTx);

    event TxProposed(
        bytes32 indexed txHash,
        address target,
        uint256 value,
        bytes data,
        uint256 predecessor,
        uint256 salt
    );

    event BatchTxProposed(
        bytes32 indexed txHash,
        address[] target,
        uint256[] value,
        bytes[] data,
        uint256 predecessor,
        uint256 salt
    );

    /**
     * @dev Emitted when a call is performed as part of operation `id`.
     */
    event ProposalExecuted(uint256 indexed proposalIndex, bytes32 txHash);

    constructor(address _visionFarm, address _voteCounter) {
        visionFarm = VisionFarm(_visionFarm);
        memorandom = Memorandom(
            0 weeks,
            1 weeks,
            1 weeks,
            4 weeks,
            0,
            0,
            IVoteCounter(_voteCounter)
        );
    }

    modifier selfGoverned() {
        require(msg.sender == address(this), "Not a proposal execution");
        _;
    }

    /**
     * @dev Contract might receive/hold ETH as part of the maintenance process.
     */
    receive() external payable {}

    function changeMemorandom(
        uint256 minimumPendingPeriod,
        uint256 maximumPendingPeriod,
        uint256 minimumVotingPeriod,
        uint256 maximumVotingPeriod,
        uint256 minimumVotessForProposing,
        uint256 minimumVotes,
        IVoteCounter voteCounter
    ) public selfGoverned {
        memorandom = Memorandom(
            minimumPendingPeriod,
            maximumPendingPeriod,
            minimumVotingPeriod,
            maximumVotingPeriod,
            minimumVotessForProposing,
            minimumVotes,
            voteCounter
        );
    }

    function proposeTx(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 predecessor,
        uint256 salt,
        uint256 startsIn,
        uint256 votingPeriod
    ) public {
        _beforePropose(startsIn, votingPeriod);
        bytes32 txHash =
            hashTransaction(target, value, data, predecessor, salt);
        _propose(txHash, startsIn, votingPeriod);
        emit TxProposed(txHash, target, value, data, predecessor, salt);
    }

    function proposeBatchTx(
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        uint256 predecessor,
        uint256 salt,
        uint256 startsIn,
        uint256 votingPeriod
    ) public {
        _beforePropose(startsIn, votingPeriod);
        bytes32 txHash =
            hashBatchTransaction(target, value, data, predecessor, salt);
        _propose(txHash, startsIn, votingPeriod);
        emit BatchTxProposed(txHash, target, value, data, predecessor, salt);
    }

    /**
     * @notice The voting will be updated if the voter already voted. Please
     *      note that the voting power may change by the locking period or others.
     *      To have more detail information about how voting power is computed,
     *      Please go to the QVCounter.sol.
     */
    function vote(uint256 proposalId, bool agree) public {
        Proposal storage proposal = proposals[proposalId];
        require(
            getVotingStatus(proposalId) == VotingState.Voting,
            "Not in the voting period"
        );
        uint256 prevForVotes = proposal.forVotes[msg.sender];
        uint256 prevAgainstVotes = proposal.againstVotes[msg.sender];
        uint256 votes = memorandom.voteCounter.getVotes(msg.sender);
        proposal.forVotes[msg.sender] = agree ? votes : 0;
        proposal.againstVotes[msg.sender] = agree ? 0 : votes;
        proposal.totalForVotes = proposal
            .totalForVotes
            .add(agree ? votes : 0)
            .sub(prevForVotes);
        proposal.totalForVotes = proposal
            .totalAgainstVotes
            .add(agree ? 0 : votes)
            .sub(prevAgainstVotes);
    }

    function getVotingStatus(uint256 proposalId)
        public
        view
        returns (VotingState)
    {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.start != 0, "Not an existing proposal");
        if (block.timestamp < proposal.start) return VotingState.Pending;
        else if (block.timestamp <= proposal.end) return VotingState.Voting;
        else if (proposal.executed) return VotingState.Executed;
        else if (proposal.totalForVotes > proposal.totalAgainstVotes)
            return VotingState.Passed;
        else return VotingState.Rejected;
    }

    /**
     * @dev Returns the identifier of an operation containing a single
     * transaction.
     */
    function hashTransaction(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 predecessor,
        uint256 salt
    ) public pure virtual returns (bytes32) {
        return keccak256(abi.encode(target, value, data, predecessor, salt));
    }

    /**
     * @dev Returns the identifier of an operation containing a batch of
     * transactions.
     */
    function hashBatchTransaction(
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        uint256 predecessor,
        uint256 salt
    ) public pure virtual returns (bytes32) {
        return keccak256(abi.encode(target, value, data, predecessor, salt));
    }

    /**
     * @dev Execute a passed proposals' transaction.
     *
     * Emits a {CallExecuted} event.
     *
     * Requirements:
     *
     * - the caller must have the 'executor' role.
     */
    function execute(
        uint256 proposalId,
        address target,
        uint256 value,
        bytes calldata data,
        uint256 predecessor,
        uint256 salt
    ) public payable {
        bytes32 txHash =
            hashTransaction(target, value, data, predecessor, salt);
        _beforeCall(predecessor, proposalId, txHash);
        _call(target, value, data);
        _afterCall(proposalId, txHash);
    }

    /**
     * @dev Execute an (ready) operation containing a batch of transactions.
     *
     * Emits one {CallExecuted} event per transaction in the batch.
     *
     * Requirements:
     *
     * - the caller must have the 'executor' role.
     */
    function executeBatch(
        uint256 proposalId,
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        uint256 predecessor,
        uint256 salt
    ) public payable {
        require(target.length == value.length, "length mismatch");
        require(target.length == data.length, "length mismatch");

        bytes32 txHash =
            hashBatchTransaction(target, value, data, predecessor, salt);
        _beforeCall(predecessor, proposalId, txHash);
        for (uint256 i = 0; i < target.length; ++i) {
            _call(target[i], value[i], data[i]);
        }
        _afterCall(proposalId, txHash);
    }

    function _propose(
        bytes32 txHash,
        uint256 startsIn,
        uint256 votingPeriod
    ) private {
        proposals.push();
        Proposal storage proposal = proposals[proposals.length - 1];
        proposal.proposer = msg.sender;
        proposal.txHash = txHash;
        proposal.start = block.timestamp + startsIn;
        proposal.end = proposal.start + votingPeriod;
        emit NewProposal(proposals.length - 1, txHash, false);
    }

    function _beforePropose(uint256 startsIn, uint256 votingPeriod)
        private
        view
    {
        uint256 votes = memorandom.voteCounter.getVotes(msg.sender);
        require(
            memorandom.minimumVotesForProposing <= votes,
            "Not enought votes for proposing."
        );
        require(
            memorandom.minimumPending <= startsIn,
            "Pending period is too short."
        );
        require(
            startsIn <= memorandom.maximumPending,
            "Pending period is too long."
        );
        require(
            memorandom.minimumVotingPeriod <= votingPeriod,
            "Voting period is too short."
        );
        require(
            votingPeriod <= memorandom.maximumVotingPeriod,
            "Voting period is too long."
        );
    }

    /**
     * @dev Checks before execution of an operation's calls.
     */
    function _beforeCall(
        uint256 predecessor,
        uint256 proposalId,
        bytes32 txHash
    ) private view {
        if (predecessor != NO_DEPENDENCY) {
            require(
                getVotingStatus(predecessor) == VotingState.Executed,
                "missing dependency"
            );
        }
        require(
            getVotingStatus(proposalId) == VotingState.Passed,
            "vote is not passed"
        );
        require(proposals[proposalId].txHash == txHash, "invalid tx data");
    }

    /**
     * @dev Execute an operation's call.
     *
     * Emits a {CallExecuted} event.
     */
    function _call(
        address target,
        uint256 value,
        bytes calldata data
    ) private {
        // solhint-disable-next-line avoid-low-level-calls
        (bool success, ) = target.call{value: value}(data);
        require(success, "TimelockController: underlying transaction reverted");
    }

    /**
     * @dev Checks after execution of an operation's calls.
     */
    function _afterCall(uint256 proposalId, bytes32 txHash) private {
        proposals[proposalId].executed = true;
        emit ProposalExecuted(proposalId, txHash);
    }
}
