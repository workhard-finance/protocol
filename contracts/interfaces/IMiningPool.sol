// SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

interface IMiningPool {
    function allocate(uint256 amount) external;

    function setMiningPeriod(uint256 period) external;
}
