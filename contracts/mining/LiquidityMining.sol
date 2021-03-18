// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "../libraries/StakeMining.sol";

contract LiquidityMining is StakeMining {
    constructor(
        address _gov,
        address _visionToken,
        address _visionTokenEmitter,
        address _lpToken
    ) StakeMining(_gov, _visionToken, _visionTokenEmitter, _lpToken) {}
}
