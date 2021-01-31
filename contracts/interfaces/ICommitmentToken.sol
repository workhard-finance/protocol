//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ICommitmentToken is IERC20 {
    function burnFrom(address account, uint256 amount) external;
}
