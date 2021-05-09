//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "../../../core/work/interfaces/IStableReserve.sol";

contract CommitMinter {
    using SafeERC20 for IERC20;

    address public immutable stableReserve;
    address public immutable commitToken;

    constructor(address _stableReserve) {
        stableReserve = _stableReserve;
        commitToken = IStableReserve(_stableReserve).commitToken();
    }

    function _mintCommit(uint256 amount) internal virtual {
        address _baseCurrency = IStableReserve(stableReserve).baseCurrency();
        IERC20(_baseCurrency).safeApprove(address(stableReserve), amount);
        IStableReserve(stableReserve).reserveAndMint(amount);
    }
}
