
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

string constant AUCTION_HAS_ENDED = 'Auction has ended';
string constant AUCTION_IS_OPEN = 'Auction is still open';
string constant ITEM_IS_NOT_ON_SALE = 'Item is not on sale.';
string constant WINNER_IS_NOT_A_VALID_ADDRESS = 'Winner must be a valid address';
string constant COMPLETE_AUCTION_ERROR = 'Only seller or winner can complete auction';
string constant WITHDRAW_BID_ERROR = 'Highest bidder cannot withdraw bid';
string constant BID_ERROR = "Cannot bid on what you own";
string constant LOW_BID_ERROR = "Cannot bid below the latest bidding price";
string constant ONLY_OWNER_ERROR = "Only token owner can perform this operation";
string constant STATUS_MUST_BE_DEFAULT = "Item status must be DEFAULT";
string constant STATUS_MUST_NOT_BE_DEFAULT = "Item status must not be DEFAULT";
string constant PRICE_ERROR = "Price must be at least 1 wei";
string constant ERC_20_APPROVAL_ERROR = "This contract needs approval for msg.sender";
string constant ERC_20_INSUFFICIENT_BALANCE_ERROR = "This contract needs approval for msg.sender";
string constant NOT_AVAILABLE_FOR_UNLIST = "Someone has bid on the auction";