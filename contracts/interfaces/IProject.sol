//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IProject is IERC721 {
    function create(string memory description) external returns (uint256);

    function setTokenURI(uint256 projId, string memory URI) external;

    function modifyJobDescription(uint256 projId, string memory description)
        external;
}
