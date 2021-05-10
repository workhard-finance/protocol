//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
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
contract WorkersUnion is Pausable, Governed {
    IDividendPool public dividendPool;
    using SafeMath for uint256;
    using Sqrt for uint256;

    enum VotingState {Pending, Voting, Passed, Rejected, Executed} // Enum

    bytes32 public constant NO_DEPENDENCY = bytes32(0);

    Memorandom public memorandom;

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

    constructor(
        address _dividendPool,
        address _voteCounter,
        address _timelockGov
    ) {
        dividendPool = IDividendPool(_dividendPool);
        memorandom = Memorandom(
            1 days, // minimum pending for vote
            1 weeks, // maximum pending for vote
            1 weeks, // minimum voting period
            4 weeks, // maximum voting period
            100 gwei, // minimum votes for proposing
            1000 gwei, // minimum votes
            IVoteCounter(_voteCounter)
        );
        setGovernance(_timelockGov);
        _pause();
        _launch = block.timestamp + 4 weeks;
    }

    /**
     * @dev Contract might receive/hold ETH as part of the maintenance process.
     */
    receive() external payable {}

    function launch() public {
        require(block.timestamp >= _launch, "Wait a bit please.");
        _unpause();
    }

    function changeMemorandom(
        uint256 minimumPendingPeriod,
        uint256 maximumPendingPeriod,
        uint256 minimumVotingPeriod,
        uint256 maximumVotingPeriod,
        uint256 minimumVotesForProposing,
        uint256 minimumVotes,
        IVoteCounter voteCounter
    ) public governed {
        uint256 maxLock = dividendPool.maximumLock();
        uint256 totalSupply = IERC20(dividendPool.visionToken()).totalSupply();
        uint256 c = totalSupply.mul(maxLock).sqrt();
        require(minimumPendingPeriod <= maximumPendingPeriod, "invalid arg");
        require(minimumVotingPeriod <= maximumVotingPeriod, "invalid arg");
        require(minimumVotingPeriod >= 1 days, "too short");
        require(minimumPendingPeriod >= 1 days, "too short");
        require(maximumVotingPeriod <= 30 days, "too long");
        require(maximumPendingPeriod <= 30 days, "too long");
        require(minimumVotesForProposing <= c.div(100), "too large number");
        require(minimumVotes <= c.div(10), "too large number");
        require(address(voteCounter) != address(0), "null address");
        memorandom = Memorandom(
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
     * @notice The voting will be updated if the voter already voted. Please
     *      note that the voting power may change by the locking period or others.
     *      To have more detail information about how voting power is computed,
     *      Please go to the QVCounter.sol.
     */
    function vote(bytes32 txHash, bool agree) public {
        Proposal storage proposal = proposals[txHash];
        require(
            getVotingStatus(txHash) == VotingState.Voting,
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
        proposal.totalAgainstVotes = proposal
            .totalAgainstVotes
            .add(agree ? 0 : votes)
            .sub(prevAgainstVotes);
        emit Vote(txHash, msg.sender, agree);
        emit VoteUpdated(
            txHash,
            proposal.totalForVotes,
            proposal.totalAgainstVotes
        );
    }

    function getVotingStatus(bytes32 txHash) public view returns (VotingState) {
        Proposal storage proposal = proposals[txHash];
        require(proposal.start != 0, "Not an existing proposal");
        if (block.timestamp < proposal.start) return VotingState.Pending;
        else if (block.timestamp <= proposal.end) return VotingState.Voting;
        else if (_timelock().isOperationDone(txHash))
            return VotingState.Executed;
        else if (proposal.totalForVotes < memorandom.minimumVotes)
            return VotingState.Rejected;
        else if (proposal.totalForVotes > proposal.totalAgainstVotes)
            return VotingState.Passed;
        else return VotingState.Rejected;
    }

    function getVotes(address account) public view returns (uint256) {
        return memorandom.voteCounter.getVotes(account);
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
        uint256 votes = memorandom.voteCounter.getVotes(msg.sender);
        require(
            memorandom.minimumVotesForProposing <= votes,
            "Not enough votes for proposing."
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

    function _timelock() internal view returns (TimelockedGovernance) {
        return TimelockedGovernance(payable(gov));
    }
}
