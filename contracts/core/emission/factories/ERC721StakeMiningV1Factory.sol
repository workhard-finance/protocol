// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/introspection/ERC165Checker.sol";
import "../../../core/emission/pools/ERC721StakeMiningV1.sol";
import "../../../core/emission/interfaces/IMiningPool.sol";
import "../../../core/emission/libraries/MiningPoolFactory.sol";

contract ERC721StakeMiningV1Factory is MiningPoolFactory {
    using ERC165Checker for address;
    /*
     *     // copied from openzeppelin ERC721 spec impl
     *
     *     bytes4(keccak256('balanceOf(address)')) == 0x70a08231
     *     bytes4(keccak256('ownerOf(uint256)')) == 0x6352211e
     *     bytes4(keccak256('approve(address,uint256)')) == 0x095ea7b3
     *     bytes4(keccak256('getApproved(uint256)')) == 0x081812fc
     *     bytes4(keccak256('setApprovalForAll(address,bool)')) == 0xa22cb465
     *     bytes4(keccak256('isApprovedForAll(address,address)')) == 0xe985e9c5
     *     bytes4(keccak256('transferFrom(address,address,uint256)')) == 0x23b872dd
     *     bytes4(keccak256('safeTransferFrom(address,address,uint256)')) == 0x42842e0e
     *     bytes4(keccak256('safeTransferFrom(address,address,uint256,bytes)')) == 0xb88d4fde
     *
     *     => 0x70a08231 ^ 0x6352211e ^ 0x095ea7b3 ^ 0x081812fc ^
     *        0xa22cb465 ^ 0xe985e9c5 ^ 0x23b872dd ^ 0x42842e0e ^ 0xb88d4fde == 0x80ac58cd
     */
    bytes4 private constant _INTERFACE_ID_ERC721 = 0x80ac58cd;

    bytes4 public override poolSig =
        ERC721StakeMiningV1(0).erc721StakeMiningV1.selector;

    function _newPool(address _emitter, address _stakingToken)
        internal
        override
        returns (address _pool)
    {
        require(
            _stakingToken.supportsInterface(_INTERFACE_ID_ERC721),
            "Not an ERC721"
        );
        bytes memory bytecode = type(ERC721StakeMiningV1).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(_emitter, _stakingToken));
        assembly {
            _pool := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        return _pool;
    }
}
