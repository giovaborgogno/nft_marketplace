// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

struct MarketItem {
    uint256 tokenId;
    address owner;
    uint256 price;
    bool onSale;
}