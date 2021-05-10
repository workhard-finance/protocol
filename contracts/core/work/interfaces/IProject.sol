//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IProject is IERC721 {
    function create(string memory URI) external returns (uint256);
}
