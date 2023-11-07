// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import "./structures/MarketItem.sol";
import "./utils/MarketItemArray.sol";
import "./utils/constants.sol";

import "hardhat/console.sol";

contract NFTMarketplace_v2 is ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using MarketItemArray for MarketItem[];
    using Address for address payable;

    // The contract's internal ERC20 token instance used for transactions within the marketplace.
    IERC20 private constant USDC =
        IERC20(0x82346f167B2b938A56AFdb694753C5BA7A2ab550);

    // Counter for generating unique token IDs for NFTs.
    Counters.Counter private _tokenIds;

    // The commission rate for the marketplace, set to 1%.
    uint256 _comission = 1;

    uint256 public minAuctionIncrement = 10; // 10 percent

    // Mapping to track deposits for each user's address.
    mapping(address => uint256) private depositsOf;

    // Mapping to associate NFT token IDs with their corresponding MarketItem structure.
    mapping(uint256 => MarketItem) private idToMarketItem;

    // Mapping to associate NFT token IDs with their corresponding bids.
    mapping(uint256 => mapping(address => uint256)) private bids;

    // Mapping to associate NFT token IDs with their corresponding highest bidder.
    mapping(uint256 => address) private highestBidder;

    // Mapping to associate user addresses with the NFTs they own in the marketplace.
    mapping(address => MarketItem[]) private addressToOwnedItems;

    // Array to hold NFTs currently listed for sale in the marketplace.
    MarketItem[] private itemsForSale;

    // Array to hold NFTs currently auctioned in the marketplace.
    MarketItem[] private auctionItems;

    // Mapping to keep track of the index of NFTs within the `itemsForSale` array.
    mapping(uint256 => uint256) private itemsForSaleIndex;

     // Mapping to keep track of the index of NFTs within the `auctionItems` array.
    mapping(uint256 => uint256) private auctionItemsIndex;

    event ItemSold(
        uint256 tokenId,
        address indexed from,
        address indexed to,
        uint256 price
    );

    modifier isAuctionOpen(uint256 id) {
        require(
            idToMarketItem[id].status == Status.AUCTION &&
            idToMarketItem[id].endAt > block.timestamp,
            AUCTION_HAS_ENDED
        );
        _;        
    }

    modifier isAuctionExpired(uint256 id) {
        require(
            idToMarketItem[id].status == Status.AUCTION &&
            idToMarketItem[id].endAt <= block.timestamp,
            AUCTION_IS_OPEN
        );
        _;        
    }

    modifier isAuctionClose(uint256 id) {
        require(
            idToMarketItem[id].endAt <= block.timestamp,
            AUCTION_IS_OPEN
        );
        _;        
    }

    modifier isOnSale(uint256 id) {
        uint index_ItemForSale = itemsForSaleIndex[id];
        require(
            id == itemsForSale[index_ItemForSale].tokenId &&
            idToMarketItem[id].status == Status.FOR_SALE,
            ITEM_IS_NOT_ON_SALE
        );
        _;        
    }

    constructor() ERC721("WEB3 DAO Tokens", "WDAO") {}

    /**
     * @dev Updates the commission percentage for the marketplace.
     *
     * Only the owner of the contract can change the commission rate.
     *
     * @param comission The new commission rate as a percentage.
     */
    function updateComission(uint comission) public onlyOwner {
        _comission = comission;
    }

    /**
     * @dev Gets the current commission rate.
     *
     * @return The current commission rate as a percentage.
     */
    function getComission() public view returns (uint256) {
        return _comission;
    }

    function getHighestBidder(uint256 tokenId) public view returns (address) {
        return highestBidder[tokenId];
    }

    function getBid(uint256 tokenId, address bidder) public view returns (uint256) {
        return bids[tokenId][bidder];
    }

    /**
     * @dev Creates a new NFT and lists it on the marketplace.
     *
     * @param tokenURI The URI for the NFT's metadata.
     * @return The ID of the newly created NFT.
     */
    function createToken(string memory tokenURI) public returns (uint) {
        uint256 newTokenId = _tokenIds.current();
        _tokenIds.increment();

        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        _createMarketItem(newTokenId);

        return newTokenId;
    }

    /**
     * @dev Lists an NFT on the marketplace with a specified price.
     *
     * @param tokenId The ID of the NFT to list.
     * @param price The price at which to list the NFT.
     */
    function listItem(uint256 tokenId, uint256 price) public {
        require(
            ownerOf(tokenId) == msg.sender,
            ONLY_OWNER_ERROR
        );
        require(idToMarketItem[tokenId].status == Status.DEFAULT, STATUS_MUST_BE_DEFAULT);
        require(price > 0, PRICE_ERROR);

        idToMarketItem[tokenId].status = Status.FOR_SALE;
        idToMarketItem[tokenId].price = price;

        itemsForSale.push(idToMarketItem[tokenId]);
        itemsForSaleIndex[tokenId] = itemsForSale.length - 1;

        uint index = addressToOwnedItems[msg.sender].findIndexByTokenId(
            tokenId
        );
        addressToOwnedItems[msg.sender][index] = idToMarketItem[tokenId];
        _transfer(msg.sender, address(this), tokenId);
    }

    /**
     * @dev Lists an NFT on the marketplace with a specified price.
     *
     * @param tokenId The ID of the NFT to list.
     * @param price The price at which to list the NFT.
     */
    function auctionItem(uint256 tokenId, uint256 price, uint256 durationInSeconds) public {
        require(
            ownerOf(tokenId) == msg.sender,
            ONLY_OWNER_ERROR
        );
        require(idToMarketItem[tokenId].status == Status.DEFAULT, STATUS_MUST_BE_DEFAULT);
        require(price > 0, PRICE_ERROR);

        uint256 startAt = block.timestamp;
        uint256 endAt = startAt + durationInSeconds;

        idToMarketItem[tokenId].status = Status.AUCTION;
        idToMarketItem[tokenId].price = price;
        idToMarketItem[tokenId].netPrice = price;
        idToMarketItem[tokenId].startAt = startAt;
        idToMarketItem[tokenId].endAt = endAt;

        auctionItems.push(idToMarketItem[tokenId]);
        auctionItemsIndex[tokenId] = auctionItems.length - 1;

        uint index = addressToOwnedItems[msg.sender].findIndexByTokenId(
            tokenId
        );
        addressToOwnedItems[msg.sender][index] = idToMarketItem[tokenId];

        _transfer(msg.sender, address(this), tokenId);
    }

    /**
     * @dev Removes an NFT from the marketplace.
     *
     * @param tokenId The ID of the NFT to remove from the marketplace.
     */
    function unListItem(uint256 tokenId) public nonReentrant {
        require(
            idToMarketItem[tokenId].owner == msg.sender,
            ONLY_OWNER_ERROR
        );
        require(idToMarketItem[tokenId].status != Status.DEFAULT, STATUS_MUST_NOT_BE_DEFAULT);

        if(idToMarketItem[tokenId].status == Status.FOR_SALE){
            uint256 i = itemsForSaleIndex[tokenId];
            uint last_token_id = itemsForSale[itemsForSale.length - 1].tokenId;

            itemsForSale.remove(i);
            itemsForSaleIndex[last_token_id] = i;
        }
        if(idToMarketItem[tokenId].status == Status.AUCTION){
            require(idToMarketItem[tokenId].price == idToMarketItem[tokenId].netPrice, NOT_AVAILABLE_FOR_UNLIST);
            uint256 i = auctionItemsIndex[tokenId];
            uint last_token_id = auctionItems[auctionItems.length - 1].tokenId;

            auctionItems.remove(i);
            auctionItemsIndex[last_token_id] = i;
        }

        address creator = idToMarketItem[tokenId].owner;
        
        _setDefaultMarketItem(tokenId);
        uint index_ownedItems = addressToOwnedItems[creator].findIndexByTokenId(
            tokenId
        );
        addressToOwnedItems[creator][index_ownedItems] = idToMarketItem[
            tokenId
        ];
        _transfer(address(this), msg.sender, tokenId);
    }

    /**
     * @dev Completes a marketplace sale, transferring the NFT and handling commissions.
     *
     * @param tokenId The ID of the NFT to be purchased.
     */
    function createMarketSale(uint256 tokenId) public nonReentrant isOnSale(tokenId){
        uint index_ItemForSale = itemsForSaleIndex[tokenId];
        uint price = itemsForSale[index_ItemForSale].price;
        address creator = itemsForSale[index_ItemForSale].owner;

        require(
            USDC.allowance(msg.sender, address(this)) >= price,
            ERC_20_APPROVAL_ERROR
        );
        _deposit(price, msg.sender, creator);
        _transfer(address(this), msg.sender, tokenId);

        uint256 comission = _calculateComission(price);
        _withdraw((price - comission), creator);

        idToMarketItem[tokenId].owner = msg.sender;
        idToMarketItem[tokenId].status = Status.DEFAULT;
        _setDefaultMarketItem(tokenId);
        addressToOwnedItems[msg.sender].push(idToMarketItem[tokenId]);

        addressToOwnedItems[creator].removeByTokenId(tokenId);

        uint256 index = itemsForSaleIndex[tokenId];
        uint lastTokenId = itemsForSale[itemsForSale.length - 1].tokenId;

        itemsForSale.remove(index);
        itemsForSaleIndex[lastTokenId] = index;

        emit ItemSold(tokenId, creator, msg.sender, price);
    }

    function bid(uint256 tokenId, uint256 amount) public nonReentrant isAuctionOpen(tokenId){
        MarketItem storage listing = idToMarketItem[tokenId];
        require(msg.sender != listing.owner, BID_ERROR);
        require(amount >= listing.price, LOW_BID_ERROR);
        require(amount > bids[tokenId][msg.sender], LOW_BID_ERROR);
        uint256 newDeposit = amount - bids[tokenId][msg.sender];
        require(
            USDC.allowance(msg.sender, address(this)) >= newDeposit,
            ERC_20_APPROVAL_ERROR
        );

        _depositWithoutComission(newDeposit, msg.sender, msg.sender);

        bids[tokenId][msg.sender] += newDeposit;
        highestBidder[tokenId] = msg.sender;

        uint index_AuctionItem = auctionItemsIndex[tokenId];
        uint256 incentive = amount / minAuctionIncrement;
        auctionItems[index_AuctionItem].price = amount + incentive;
        listing.price = amount + incentive;
    }


    function completeAuction(uint256 tokenId) public nonReentrant isAuctionExpired(tokenId){

        MarketItem storage listing = idToMarketItem[tokenId];
        address winner = highestBidder[tokenId]; 
        require(winner != address(0), WINNER_IS_NOT_A_VALID_ADDRESS);
        require(
            msg.sender == listing.owner || msg.sender == winner, 
            COMPLETE_AUCTION_ERROR
        );

        _transfer(address(this), winner, tokenId);

        uint index_AuctionItem = auctionItemsIndex[tokenId];
        address creator = auctionItems[index_AuctionItem].owner;

        uint256 amount = bids[tokenId][winner];

        depositsOf[winner] -= amount;

        uint256 comission = _calculateComission(amount);
        depositsOf[creator] += (amount - comission);
        depositsOf[address(this)] += comission;
        _withdraw((amount - comission), creator);
        bids[tokenId][winner] = 0;    
        delete highestBidder[tokenId];    

        idToMarketItem[tokenId].owner = winner;
        idToMarketItem[tokenId].status = Status.DEFAULT;
        addressToOwnedItems[winner].push(idToMarketItem[tokenId]);
        _setDefaultMarketItem(tokenId);
        addressToOwnedItems[creator].removeByTokenId(tokenId);

        uint lastTokenId = auctionItems[auctionItems.length - 1].tokenId;
        auctionItems.remove(index_AuctionItem);
        auctionItemsIndex[lastTokenId] = index_AuctionItem;

        emit ItemSold(tokenId, creator, winner, amount);
    }

    /**
     * @dev Retrieves a list of NFTs currently listed on the marketplace.
     *
     * @return An array of MarketItem structures representing NFTs for sale.
     */
    function fetchMarketItems() public view returns (MarketItem[] memory) {
        return itemsForSale;
    }

        /**
     * @dev Retrieves a list of NFTs currently auctioned on the marketplace.
     *
     * @return An array of MarketItem structures representing NFTs auctioned.
     */
    function fetchAuctionItems() public view returns (MarketItem[] memory) {
        return auctionItems;
    }

    /**
     * @dev Retrieves a list of NFTs owned by the calling address.
     *
     * @return An array of MarketItem structures representing NFTs owned by the caller.
     */
    function fetchMyNFTs() public view returns (MarketItem[] memory) {
        return addressToOwnedItems[msg.sender];
    }

     /**
     * @dev Retrieves a specific NFT.
     *
     * @return A MarketItem structure representing NFT.
     */
    function fetchNFT(uint256 tokenId) public view returns (MarketItem memory) {
        return idToMarketItem[tokenId];
    }

    /**
     * @dev Allows the owner of the contract to withdraw all collected commissions.
     */
    function withdraw() public onlyOwner nonReentrant{
        USDC.transfer(owner(), depositsOf[address(this)]);
        depositsOf[address(this)] = 0;
    }

    function withdrawBid(uint256 tokenId) public payable nonReentrant isAuctionClose(tokenId){
        require(highestBidder[tokenId] != msg.sender, WITHDRAW_BID_ERROR);

        uint256 balance = bids[tokenId][msg.sender];
        _withdraw(balance, msg.sender);
        bids[tokenId][msg.sender] = 0;
    }

    /**
     * @dev Internal function to create a new MarketItem for the given NFT and add it to the seller's inventory.
     *
     * @param tokenId The ID of the NFT to create a MarketItem for.
     */
    function _createMarketItem(uint256 tokenId) private {
        idToMarketItem[tokenId] = MarketItem({
            tokenId: tokenId,
            owner: msg.sender,
            price: 0,
            status: Status.DEFAULT,
            netPrice: 0,
            startAt: 0,
            endAt: 0
        });

        addressToOwnedItems[msg.sender].push(idToMarketItem[tokenId]);
    }

    function _setDefaultMarketItem(uint256 tokenId) private {
        idToMarketItem[tokenId].status = Status.DEFAULT;
        idToMarketItem[tokenId].price = 0;
        idToMarketItem[tokenId].netPrice = 0;
        idToMarketItem[tokenId].startAt = 0;
        idToMarketItem[tokenId].endAt = 0;
    }

    /**
     * @dev Internal function to handle deposits of ERC20 tokens.
     *
     * @param amount The amount of ERC20 tokens to deposit.
     * @param sender The address sending the tokens.
     * @param payee The address receiving the tokens.
     */
    function _deposit(uint256 amount, address sender, address payee) private {
        require(
            USDC.balanceOf(sender) >= amount,
            ERC_20_INSUFFICIENT_BALANCE_ERROR
        );
        USDC.transferFrom(sender, address(this), amount);

        uint256 comission = _calculateComission(amount);
        depositsOf[payee] += (amount - comission);
        depositsOf[address(this)] += comission;
    }

    function _depositWithoutComission(uint256 amount, address sender, address payee) private {
        require(
            USDC.balanceOf(sender) >= amount,
            ERC_20_INSUFFICIENT_BALANCE_ERROR
        );
        USDC.transferFrom(sender, address(this), amount);

        depositsOf[payee] += amount;
    }

    /**
     * @dev Internal function to handle withdrawals of ERC20 tokens.
     *
     * @param amount The amount of ERC20 tokens to withdraw.
     * @param payee The address to send the tokens to.
     */
    function _withdraw(uint256 amount, address payee) private {
        require(depositsOf[payee] >= amount, ERC_20_INSUFFICIENT_BALANCE_ERROR);
        USDC.transfer(payee, amount);
        depositsOf[payee] -= amount;
    }

    /**
     * @dev Internal function to calculate the commission amount based on the given price.
     *
     * @param amount The price of the NFT.
     * @return The calculated commission amount.
     */
    function _calculateComission(
        uint256 amount
    ) private view returns (uint256) {
        uint256 comission = (amount * _comission) / 100;
        return comission;
    }
}
