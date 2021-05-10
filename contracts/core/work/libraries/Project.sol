//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol";

contract Project is ERC721Burnable {
    constructor() ERC721("Workhard Project", "PROJ") {}

    event NewProject(uint256 id);

    function create(string memory URI) public returns (uint256) {
        uint256 id = totalSupply();
        _mint(msg.sender, id);
        _setTokenURI(id, URI);
        emit NewProject(id);
        return id;
    }
}
