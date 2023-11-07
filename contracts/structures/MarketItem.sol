// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

enum Status {
        DEFAULT,
        FOR_SALE,
        AUCTION
    }

struct MarketItem {
    uint256 tokenId;
    address owner;
    uint256 price;
    Status  status;
    uint256 netPrice;
    uint256 startAt;
    uint256 endAt; 
}