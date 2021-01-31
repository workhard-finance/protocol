//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

contract ERC20Recoverer {
    using SafeERC20 for IERC20;

    mapping(address => bool) public permanentlyNonRecoverable;
    mapping(address => bool) public nonRecoverable;

    event Recovered(address token, uint256 amount);

    address public recoverer;

    constructor() {
        recoverer = msg.sender;
    }

    modifier onlyRecoverer() {
        require(msg.sender == recoverer, "Only allowed to recoverer");
        _;
    }

    function setRecoverer(address _recoverer) public onlyRecoverer {
        recoverer = _recoverer;
    }

    // Added to support recovering LP Rewards from other systems such as BAL to be distributed to holders
    function recoverERC20(address tokenAddress, uint256 tokenAmount)
        external
        onlyRecoverer
    {
        require(nonRecoverable[tokenAddress] == false, "Non-recoverable ERC20");
        require(
            permanentlyNonRecoverable[tokenAddress] == false,
            "Non-recoverable ERC20"
        );
        IERC20(tokenAddress).safeTransfer(recoverer, tokenAmount);
        emit Recovered(tokenAddress, tokenAmount);
    }

    function disable(address _contract) public onlyRecoverer {
        nonRecoverable[_contract] = true;
    }

    function disablePermanently(address _contract) public onlyRecoverer {
        permanentlyNonRecoverable[_contract] = true;
    }

    function enable(address _contract) public onlyRecoverer {
        permanentlyNonRecoverable[_contract] = true;
    }
}
