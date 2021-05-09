//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

struct Point {
    int128 bias;
    int128 slope;
    uint256 timestamp;
}

struct Lock {
    uint256 amount;
    uint256 start;
    uint256 end;
}

library VotingEscrowLib {
    function addDelta(
        Point memory point,
        uint256 deltaX,
        int128 deltaY,
        int128 deltaSlope
    ) internal pure returns (Point memory _point) {
        _point.timestamp = point.timestamp + deltaX;
        _point.bias = point.bias + deltaY;
        _point.slope = point.slope + deltaSlope;
        _point.bias = _point.bias > 0 ? _point.bias : 0;
        _point.slope = _point.slope > 0 ? _point.slope : 0;
    }
}
