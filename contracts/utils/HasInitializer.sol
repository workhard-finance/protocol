//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

contract HasInitializer {
    address private _initalizer;

    modifier initializer() {
        require(_initalizer == msg.sender, "Only allowed to the initilaizer.");
        _;
        delete _initalizer;
    }

    constructor() {
        _initalizer = msg.sender;
    }
}
