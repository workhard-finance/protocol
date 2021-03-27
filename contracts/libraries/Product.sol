//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol";
import "../interfaces/IProductMarket.sol";

contract Product is ERC721Burnable {
    address public manufacturer;
    address public marketplace;

    event MarketplaceUpdated(address indexed _marketplace);
    event ManufacturerUpdated(address indexed _manufacturer);

    mapping(uint256 => string) engravings;

    constructor(
        address _manufacturer,
        address _marketplace,
        string memory _name,
        string memory _symbol,
        string memory _baseURI
    ) ERC721(_name, _symbol) {
        manufacturer = _manufacturer;
        marketplace = _marketplace;
        _setBaseURI(_baseURI);
    }

    modifier onlyManufacturer() {
        require(msg.sender == manufacturer, "allowed only for manufacturer");
        _;
    }

    modifier onlyMarketplace() {
        require(msg.sender == marketplace, "allowed only for Market contract");
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

    function setBaseURI(string memory _baseURI) public onlyManufacturer {
        _setBaseURI(_baseURI);
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI)
        public
        onlyManufacturer
    {
        _setTokenURI(tokenId, _tokenURI);
    }

    /**
     * @dev It is recommended to use IPFS URI for the perpetualURI
     */
    function engrave(uint256 tokenId, string memory perpetualURI)
        public
        onlyManufacturer
        returns (bool)
    {
        require(bytes(engravings[tokenId]).length == 0, "Already engraved");
        engravings[tokenId] = perpetualURI;
        return true;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        string memory engraving = engravings[tokenId];
        if (bytes(engraving).length != 0) {
            require(
                _exists(tokenId),
                "ERC721Metadata: URI query for nonexistent token"
            );
            return engraving;
        } else {
            return super.tokenURI(tokenId);
        }
    }
}
