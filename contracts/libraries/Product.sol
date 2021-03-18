//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol";
import "../interfaces/IProductMarket.sol";

contract Product is ERC721Burnable {
    address public manufacturer;
    address public marketplace;

    event MarketplaceUpdated(address indexed _marketplace);
    event ManufacturerUpdated(address indexed _manufacturer);

    constructor(
        address _manufacturer,
        address _marketplace,
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) {
        manufacturer = _manufacturer;
        marketplace = _marketplace;
    }

    modifier onlyManufacturer() {
        require(msg.sender == manufacturer, "allowed only for Market contract");
        _;
    }

    modifier onlyMarketplace() {
        require(msg.sender == manufacturer, "allowed only for Market contract");
        _;
    }

    function setManufacturer(address _manufacturer) public onlyManufacturer {
        manufacturer = _manufacturer;
        emit ManufacturerUpdated(_manufacturer);
    }

    function setMarketplace(address _marketplace) public onlyManufacturer {
        marketplace = _marketplace;
        emit MarketplaceUpdated(_marketplace);
    }

    function deliver(address to, uint256 amount)
        public
        onlyMarketplace
        returns (uint256[] memory ids)
    {
        ids = new uint256[](amount);
        for (uint256 i = 0; i < amount; i++) {
            uint256 id = totalSupply();
            ids[i] = id;
            _mint(to, id);
        }
        return ids;
    }

    function engrave(uint256 tokenId, string memory URI)
        public
        onlyManufacturer
        returns (bool)
    {
        require(bytes(tokenURI(tokenId)).length == 0, "Already engraved");
        _setTokenURI(tokenId, URI);
        return true;
    }
}
