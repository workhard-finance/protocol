//SPDX-License-Identifier: unlicensed
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";

contract TeamShare is ERC20Burnable {
    constructor() ERC20("Team Share", "TS") {
        _mint(msg.sender, 100 ether);
    }
}
