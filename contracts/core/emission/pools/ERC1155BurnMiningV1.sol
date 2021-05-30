// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155Burnable.sol";
import "../../../core/emission/libraries/MiningPool.sol";
import "../../../core/emission/interfaces/ITokenEmitter.sol";

contract ERC1155BurnMiningV1 is MiningPool, ERC1155Holder {
    using SafeMath for uint256;

    function initialize(address _tokenEmitter, address _baseToken)
        public
        virtual
        override
    {
        super.initialize(_tokenEmitter, _baseToken);
        _registerInterface(ERC1155BurnMiningV1(0).burn.selector);
        _registerInterface(ERC1155BurnMiningV1(0).exit.selector);
        _registerInterface(ERC1155BurnMiningV1(0).dispatchableMiners.selector);
        _registerInterface(ERC1155BurnMiningV1(0).erc1155BurnMiningV1.selector);
    }

    function burn(uint256 tokenId, uint256 amount) public virtual {
        _dispatchMiners(amount);
        ERC1155Burnable(address(baseToken)).burn(msg.sender, tokenId, amount);
    }

    function exit() public {
        // transfer vision token
        _mine();
        // withdraw all miners
        uint256 numOfMiners = dispatchedMiners[msg.sender];
        _withdrawMiners(numOfMiners);
    }

    function onERC1155Received(
        address,
        address,
        uint256 id,
        uint256 value,
        bytes calldata
    ) public virtual override returns (bytes4) {
        _dispatchMiners(value);
        ERC1155Burnable(address(baseToken)).burn(address(this), id, value);
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata
    ) public virtual override returns (bytes4) {
        require(ids.length == values.length, "Not a valid input");
        for (uint256 i = 0; i < ids.length; i++) {
            _dispatchMiners(values[i]);
            ERC1155Burnable(address(baseToken)).burn(
                address(this),
                ids[i],
                values[i]
            );
        }

        return this.onERC1155BatchReceived.selector;
    }

    /**
     * @dev override this function if you customize this mining pool
     */
    function dispatchableMiners(uint256)
        public
        view
        virtual
        returns (uint256 numOfMiner)
    {
        return 1;
    }

    function erc1155BurnMiningV1() external pure returns (bool) {
        return true;
    }
}
