//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

interface ILaborMarket {
    function createProject(
        bytes32 projId,
        address budgetOwner,
        uint256 budget
    ) external;

    function allocateBudget(bytes32 projId, uint256 budget) external;
}
