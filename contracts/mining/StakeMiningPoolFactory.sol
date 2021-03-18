// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "../libraries/StakeMining.sol";
import "../interfaces/IMiningPool.sol";
import "../interfaces/IMiningPoolFactory.sol";

contract StakeMiningPoolFactory is IMiningPoolFactory {
    event NewStakeMiningPool(
        address _token,
        address _emitter,
        address _stakingToken,
        address _recoverTo,
        address _poolAddress
    );

    function newPool(
        address _token,
        address _emitter,
        address _stakingToken,
        address _recoverTo
    ) public override returns (address _pool) {
        bytes memory bytecode = type(StakeMining).creationCode;
        bytes32 salt =
            keccak256(abi.encodePacked(_token, _emitter, _stakingToken));
        assembly {
            _pool := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        IMiningPool(_pool).initialize(
            _token,
            _emitter,
            _stakingToken,
            _recoverTo
        );
        emit NewStakeMiningPool(
            _token,
            _emitter,
            _stakingToken,
            _recoverTo,
            _pool
        );
        return address(_pool);
    }
}
