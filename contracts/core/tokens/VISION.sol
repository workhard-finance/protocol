//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract VISION is ERC20 {
    address public minter;

    constructor() ERC20("Workhard Vision Token", "VISION") {
        minter = msg.sender;
    }

    modifier onlyMinter {
        require(msg.sender == minter, "Not a minter");
        _;
    }

    function mint(address to, uint256 amount) public onlyMinter {
        _mint(to, amount);
    }

    function setMinter(address _minter) public onlyMinter {
        minter = _minter;
    }
}
