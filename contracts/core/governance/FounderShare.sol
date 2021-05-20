//SPDX-License-Identifier: unlicensed
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";

contract FounderShare is ERC20Burnable, Initializable {
    using SafeMath for uint256;

    address public minter;
    string private _name;
    string private _symbol;

    constructor() ERC20("", "") {
        // this constructor will not be called since it'll be cloned by proxy pattern.
        // initalize() will be called instead.
    }

    modifier onlyMinter {
        require(msg.sender == minter, "Not a minter");
        _;
    }

    function initialize(
        string memory name_,
        string memory symbol_,
        address to
    ) public initializer {
        _name = name_;
        _symbol = symbol_;
        minter = msg.sender;
        _mint(to, 100 ether);
        setMinter(address(0));
    }

    function mint(address to, uint256 amount) public onlyMinter {
        _mint(to, amount);
    }

    function setMinter(address _minter) public onlyMinter {
        _setMinter(_minter);
    }

    function _setMinter(address _minter) internal {
        minter = _minter;
    }

    function name() public view virtual override returns (string memory) {
        return _name;
    }

    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }
}
