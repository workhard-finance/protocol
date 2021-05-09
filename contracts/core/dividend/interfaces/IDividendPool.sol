//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IDividendPool is IERC721 {
    function maximumLock() external view returns (uint256);

    function visionToken() external view returns (address);

    function plantSeeds(address token, uint256 amount) external;

    function dispatchableFarmers(address staker, uint256 epoch)
        external
        view
        returns (uint256);

    function getCurrentEpoch() external view returns (uint256);
}