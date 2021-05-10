//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "../../../core/governance/interfaces/IVoteCounter.sol";
import "../../../core/dividend/interfaces/IDividendPool.sol";
import "../../../utils/Sqrt.sol";

contract SquareRootVoteCounter is IVoteCounter {
    IDividendPool public immutable dividendPool;

    using Sqrt for uint256;

    constructor(address _dividendPool) {
        dividendPool = IDividendPool(_dividendPool);
    }

    /**
     * @notice The voting power of a voter is the square root of the dispatchable
     *  farmers that is the mulciplication of the staked amount and the remaining
     *  locking period in epoch(4 weeks) unit.
     */
    function getVotes(address voter) external view override returns (uint256) {
        uint256 currentEpoch = dividendPool.getCurrentEpoch();
        uint256 dispatchableFarmersForNextFarm =
            dividendPool.dispatchableFarmers(voter, currentEpoch + 1);
        return dispatchableFarmersForNextFarm.sqrt();
    }
}
