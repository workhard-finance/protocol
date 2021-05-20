//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/EnumerableMap.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";

contract Project is ERC721Burnable, Initializable {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableMap for EnumerableMap.UintToAddressMap;

    // Mapping from holder address to their (enumerable) set of owned tokens
    mapping(address => EnumerableSet.UintSet) private _daoProjects;
    EnumerableMap.UintToAddressMap private _belongsTo;

    constructor() ERC721("Workhard Project", "PROJ") {
        _setBaseURI("ipfs://");
    }

    event NewProject(address indexed dao, uint256 id);
    event ProjectMoved(address indexed from, address indexed to);

    function create(address dao, string memory URI) public returns (uint256) {
        return _create(dao, URI, msg.sender);
    }

    function createTo(
        address dao,
        string memory URI,
        address _to
    ) public returns (uint256) {
        return _create(dao, URI, _to);
    }

    function _create(
        address dao,
        string memory URI,
        address _to
    ) public returns (uint256) {
        uint256 id = uint256(keccak256(abi.encodePacked(dao, URI, _to)));
        _mint(_to, id);
        _setTokenURI(id, URI);

        _daoProjects[dao].add(id);
        _belongsTo.set(id, dao);
        emit NewProject(dao, id);
        return id;
    }

    function changeProjectOwner(uint256 id, address newOwner) public {
        require(
            _belongsTo.get(id) == msg.sender || ownerOf(id) == msg.sender,
            "Not authorized"
        );
        _safeTransfer(ownerOf(id), newOwner, id, new bytes(0));
    }

    function moveDAO(uint256 id, address newDAO) public {
        address fromDAO = msg.sender;
        require(_belongsTo.get(id) == fromDAO, "Not authorized");
        _belongsTo.set(id, newDAO);
        _daoProjects[fromDAO].remove(id);
        _daoProjects[newDAO].add(id);
        emit ProjectMoved(fromDAO, newDAO);
    }
}
