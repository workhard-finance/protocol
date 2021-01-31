//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/TimelockController.sol";

/**
 * @notice Gnosis Safe Multisig wallet has the Ownership of this contract.
 *      In the future, We can transfer the ownership to a well-formed governance contract.
 *      **Ownership grpah**
 *      TheDevs -controls-> CommitmentToken, DealManager, Market, VisionFarm, and VisionTokenEmitter
 *      VisionTokenEmitter -controls-> VisionToken
 */
contract TheDevs is TimelockController {
    constructor(address[] memory _devs)
        TimelockController(1 days, _devs, _devs)
    {}
}
