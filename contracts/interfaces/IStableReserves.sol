//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

interface IStableReserves {
    function reserveAndMint(uint256 amount) external;

    function baseCurrency() external view returns (address);

    function commitmentToken() external view returns (address);
}
