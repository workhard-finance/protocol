//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IProductMarket {
    function deliver(address to, uint256 amount)
        external
        returns (uint256[] memory ids);

    function engrave(uint256 tokenId, string calldata URI)
        external
        returns (bool);
}
