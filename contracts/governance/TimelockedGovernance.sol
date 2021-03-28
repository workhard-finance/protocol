//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/TimelockController.sol";

/**
 * @notice Gnosis Safe Multisig wallet has the Ownership of this contract.
 *      In the future, We can transfer the ownership to a well-formed governance contract.
 *      **Ownership grpah**
 *      TimelockedGovernance -controls-> CommitmentToken, DealManager, Market, VisionFarm, and VisionTokenEmitter
 *      VisionTokenEmitter -controls-> VisionToken
 */
contract TimelockedGovernance is TimelockController {
    mapping(bytes32 => bool) public nonCancelable;

    constructor(address[] memory _devs)
        TimelockController(1 days, _devs, _devs)
    {}

    function cancel(bytes32 id) public override {
        require(!nonCancelable[id], "non-cancelable");
        super.cancel(id);
    }

    function forceSchedule(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt,
        uint256 delay
    ) public {
        bytes32 id = hashOperation(target, value, data, predecessor, salt);
        nonCancelable[id] = true;
        super.schedule(target, value, data, predecessor, salt, delay);
    }
}
