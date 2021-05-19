// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

interface IMiningPoolFactory {
    event NewMiningPool(
        address _emitter,
        address _stakingToken,
        address _recoverTo,
        address _poolAddress
    );

    function newPool(
        address _emitter,
        address _baseToken,
        address _recoverTo
    ) external returns (address);

    function poolSig() external view returns (bytes4);

    function poolAddress(address _emitter, address _baseToken)
        external
        view
        returns (address _pool);
}
