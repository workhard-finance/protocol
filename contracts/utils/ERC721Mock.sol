//SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0;

import {
    ERC721Burnable,
    ERC721 as _ERC721
} from "@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol";

/**
 * @title Commit Token
 * @notice Commit Token is used for redeeming stable coins, buying crypto products
 *      from the village market and mining vision tokens. It is minted by the admin and
 *      given to the contributors. The amount of mintable token is limited to the balance
 *      of redeemable stable coins. Therefore, it's 1:1 pegged to the given stable coin
 *      or expected to have higher value than the redeemable coin values.
 */
contract ERC721 is ERC721Burnable {
    address public minter;

    constructor() _ERC721("ERC721Mock", "MOCK") {
        minter = msg.sender;
    }

    modifier onlyMinter {
        require(msg.sender == minter, "Not a minter");
        _;
    }

    function mint(address to, uint256 id) public onlyMinter {
        _mint(to, id);
    }

    function setMinter(address _minter) public onlyMinter {
        minter = _minter;
    }
}
