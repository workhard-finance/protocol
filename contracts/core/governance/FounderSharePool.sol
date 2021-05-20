//SPDX-License-Identifier: unlicensed
pragma solidity ^0.7.0;

import "../../core/emission/pools/ERC20BurnMiningV1.sol";

contract FounderSharePool is ERC20BurnMiningV1 {
    constructor(address _teamShare) ERC20BurnMiningV1() {}
}
