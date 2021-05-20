// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "../../../core/emission/pools/ERC1155StakeMiningV1.sol";
import "../../../core/emission/interfaces/IMiningPool.sol";
import "../../../core/emission/libraries/MiningPoolFactory.sol";

contract ERC1155StakeMiningV1Factory is MiningPoolFactory {
    using ERC165Checker for address;
    /*
     *     // copied from openzeppelin ERC1155 spec impl
     *     bytes4(keccak256('balanceOf(address,uint256)')) == 0x00fdd58e
     *     bytes4(keccak256('balanceOfBatch(address[],uint256[])')) == 0x4e1273f4
     *     bytes4(keccak256('setApprovalForAll(address,bool)')) == 0xa22cb465
     *     bytes4(keccak256('isApprovedForAll(address,address)')) == 0xe985e9c5
     *     bytes4(keccak256('safeTransferFrom(address,address,uint256,uint256,bytes)')) == 0xf242432a
     *     bytes4(keccak256('safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)')) == 0x2eb2c2d6
     *
     *     => 0x00fdd58e ^ 0x4e1273f4 ^ 0xa22cb465 ^
     *        0xe985e9c5 ^ 0xf242432a ^ 0x2eb2c2d6 == 0xd9b67a26
     */
    bytes4 private constant _INTERFACE_ID_ERC1155 = 0xd9b67a26;

    bytes4 public override poolSig =
        ERC1155StakeMiningV1(0).erc1155StakeMiningV1.selector;

    function _newPool(address _emitter, address _stakingToken)
        internal
        override
        returns (address _pool)
    {
        require(
            _stakingToken.supportsInterface(_INTERFACE_ID_ERC1155),
            "Not an ERC1155"
        );
        bytes memory bytecode = type(ERC1155StakeMiningV1).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(_emitter, _stakingToken));
        assembly {
            _pool := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        return _pool;
    }

    function poolAddress(address _emitter, address _baseToken)
        external
        view
        virtual
        override
        returns (address _pool)
    {
        bytes32 salt = keccak256(abi.encodePacked(_emitter, _baseToken));
        bytes32 bytecodeHash =
            keccak256(type(ERC1155StakeMiningV1).creationCode);
        return Create2.computeAddress(salt, bytecodeHash);
    }
}
