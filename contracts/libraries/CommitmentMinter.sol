//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "../interfaces/IStableReserves.sol";

contract CommitmentMinter {
    using SafeERC20 for IERC20;

    address public immutable stableReserves;
    address public immutable commitmentToken;

    constructor(address _stableReserves) {
        stableReserves = _stableReserves;
        commitmentToken = IStableReserves(_stableReserves).commitmentToken();
    }

    function _mintCommitment(uint256 amount) internal virtual {
        address _baseCurrency = IStableReserves(stableReserves).baseCurrency();
        IERC20(_baseCurrency).safeApprove(address(stableReserves), amount);
        IStableReserves(stableReserves).reserveAndMint(amount);
    }
}
