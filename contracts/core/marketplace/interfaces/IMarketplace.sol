//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC1155/IERC1155MetadataURI.sol";

interface IMarketplace is IERC1155MetadataURI {
    function products(uint256 id)
        external
        view
        returns (
            address manufacturer,
            uint256 totalSupply,
            uint256 maxSupply,
            uint256 price,
            uint256 profitRate,
            string memory uri
        );

    function buy(
        uint256 id,
        address to,
        uint256 amount
    ) external;

    function manufacture(
        string memory cid,
        uint256 profitRate,
        uint256 price
    ) external;

    function manufactureLimitedEdition(
        string memory cid,
        uint256 profitRate,
        uint256 price,
        uint256 maxSupply
    ) external;

    function setMaxSupply(uint256 id, uint256 _maxSupply) external;

    function setPrice(uint256 id, uint256 price) external;

    function setProfitRate(uint256 id, uint256 profitRate) external;

    function setTaxRate(uint256 rate) external;

    function setFeatured(uint256[] calldata _featured) external;

    event NewProduct(uint256 id, address manufacturer, string uri);

    event TaxRateUpdated(uint256 taxRate);

    event PriceUpdated(uint256 indexed productId, uint256 price);

    event ProfitRateUpdated(uint256 indexed productId, uint256 profitRate);
}
