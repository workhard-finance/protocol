// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

interface IMiningPool {
    function initialize(
        address _token,
        address _tokenEmitter,
        address _baseToken,
        address _recoverTo
    ) external;

    function allocate(uint256 amount) external;

    function setMiningPeriod(uint256 period) external;

    function token() external view returns (address);

    function tokenEmitter() external view returns (address);

    function baseToken() external view returns (address);
}