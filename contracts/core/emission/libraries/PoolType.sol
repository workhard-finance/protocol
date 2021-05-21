//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import {
    ERC20BurnMiningV1 as ERC20BurnMining
} from "../../../core/emission/pools/ERC20BurnMiningV1.sol";
import {
    ERC20StakeMiningV1 as ERC20StakeMining
} from "../../../core/emission/pools/ERC20StakeMiningV1.sol";
import {
    ERC721StakeMiningV1 as ERC721StakeMining
} from "../../../core/emission/pools/ERC721StakeMiningV1.sol";
import {
    ERC1155StakeMiningV1 as ERC1155StakeMining
} from "../../../core/emission/pools/ERC1155StakeMiningV1.sol";

library PoolType {
    bytes4 public constant ERC20BurnMiningV1 =
        ERC20BurnMining(0).erc20BurnMiningV1.selector;
    bytes4 public constant ERC20StakeMiningV1 =
        ERC20StakeMining(0).erc20StakeMiningV1.selector;
    bytes4 public constant ERC721StakeMiningV1 =
        ERC721StakeMining(0).erc721StakeMiningV1.selector;
    bytes4 public constant ERC1155StakeMiningV1 =
        ERC1155StakeMining(0).erc1155StakeMiningV1.selector;
}
