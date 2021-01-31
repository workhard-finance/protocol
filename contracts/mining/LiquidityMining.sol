// SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "../libraries/MiningPool.sol";
import "../libraries/ERC20Recoverer.sol";

contract LiquidityMining is MiningPool, ERC20Recoverer {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public immutable lpToken;

    constructor(
        address _gov,
        address _visionToken,
        address _visionTokenEmitter,
        address _lpToken
    ) MiningPool(_visionToken, _visionTokenEmitter) ERC20Recoverer() {
        lpToken = IERC20(_lpToken);
        ERC20Recoverer.disablePermanently(_lpToken);
        ERC20Recoverer.disablePermanently(_visionToken);
        ERC20Recoverer.setRecoverer(_gov);
    }

    function stake(uint256 amount) public {
        lpToken.safeTransferFrom(msg.sender, address(this), amount);
        _dispatchMiners(amount);
    }

    function withdraw(uint256 amount) public {
        lpToken.safeTransfer(msg.sender, amount);
        _withdrawMiners(amount);
    }

    function mine() public {
        _mine();
    }

    function exit() public {
        withdraw(dispatchedMiners[msg.sender]);
        mine();
    }
}
