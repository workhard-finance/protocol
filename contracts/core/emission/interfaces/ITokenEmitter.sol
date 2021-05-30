// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface ITokenEmitter {
    function start() external;

    function distribute() external;

    function emissionPeriod() external view returns (uint256);

    function token() external view returns (address);

    function poolTypes(address pool) external view returns (bytes4);

    function projId() external view returns (uint256);
}
