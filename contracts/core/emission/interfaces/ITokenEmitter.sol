// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

interface ITokenEmitter {
    function start() external;

    function distribute() external;

    function emissionPeriod() external view returns (uint256);

    function token() external view returns (address);

    function poolTypes(address pool) external view returns (bytes4);
}
