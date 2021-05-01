//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

interface IProductFactory {
    function create(
        address _manufacturer,
        address _marketplace,
        uint256 _maxSupply,
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        string memory _description
    ) external returns (address product);
}
