//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

struct Point {
    int128 bias;
    int128 slope;
    uint256 timestamp;
    uint256 blockNum;
}

struct Lock {
    uint256 amount;
    uint256 end;
}

library VotingEscrowLib {}
