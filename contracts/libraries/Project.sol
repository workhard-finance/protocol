//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol";
import "../interfaces/IMarketplace.sol";

contract Project is ERC721Burnable {
    constructor() ERC721("Workhard Project", "PROJ") {}

    mapping(uint256 => string) public jobDescription;

    mapping(uint256 => bool) public perpetuated;

    event Perpetuated(uint256 id);

    function create(string memory description) public returns (uint256) {
        uint256 id = totalSupply();
        _mint(msg.sender, id);
        _setJobDescription(id, description);
        return id;
    }

    function setTokenURI(uint256 projId, string memory _tokenURI) public {
        require(!perpetuated[projId], "Cannot modify.");
        require(ownerOf(projId) == msg.sender, "Not an owner");
        _setTokenURI(projId, _tokenURI);
    }

    function modifyJobDescription(uint256 projId, string memory description)
        public
    {
        require(!perpetuated[projId], "Cannot modify.");
        require(ownerOf(projId) == msg.sender, "Not an owner");
        _setJobDescription(projId, description);
    }

    function perpetuate(uint256 projId) public {
        require(ownerOf(projId) == msg.sender, "Not an owner");
        require(!perpetuated[projId], "Already perpetuated.");
        perpetuated[projId] = true;
        emit Perpetuated(projId);
    }

    function _setJobDescription(uint256 projId, string memory description)
        internal
    {
        require(ownerOf(projId) == msg.sender, "Not an owner");
        jobDescription[projId] = description;
    }
}
