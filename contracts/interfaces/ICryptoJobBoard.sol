//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

interface ICryptoJobBoard {
    function allocateFund(uint256 projId, uint256 budget) external;
}
