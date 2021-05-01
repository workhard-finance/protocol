//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "./Product.sol";

contract ProductFactory {
    event ProductLaunched(
        address indexed manufacturer,
        address indexed marketplace,
        address product,
        string name,
        string symbol
    );

    function create(
        address _manufacturer,
        address _marketplace,
        uint256 _maxSupply,
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        string memory _description
    ) public returns (address product) {
        Product prod =
            new Product(
                _manufacturer,
                _marketplace,
                _maxSupply,
                _name,
                _symbol,
                _baseURI,
                _description
            );
        emit ProductLaunched(
            _manufacturer,
            _marketplace,
            address(prod),
            _name,
            _symbol
        );
        return address(prod);
    }
}
