// SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "../libraries/BurnMining.sol";

contract CommitmentMining is BurnMining {
    constructor(
        address _gov,
        address _visionToken,
        address _visionTokenEmitter,
        address _commitmentToken
    ) BurnMining(_gov, _visionToken, _visionTokenEmitter, _commitmentToken) {}
}
