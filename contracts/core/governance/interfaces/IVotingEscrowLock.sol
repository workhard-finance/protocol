//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Lock} from "../../../core/governance/libraries/VotingEscrowLib.sol";

interface IVotingEscrowLock is IERC721 {
    function locks(uint256 tokenId)
        external
        view
        returns (uint256 amount, uint256 end);
}
