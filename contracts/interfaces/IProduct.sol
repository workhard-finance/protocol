//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IProduct is IERC721 {
    function deliver(address to, uint256 amount)
        external
        returns (uint256[] memory ids);

    function engrave(uint256 tokenId, string calldata URI)
        external
        returns (bool);

    function manufacturer() external view returns (address);
}
