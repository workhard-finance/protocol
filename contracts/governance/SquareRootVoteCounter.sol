//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "../interfaces/IVoteCounter.sol";
import "../interfaces/IVisionFarm.sol";

contract SquareRootVoteCounter is IVoteCounter {
    IVisionFarm public immutable visionFarm;

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
        uint256 currentDispatchableFarmers =
            visionFarm.dispatchableFarmers(voter, currentEpoch);
        return sqrt(currentDispatchableFarmers);
    }

    /**
     * @dev This code is written by Noah Zinsmeister @ Uniswap
     * https://github.com/Uniswap/uniswap-v2-core/blob/v1.0.1/contracts/libraries/Math.sol
     */
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
