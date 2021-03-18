// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./ERC20Recoverer.sol";
import "./MiningPool.sol";

contract StakeMining is MiningPool, ERC20Recoverer {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public immutable stakingToken;

    constructor(
        address _gov,
        address _visionToken,
        address _visionTokenEmitter,
        address _stakingToken
    ) MiningPool(_visionToken, _visionTokenEmitter) ERC20Recoverer() {
        stakingToken = IERC20(_stakingToken);
        ERC20Recoverer.disablePermanently(_stakingToken);
        ERC20Recoverer.disablePermanently(_visionToken);
        ERC20Recoverer.setRecoverer(_gov);
    }

    function stake(uint256 amount) public {
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        _dispatchMiners(amount);
    }

    function withdraw(uint256 amount) public {
        stakingToken.safeTransfer(msg.sender, amount);
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
