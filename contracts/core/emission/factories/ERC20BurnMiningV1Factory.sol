// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/utils/Create2.sol";
import "../../../core/emission/pools/ERC20BurnMiningV1.sol";
import "../../../core/emission/interfaces/IMiningPool.sol";
import "../../../core/emission/libraries/MiningPoolFactory.sol";

contract ERC20BurnMiningV1Factory is MiningPoolFactory {
    bytes4 public override poolSig =
        ERC20BurnMiningV1(0).erc20BurnMiningV1.selector;

    function _newPool(address _emitter, address _burningToken)
        internal
        override
        returns (address _pool)
    {
        bytes memory bytecode = type(ERC20BurnMiningV1).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(_emitter, _burningToken));
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
        bytes32 bytecodeHash = keccak256(type(ERC20BurnMiningV1).creationCode);
        return Create2.computeAddress(salt, bytecodeHash);
    }
}
