// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "../../../core/emission/interfaces/IMiningPoolFactory.sol";
import "../../../core/emission/interfaces/IMiningPool.sol";

abstract contract MiningPoolFactory is IMiningPoolFactory, ERC165 {
    using Clones for address;

    address public controller;

    constructor() ERC165() {
        _registerInterface(IMiningPoolFactory(0).newPool.selector);
        _registerInterface(IMiningPoolFactory(0).poolType.selector);
    }

    function _setController(address _controller) internal {
        controller = _controller;
    }

    function newPool(address _emitter, address _baseToken)
        public
        virtual
        override
        returns (address _pool)
    {
        address _predicted = this.poolAddress(_emitter, _baseToken);
        if (_isDeployed(_predicted)) {
            // already deployed;
            return _predicted;
        } else {
            // not deployed;
            bytes32 salt = keccak256(abi.encodePacked(_emitter, _baseToken));
            _pool = controller.cloneDeterministic(salt);
            require(
                _predicted == _pool,
                "Different result. This factory has a serious problem."
            );
            IMiningPool(_pool).initialize(_emitter, _baseToken);
            emit NewMiningPool(_emitter, _baseToken, _pool);
            return _pool;
        }
    }

    function getPool(address _emitter, address _baseToken)
        public
        view
        override
        returns (address)
    {
        address _predicted = this.poolAddress(_emitter, _baseToken);
        return _isDeployed(_predicted) ? _predicted : address(0);
    }

    function _isDeployed(address _pool) private view returns (bool) {
        return Address.isContract(_pool);
    }

    function poolAddress(address _emitter, address _baseToken)
        external
        view
        virtual
        override
        returns (address _pool)
    {
        bytes32 salt = keccak256(abi.encodePacked(_emitter, _baseToken));
        _pool = controller.predictDeterministicAddress(salt);
    }
}
