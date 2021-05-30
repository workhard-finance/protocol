// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC1155/IERC1155MetadataURI.sol";

interface IContributionBoard is IERC1155MetadataURI {
    function recordContribution(
        address to,
        uint256 id,
        uint256 amount
    ) external;

    function finalize(uint256 id) external;
}
