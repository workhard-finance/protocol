pragma solidity ^0.7.0;

interface IMiningPoolFactory {
    function newPool(
        address _token,
        address _emitter,
        address _baseToken,
        address _recoverTo
    ) external returns (address);
}
