pragma solidity ^0.7.0;

interface ITokenEmitter {
    function start(address _liquidityMining, address _commitmentMining)
        external;

    function setWeight(
        uint256 commitment,
        uint256 liquidity,
        uint256 dev,
        uint256 caller
    ) external;

    function setEmissionPeriod(uint256 _emissionPeriod) external;

    function distribute() external;

    function emissionPeriod() external view returns (uint256);
}
