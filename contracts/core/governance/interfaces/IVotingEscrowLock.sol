//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Lock} from "../../../core/governance/libraries/VotingEscrowLib.sol";

interface IVotingEscrowLock is IERC721 {
    function locks(uint256 veLockId)
        external
        view
        returns (uint256 amount, uint256 end);

    function createLock(uint256 amount, uint256 lockEnd) external;

    function increaseAmount(uint256 veLockId, uint256 amount) external;

    function extendLock(uint256 veLockId, uint256 end) external;

    function withdraw(uint256 veLockId) external;

    function delegate(uint256 veLockId, address to) external;

    function totalLockedSupply() external view returns (uint256);

    function MAXTIME() external view returns (uint256);

    function baseToken() external view returns (address);

    function veToken() external view returns (address);

    function delegateeOf(uint256 veLockId) external view returns (address);

    function delegatedRights(address delegatee) external view returns (uint256);

    function delegatedRightByIndex(address delegatee, uint256 idx)
        external
        view
        returns (uint256 veLockId);
}
