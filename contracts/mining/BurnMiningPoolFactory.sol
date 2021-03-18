// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "../libraries/BurnMining.sol";
import "../interfaces/IMiningPool.sol";
import "../interfaces/IMiningPoolFactory.sol";

contract BurnMiningPoolFactory is IMiningPoolFactory {
    event NewBurnMiningPool(
        address _token,
        address _emitter,
        address _burningToken,
        address _recoverTo,
        address _poolAddress
    );

    function newPool(
        address _token,
        address _emitter,
        address _burningToken,
        address _recoverTo
    ) public override returns (address _pool) {
        bytes memory bytecode = type(BurnMining).creationCode;
        bytes32 salt =
            keccak256(abi.encodePacked(_token, _emitter, _burningToken));
        assembly {
            _pool := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        IMiningPool(_pool).initialize(
            _token,
            _emitter,
            _burningToken,
            _recoverTo
        );
        emit NewBurnMiningPool(
            _token,
            _emitter,
            _burningToken,
            _recoverTo,
            _pool
        );
        return _pool;
    }
}
