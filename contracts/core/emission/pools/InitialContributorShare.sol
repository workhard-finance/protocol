// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155Burnable.sol";
import "../../../core/emission/libraries/MiningPool.sol";
import "../../../core/emission/pools/ERC1155BurnMiningV1.sol";
import "../../../core/emission/interfaces/ITokenEmitter.sol";

contract InitialContributorShare is ERC1155BurnMiningV1 {
    using SafeMath for uint256;

    uint256 public projId;

    function initialize(address _tokenEmitter, address _baseToken)
        public
        override
    {
        super.initialize(_tokenEmitter, _baseToken);
        _registerInterface(ERC1155BurnMiningV1(0).burn.selector);
        _registerInterface(ERC1155BurnMiningV1(0).exit.selector);
        _registerInterface(ERC1155BurnMiningV1(0).dispatchableMiners.selector);
        _registerInterface(ERC1155BurnMiningV1(0).erc1155BurnMiningV1.selector);
        _registerInterface(
            InitialContributorShare(0).initialContributorShare.selector
        );
        projId = ITokenEmitter(_tokenEmitter).projId();
    }

    function burn(uint256 amount) public {
        burn(projId, amount);
    }

    function burn(uint256 _projId, uint256 _amount) public override {
        require(_projId == projId);
        super.burn(_projId, _amount);
    }

    /**
     * @dev override this function if you customize this mining pool
     */
    function dispatchableMiners(uint256 id)
        public
        view
        override
        returns (uint256 numOfMiner)
    {
        if (projId == id) return 1;
        else return 0;
    }

    function initialContributorShare() external pure returns (bool) {
        return true;
    }
}
