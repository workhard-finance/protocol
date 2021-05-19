//SPDX-License-Identifier: GPL-3.0
// This contract referenced Sushi's MasterChef.sol logic
pragma solidity ^0.7.0;

import "../../core/emission/libraries/TokenEmitter.sol";
import "../../core/tokens/VISION.sol";

contract VisionEmitter is TokenEmitter {
    using SafeMath for uint256;

    constructor(
        address _devShares,
        address _protocolFund,
        address _gov,
        address _vision
    )
        TokenEmitter(
            24000000 ether,
            60,
            3000,
            500,
            _devShares,
            _protocolFund,
            _gov,
            _vision
        )
    {}
}
