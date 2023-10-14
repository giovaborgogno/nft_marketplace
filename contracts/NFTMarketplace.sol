// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./structures/MarketItem.sol";
import "./utils/MarketItemArray.sol";

import "hardhat/console.sol";

contract NFTMarketplace is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    using MarketItemArray for MarketItem[];
    using Address for address payable;

    IERC20 constant private USDC = IERC20(0x82346f167B2b938A56AFdb694753C5BA7A2ab550);

    Counters.Counter private _tokenIds;

    uint256 _comission = 1; // 1%

    mapping(address=> uint256) private depositsOf;

    mapping(uint256 => MarketItem) private idToMarketItem;
    mapping(address => MarketItem[]) private addressToOwnedItems;

    MarketItem[] private itemsForSale;
    mapping(uint256 => uint256) public itemsForSaleIndex;

    event ItemSold(
        uint256 tokenId,
        address indexed from,
        address indexed to,
        uint256 price
    );

    constructor() ERC721("WEB3 DAO Tokens", "WDAO") {}

    function updateComission(uint comission) public onlyOwner {
        _comission = comission;
    }

    function getComission() public view returns (uint256) {
        return _comission;
    }

    function createToken(string memory tokenURI) public returns (uint) {
        uint256 newTokenId = _tokenIds.current();
        _tokenIds.increment();

        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        _createMarketItem(newTokenId);

        return newTokenId;
    }

    function _createMarketItem(uint256 tokenId) private {
        idToMarketItem[tokenId] = MarketItem(
            tokenId,
            payable(msg.sender),
            0,
            false
        );

        addressToOwnedItems[msg.sender].push(idToMarketItem[tokenId]);
    }

    function listItem(uint256 tokenId, uint256 price) public {
        require(
            ownerOf(tokenId) == msg.sender,
            "Only token owner can perform this operation"
        );
        require(price > 0, "Price must be at least 1 wei");

        idToMarketItem[tokenId].onSale = true;
        idToMarketItem[tokenId].price = price;

        itemsForSale.push(idToMarketItem[tokenId]);
        itemsForSaleIndex[tokenId] = itemsForSale.length - 1;

        uint index = addressToOwnedItems[msg.sender].findIndexByTokenId(
            tokenId
        );
        addressToOwnedItems[msg.sender][index] = idToMarketItem[tokenId];
    }

    function unListItem(uint256 tokenId) public {
        require(
            ownerOf(tokenId) == msg.sender,
            "Only token owner can perform this operation"
        );
        

        idToMarketItem[tokenId].onSale = false;
        idToMarketItem[tokenId].price = 0;

        uint256 index = itemsForSaleIndex[tokenId];
        address creator = itemsForSale[index].owner;
        uint index_ownedItems = addressToOwnedItems[creator].findIndexByTokenId(tokenId);
        addressToOwnedItems[creator][index_ownedItems] = idToMarketItem[tokenId];

        uint lastTokenId = itemsForSale[itemsForSale.length - 1].tokenId;

        itemsForSale.remove(index);
        itemsForSaleIndex[lastTokenId] = index;
    }

    function createMarketSale(uint256 tokenId) public {

        uint index_ItemForSale = itemsForSaleIndex[tokenId];
        require(
            tokenId == itemsForSale[index_ItemForSale].tokenId,
            "Item is not on sale."
        );

        uint price = itemsForSale[index_ItemForSale].price;
        address  creator = itemsForSale[index_ItemForSale].owner;

        require(USDC.allowance(msg.sender, address(this)) >= price, "This contract needs approval for msg.sender");
        _deposit(price, msg.sender, creator);
        _transfer(creator, msg.sender, tokenId);
        
        uint256 comission = _calculateComission(price);
        _withdraw((price - comission),creator);

        idToMarketItem[tokenId].owner = msg.sender;
        idToMarketItem[tokenId].onSale = false;
        addressToOwnedItems[msg.sender].push(idToMarketItem[tokenId]);

        addressToOwnedItems[creator].removeByTokenId(tokenId);

        uint256 index = itemsForSaleIndex[tokenId];
        uint lastTokenId = itemsForSale[itemsForSale.length - 1].tokenId;

        itemsForSale.remove(index);
        itemsForSaleIndex[lastTokenId] = index;

        emit ItemSold(tokenId, creator, msg.sender, price);
    }

    function fetchMarketItems() public view returns (MarketItem[] memory) {
        return itemsForSale;
    }

    function fetchMyNFTs() public view returns (MarketItem[] memory) {
        return addressToOwnedItems[msg.sender];
    }

    function _deposit(uint256 amount, address sender, address payee) private {
        require(USDC.balanceOf(sender) >= amount, "Insuficient balance of ERC20");
        USDC.transferFrom(sender, address(this), amount);

        uint256 comission = _calculateComission(amount);
        depositsOf[payee] += (amount - comission);
        depositsOf[address(this)] += comission;
    }

    function _withdraw(uint256 amount, address payee) private {
        require(depositsOf[payee] >= amount, "Insuficient deposits of ERC20");
        USDC.transfer(payee, amount);
        depositsOf[payee] -= amount;
    }

    function _withdraw(address payee) private {
        _withdraw(depositsOf[payee], payee);
    }

    function withdraw() onlyOwner public {
        _withdraw(address(this));
    }

    function _calculateComission(uint256 amount) view private returns(uint256){
        uint256 comission = (amount * _comission) / 100;
        return comission;
    }
}
