// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../structures/MarketItem.sol";

library MarketItemArray {
    error ItemNotFound(uint256 tokenId);

    function find(
        MarketItem[] storage arr,
        uint index
    ) internal view returns (MarketItem memory) {
        require(index < arr.length, "index out of bound");
        return arr[index];
    }

    function findByTokenId(
        MarketItem[] storage arr,
        uint256 tokenId
    ) internal view returns (MarketItem memory) {
        uint index = findIndexByTokenId(arr, tokenId);
        return arr[index];
    }

    function remove(MarketItem[] storage arr, uint index) internal {
        // Move the last element into the place to delete
        require(arr.length > 0, "Can't remove from empty array");
        require(index < arr.length, "index out of bound");
        arr[index] = arr[arr.length - 1];
        arr.pop();
    }

    function removeByTokenId(
        MarketItem[] storage arr,
        uint256 tokenId
    ) internal {
        uint index = findIndexByTokenId(arr, tokenId);
        remove(arr, index);
    }

    function findIndexByTokenId(
        MarketItem[] storage arr,
        uint256 tokenId
    ) internal view returns (uint) {
        require(arr.length > 0, "Can't find from empty array");
        for (uint i = 0; i < arr.length; i++) {
            if (arr[i].tokenId == tokenId) {
                return i;
            }
        }
        revert ItemNotFound(tokenId);
    }
}
