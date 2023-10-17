// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../structures/MarketItem.sol";

library MarketItemArray {
    error ItemNotFound(uint256 tokenId);

    /**
     * @dev Find an item in the array by its index.
     *
     * @param arr The array of MarketItem.
     * @param index The index of the item to find.
     * @return The found MarketItem structure.
     */
    function find(
        MarketItem[] storage arr,
        uint index
    ) internal view returns (MarketItem memory) {
        require(index < arr.length, "index out of bound");
        return arr[index];
    }

    /**
     * @dev Find an item in the array by its tokenId.
     *
     * @param arr The array of MarketItem.
     * @param tokenId The tokenId of the item to find.
     * @return The found MarketItem structure.
     */
    function findByTokenId(
        MarketItem[] storage arr,
        uint256 tokenId
    ) internal view returns (MarketItem memory) {
        uint index = findIndexByTokenId(arr, tokenId);
        return arr[index];
    }

    /**
     * @dev Remove an item from the array by its index.
     *
     * @param arr The array of MarketItem.
     * @param index The index of the item to remove.
     */
    function remove(MarketItem[] storage arr, uint index) internal {
        // Move the last element into the place to delete
        require(arr.length > 0, "Can't remove from empty array");
        require(index < arr.length, "index out of bound");
        arr[index] = arr[arr.length - 1];
        arr.pop();
    }

    /**
     * @dev Remove an item from the array by its tokenId.
     *
     * @param arr The array of MarketItem.
     * @param tokenId The tokenId of the item to remove.
     */
    function removeByTokenId(
        MarketItem[] storage arr,
        uint256 tokenId
    ) internal {
        uint index = findIndexByTokenId(arr, tokenId);
        remove(arr, index);
    }

    /**
     * @dev Find the index of an item in the array by its tokenId.
     *
     * @param arr The array of MarketItem.
     * @param tokenId The tokenId of the item to find.
     * @return The index of the found item.
     */
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
