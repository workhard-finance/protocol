// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "./MiningPool.sol";
import "./ERC20Recoverer.sol";

contract BurnMining is MiningPool {
    using SafeMath for uint256;

    constructor() MiningPool() {}

    function burn(uint256 amount) public {
        _dispatchMiners(amount);
        ERC20Burnable(address(baseToken)).burnFrom(msg.sender, amount);
    }

    function mine() public nonReentrant recordMining(msg.sender) {
        // transfer vision token
        _mine();
        // withdraw all miners
        uint256 numOfMiners = dispatchedMiners[msg.sender];
        _withdrawMiners(numOfMiners);
    }
}
