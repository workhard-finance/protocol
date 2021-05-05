//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "../interfaces/IVisionFarm.sol";

contract Planter {
    using SafeERC20 for IERC20;

    IVisionFarm public immutable visionFarm;

    constructor(address _visionFarm) {
        visionFarm = IVisionFarm(_visionFarm);
    }

    function _plant(address currency, uint256 amount) internal virtual {
        IERC20(currency).safeApprove(address(visionFarm), amount);
        visionFarm.plantSeeds(currency, amount);
    }
}
