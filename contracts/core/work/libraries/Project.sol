//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol";

contract Project is ERC721Burnable {
    constructor() ERC721("Workhard Project", "PROJ") {}

    event NewProject(uint256 id);

    function create(string memory URI) public returns (uint256) {
        uint256 id = uint256(keccak256(abi.encodePacked(URI, msg.sender)));
        _mint(msg.sender, id);
        _setTokenURI(id, URI);
        emit NewProject(id);
        return id;
    }

    function createTo(string memory URI, address _to) public returns (uint256) {
        uint256 id = uint256(keccak256(abi.encodePacked(URI, _to)));
        _mint(_to, id);
        _setTokenURI(id, URI);
        emit NewProject(id);
        return id;
    }
}
