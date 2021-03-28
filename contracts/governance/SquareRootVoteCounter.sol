//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "../interfaces/IVoteCounter.sol";
import "../interfaces/IVisionFarm.sol";
import "../libraries/Sqrt.sol";

contract SquareRootVoteCounter is IVoteCounter {
    IVisionFarm public immutable visionFarm;

    using Sqrt for uint256;

    constructor(address _visionFarm) {
        visionFarm = IVisionFarm(_visionFarm);
    }

    /**
     * @notice The voting power of a voter is the square root of the dispatchable
     *  farmers that is the mulciplication of the staked amount and the remaining
     *  locking period in epoch(4 weeks) unit.
     */
    function getVotes(address voter) external view override returns (uint256) {
        uint256 currentEpoch = visionFarm.getCurrentEpoch();
        uint256 dispatchableFarmersForNextFarm =
            visionFarm.dispatchableFarmers(voter, currentEpoch + 1);
        return dispatchableFarmersForNextFarm.sqrt();
    }
}
