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
        string memory _name,
        string memory _symbol
    ) public returns (address product) {
        Product prod = new Product(_manufacturer, _marketplace, _name, _symbol);
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
