// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/introspection/ERC165.sol";
import "../../../core/emission/interfaces/IMiningPoolFactory.sol";
import "../../../core/emission/interfaces/IMiningPool.sol";

abstract contract MiningPoolFactory is IMiningPoolFactory, ERC165 {
    constructor() ERC165() {
        _registerInterface(IMiningPoolFactory(0).newPool.selector);
        _registerInterface(IMiningPoolFactory(0).poolSig.selector);
    }

    function newPool(
        address _emitter,
        address _baseToken,
        address _recoverTo
    ) public override returns (address _pool) {
        _pool = _newPool(_emitter, _baseToken);
        IMiningPool(_pool).initialize(_emitter, _baseToken, _recoverTo);
        emit NewMiningPool(_emitter, _baseToken, _recoverTo, _pool);
        return _pool;
    }

    function _newPool(address _emitter, address _burningToken)
        internal
        virtual
        returns (address _pool);
}
