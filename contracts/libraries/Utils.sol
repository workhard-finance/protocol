//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

library Utils {
    function find(address[] memory arr, address item)
        internal
        pure
        returns (bool exist, uint256 index)
    {
        for (uint256 i = 0; i < arr.length; i += 1) {
            if (arr[i] == item) {
                return (true, i);
            }
        }
    }
}
