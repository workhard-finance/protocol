// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

interface ITokenEmitter {
    function start(address _liquidityMining, address _commitMining) external;

    function setWeight(
        uint256 commit,
        uint256 liquidity,
        uint256 dev,
        uint256 caller
    ) external;

    function setEmissionPeriod(uint256 _emissionPeriod) external;

    function distribute() external;

    function emissionPeriod() external view returns (uint256);
}
