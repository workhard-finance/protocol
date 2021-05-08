//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/SafeCast.sol";
import {
    Point,
    Lock
} from "../../../core/governance/libraries/VotingEscrowLib.sol";
import {
    IVotingEscrowLock
} from "../../../core/governance/interfaces/IVotingEscrowLock.sol";
import {
    IVotingEscrowToken
} from "../../../core/governance/interfaces/IVotingEscrowToken.sol";
import {HasInitializer} from "../../../utils/HasInitializer.sol";

/**
 * @dev Voting Escrow Token is the solidity implementation of veCRV
 *      Its original code https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/VotingEscrow.vy
 */

contract VotingEscrowToken is ERC20, IVotingEscrowToken, HasInitializer {
    using SafeCast for uint256;
    using SafeCast for int256;

    address public lock;

    uint256 constant MAXTIME = 4 * (365 days);
    uint256 constant MULTIPLIER = 1e18;

    uint256 public epoch; // todo instead of implementing view func?

    mapping(uint256 => int128) public slopeChanges;
    mapping(uint256 => Point) public pointHistory;
    mapping(uint256 => Point[]) public lockPointHistory;

    modifier onlyVELock() {
        require(msg.sender == lock, "Only ve lock contract can call this.");
        _;
    }

    constructor(string memory _name, string memory _symbol)
        ERC20(_name, _symbol)
    {}

    function init(address _lock) external initializer {
        lock = _lock;
    }

    function checkpoint() external override {
        // Point memory lastPoint = _recordPointHistory();
        // pointHistory[epoch] = lastPoint;
        _recordPointHistory();
    }

    function checkpoint(
        uint256 tokenId,
        Lock calldata prevLock,
        Lock calldata newLock
    ) external onlyVELock {
        // Record history
        _recordPointHistory();

        // Compute points
        (
            Point memory prevLockPoint,
            Point memory newLockPoint,
            int128 prevLockSlope,
            int128 newLockSlope
        ) = _computeNewPointForLock(prevLock, newLock);
        // // Record history
        // Point memory lastPoint = _recordPointHistory();

        // // apply lock updates to the last point
        // pointHistory[epoch] = _applyLockUpdateToLastPoint(prevPoint, newPoint, lastPoint);

        _updateLastPoint(prevLockPoint, newLockPoint);

        _recordLockPointHistory(
            tokenId,
            prevLock,
            newLock,
            prevLockPoint,
            newLockPoint,
            prevLockSlope,
            newLockSlope
        );
    }

    // View functions

    function balanceOf(address account)
        public
        view
        override(IERC20, ERC20)
        returns (uint256)
    {
        uint256 numOfLocks = IERC721Enumerable(lock).balanceOf(account);
        uint256 balance = 0;
        for (uint256 i = 0; i < numOfLocks; i++) {
            uint256 tokenId =
                IERC721Enumerable(lock).tokenOfOwnerByIndex(account, i);
            balance += balanceOfLockAt(tokenId, block.timestamp);
        }
        return balance;
    }

    function balanceOfLockAt(uint256 tokenId, uint256 timestamp)
        public
        view
        override
        returns (uint256)
    {
        Point[] memory history = lockPointHistory[tokenId];
        if (history.length == 0) {
            return 0;
        } else {
            Point memory lastPoint = history[history.length - 1];
            int128 bal =
                lastPoint.bias -
                    lastPoint.slope *
                    (timestamp - lastPoint.timestamp).toInt256().toInt128();
            return bal > 0 ? uint256(bal) : 0;
        }
    }

    function balanceOfLockAtBlockNum(uint256 tokenId, uint256 blockNum)
        external
        view
        override
        returns (uint256)
    {
        require(blockNum <= block.number, "Only past blocks");
        Point[] memory history = lockPointHistory[tokenId];
        if (history.length == 0) {
            return 0;
        }
        // binary search
        uint256 min = 0;
        uint256 max = history.length - 1;
        uint256 mid;
        for (uint256 i = 0; i < 128; i++) {
            if (min >= max) {
                break;
            }
            mid = (min + max) / 2;
            if (history[mid].blockNum <= blockNum) {
                min = mid;
            } else {
                max = mid - 1;
            }
        }
        Point memory point = history[min];
        uint256 currentEpoch = epoch;
        uint256 targetEpoch = _findBlockEpoch(blockNum, epoch);
        Point memory point0 = pointHistory[targetEpoch];
        uint256 dBlock = 0;
        uint256 dT = 0;

        if (targetEpoch < currentEpoch) {
            Point memory point1 = pointHistory[targetEpoch + 1];
            dBlock = point1.blockNum - point0.blockNum;
            dT = point1.timestamp - point0.timestamp;
        } else {
            dBlock = block.number - point0.blockNum;
            dT = block.timestamp - point0.timestamp;
        }
        uint256 blockTime = point0.timestamp;
        if (dBlock != 0) {
            blockTime += (dT * (blockNum - point0.blockNum)) / dBlock;
        }
        int128 bal =
            point.bias -
                point.slope *
                (blockTime - point.timestamp).toInt256().toInt128();
        return bal > 0 ? uint256(bal) : 0;
    }

    function totalSupply()
        public
        view
        override(IERC20, ERC20)
        returns (uint256)
    {
        return totalSupplyAt(block.timestamp);
    }

    function totalSupplyAt(uint256 timestamp)
        public
        view
        override
        returns (uint256)
    {
        return _supplyAt(pointHistory[epoch], timestamp);
    }

    function totalSupplyAtBlockNum(uint256 blockNum)
        public
        view
        override
        returns (uint256)
    {
        require(blockNum <= block.number, "only search in the past.");
        uint256 currentEpoch = epoch;
        uint256 targetEpoch = _findBlockEpoch(blockNum, epoch);
        Point memory point = pointHistory[targetEpoch];
        uint256 dT;
        if (targetEpoch < currentEpoch) {
            Point memory nextPoint = pointHistory[targetEpoch + 1];
            if (point.blockNum != nextPoint.blockNum) {
                dT =
                    ((blockNum - point.blockNum) *
                        (nextPoint.timestamp - point.timestamp)) /
                    (nextPoint.blockNum - point.blockNum);
            }
        } else {
            if (point.blockNum != block.number) {
                dT =
                    ((blockNum - point.blockNum) *
                        (block.timestamp - point.timestamp)) /
                    (block.number - point.blockNum);
            }
        }
        return _supplyAt(point, point.timestamp + dT);
    }

    function _supplyAt(Point memory point, uint256 timestamp)
        internal
        view
        returns (uint256)
    {
        uint256 ithWeekTimestamp = (point.timestamp / 1 weeks) * 1 weeks;
        uint256 timestampCursor = point.timestamp;
        int128 slope = point.slope;
        int128 supply = point.bias;
        for (uint256 i = 0; i < 255; i++) {
            ithWeekTimestamp += 1 weeks;
            int128 dSlope = 0;
            if (ithWeekTimestamp > timestamp) {
                ithWeekTimestamp = timestamp;
            } else {
                dSlope = slopeChanges[ithWeekTimestamp];
            }
            supply -=
                slope *
                (ithWeekTimestamp - timestampCursor).toInt256().toInt128();
            if (ithWeekTimestamp == timestamp) {
                break;
            }
            slope += dSlope;
            timestampCursor = ithWeekTimestamp;
        }
        return supply > 0 ? uint256(supply) : 0;
    }

    function getLastLockPoint(uint256 tokenId)
        external
        view
        override
        returns (Point memory)
    {
        uint256 len = lockPointHistory[tokenId].length;
        require(len > 0, "no lock exists");
        Point memory latestPoint = lockPointHistory[tokenId][len - 1];
        return latestPoint;
    }

    function getLockPointHistory(uint256 tokenId, uint256 index)
        external
        view
        override
        returns (Point memory)
    {
        Point memory point = lockPointHistory[tokenId][index];
        return point;
    }

    function _findBlockEpoch(uint256 blockNum, uint256 maxEpoch)
        internal
        view
        returns (uint256)
    {
        uint256 min = 0;
        uint256 max = maxEpoch;
        uint256 mid;
        for (uint256 i = 0; i < 128; i++) {
            if (min >= max) {
                break;
            }
            mid = (min + max + 1) / 2;
            if (pointHistory[mid].blockNum <= blockNum) {
                min = mid;
            } else {
                max = mid - 1;
            }
        }
        return min;
    }

    function _computeNewPointForLock(Lock memory prevLock, Lock memory newLock)
        internal
        view
        returns (
            Point memory prevPoint,
            Point memory newPoint,
            int128 prevSlope,
            int128 newSlope
        )
    {
        if (prevLock.end > block.timestamp && prevLock.amount > 0) {
            prevPoint.slope = (prevLock.amount / MAXTIME).toInt256().toInt128();
            prevPoint.bias =
                prevPoint.slope *
                (prevLock.end - block.timestamp).toInt256().toInt128();
        }
        if (newLock.end > block.timestamp && newLock.amount > 0) {
            newPoint.slope = (newLock.amount / MAXTIME).toInt256().toInt128();
            newPoint.bias =
                newPoint.slope *
                int128((newLock.end - block.timestamp));
        }
        prevSlope = slopeChanges[prevLock.end];
        if (newLock.end != 0) {
            if (newLock.end == prevLock.end) {
                newSlope = prevSlope;
            } else {
                newSlope = slopeChanges[newLock.end];
            }
        }
    }

    function _recordPointHistory() internal returns (Point memory lastPoint) {
        uint256 currentEpoch = epoch;
        // last_point: Point = Point({bias: 0, slope: 0, ts: block.timestamp, blk: block.number})
        Point memory cursor;
        if (currentEpoch > 0) {
            cursor = pointHistory[currentEpoch];
        } else {
            cursor = Point({
                bias: 0,
                slope: 0,
                timestamp: block.timestamp,
                blockNum: block.number
            });
        }

        Point memory prevLastPoint = cursor;

        uint256 blockSlope =
            block.timestamp > cursor.timestamp
                ? (MULTIPLIER * (block.number - cursor.blockNum)) /
                    (block.timestamp - cursor.timestamp)
                : 0;

        // fill history
        uint256 ithWeekTimestamp =
            (prevLastPoint.timestamp / 1 weeks) * 1 weeks;
        for (uint256 i = 0; i < 255; i++) {
            // Hopefully it won't happen that this won't get used in 5 years!
            // If it does, users will be able to withdraw but vote weight will be broken
            ithWeekTimestamp += 1 weeks;
            int128 dSlope;
            if (ithWeekTimestamp > block.timestamp) {
                ithWeekTimestamp = block.timestamp;
            } else {
                dSlope = slopeChanges[ithWeekTimestamp];
            }
            cursor.bias -=
                cursor.slope *
                int128(ithWeekTimestamp - prevLastPoint.timestamp);
            cursor.slope += dSlope;
            if (cursor.bias < 0) {
                cursor.bias = 0;
            }
            if (cursor.slope < 0) {
                cursor.slope = 0;
            }
            prevLastPoint.timestamp = ithWeekTimestamp;
            cursor.timestamp = ithWeekTimestamp;
            cursor.blockNum =
                prevLastPoint.blockNum +
                (blockSlope * (ithWeekTimestamp - prevLastPoint.timestamp)) /
                MULTIPLIER;
            currentEpoch += 1;
            if (ithWeekTimestamp == block.timestamp) {
                cursor.blockNum = block.number;
                break;
            } else {
                pointHistory[currentEpoch] = cursor;
            }
        }
        epoch = currentEpoch;
        return cursor;
    }

    function _recordLockPointHistory(
        uint256 tokenId,
        Lock memory prevLock,
        Lock memory newLock,
        Point memory prevPoint,
        Point memory newPoint,
        int128 prevSlope,
        int128 newSlope
    ) internal {
        if (prevLock.end > block.timestamp) {
            prevSlope += prevPoint.slope;
            if (newLock.end == prevLock.end) {
                prevSlope -= newPoint.slope;
            }
            slopeChanges[prevLock.end] = prevSlope;
        }
        if (newLock.end > block.timestamp) {
            if (newLock.end > prevLock.end) {
                newSlope -= newPoint.slope;
                slopeChanges[newLock.end] = newSlope;
            }
        }
        newPoint.timestamp = block.timestamp;
        newPoint.blockNum = block.number;
        lockPointHistory[tokenId].push(newPoint);
    }

    function _updateLastPoint(
        Point memory prevLockPoint,
        Point memory newLockPoint
    ) internal {
        Point memory newLastPoint =
            _applyLockUpdateToLastPoint(
                prevLockPoint,
                newLockPoint,
                pointHistory[epoch]
            );
        pointHistory[epoch] = newLastPoint;
    }

    function _applyLockUpdateToLastPoint(
        Point memory prevPoint,
        Point memory newPoint,
        Point memory lastPoint
    ) internal pure returns (Point memory newLastPoint) {
        newLastPoint = lastPoint;
        newLastPoint.slope += (newPoint.slope - prevPoint.slope);
        newLastPoint.bias += (newPoint.bias - prevPoint.bias);
        if (newLastPoint.slope < 0) {
            newLastPoint.slope = 0;
        }
        if (newLastPoint.bias < 0) {
            newLastPoint.bias = 0;
        }
    }

    function _beforeTokenTransfer(
        address,
        address,
        uint256
    ) internal pure override {
        revert("Non-transferrable. You can only transfer locks.");
    }
}
