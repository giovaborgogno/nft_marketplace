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

    // The contract's internal ERC20 token instance used for transactions within the marketplace.
    IERC20 private constant USDC =
        IERC20(0x82346f167B2b938A56AFdb694753C5BA7A2ab550);

    // Counter for generating unique token IDs for NFTs.
    Counters.Counter private _tokenIds;

    // The commission rate for the marketplace, set to 1%.
    uint256 _comission = 1;

    // Mapping to track deposits for each user's address.
    mapping(address => uint256) private depositsOf;

    // Mapping to associate NFT token IDs with their corresponding MarketItem structure.
    mapping(uint256 => MarketItem) private idToMarketItem;

    // Mapping to associate user addresses with the NFTs they own in the marketplace.
    mapping(address => MarketItem[]) private addressToOwnedItems;

    // Array to hold NFTs currently listed for sale in the marketplace.
    MarketItem[] private itemsForSale;

    // Mapping to keep track of the index of NFTs within the `itemsForSale` array.
    mapping(uint256 => uint256) public itemsForSaleIndex;

    event ItemSold(
        uint256 tokenId,
        address indexed from,
        address indexed to,
        uint256 price
    );

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

    /**
     * @dev Removes an NFT from the marketplace.
     *
     * @param tokenId The ID of the NFT to remove from the marketplace.
     */
    function unListItem(uint256 tokenId) public {
        require(
            ownerOf(tokenId) == msg.sender,
            "Only token owner can perform this operation"
        );

        idToMarketItem[tokenId].onSale = false;
        idToMarketItem[tokenId].price = 0;

        uint256 index = itemsForSaleIndex[tokenId];
        address creator = itemsForSale[index].owner;
        uint index_ownedItems = addressToOwnedItems[creator].findIndexByTokenId(
            tokenId
        );
        addressToOwnedItems[creator][index_ownedItems] = idToMarketItem[
            tokenId
        ];

        uint lastTokenId = itemsForSale[itemsForSale.length - 1].tokenId;

        itemsForSale.remove(index);
        itemsForSaleIndex[lastTokenId] = index;
    }

    /**
     * @dev Completes a marketplace sale, transferring the NFT and handling commissions.
     *
     * @param tokenId The ID of the NFT to be purchased.
     */
    function createMarketSale(uint256 tokenId) public {
        uint index_ItemForSale = itemsForSaleIndex[tokenId];
        require(
            tokenId == itemsForSale[index_ItemForSale].tokenId,
            "Item is not on sale."
        );

        uint price = itemsForSale[index_ItemForSale].price;
        address creator = itemsForSale[index_ItemForSale].owner;

        require(
            USDC.allowance(msg.sender, address(this)) >= price,
            "This contract needs approval for msg.sender"
        );
        _deposit(price, msg.sender, creator);
        _transfer(creator, msg.sender, tokenId);

        uint256 comission = _calculateComission(price);
        _withdraw((price - comission), creator);

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

    /**
     * @dev Retrieves a list of NFTs currently listed on the marketplace.
     *
     * @return An array of MarketItem structures representing NFTs for sale.
     */
    function fetchMarketItems() public view returns (MarketItem[] memory) {
        return itemsForSale;
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
     * @dev Allows the owner of the contract to withdraw all collected commissions.
     */
    function withdraw() public onlyOwner {
        USDC.transfer(owner(), depositsOf[address(this)]);
        depositsOf[address(this)] = 0;
    }

    /**
     * @dev Internal function to create a new MarketItem for the given NFT and add it to the seller's inventory.
     *
     * @param tokenId The ID of the NFT to create a MarketItem for.
     */
    function _createMarketItem(uint256 tokenId) private {
        idToMarketItem[tokenId] = MarketItem(
            tokenId,
            payable(msg.sender),
            0,
            false
        );

        addressToOwnedItems[msg.sender].push(idToMarketItem[tokenId]);
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
            "Insuficient balance of ERC20"
        );
        USDC.transferFrom(sender, address(this), amount);

        uint256 comission = _calculateComission(amount);
        depositsOf[payee] += (amount - comission);
        depositsOf[address(this)] += comission;
    }

    /**
     * @dev Internal function to handle withdrawals of ERC20 tokens.
     *
     * @param amount The amount of ERC20 tokens to withdraw.
     * @param payee The address to send the tokens to.
     */
    function _withdraw(uint256 amount, address payee) private {
        require(depositsOf[payee] >= amount, "Insuficient deposits of ERC20");
        USDC.transfer(payee, amount);
        depositsOf[payee] -= amount;
    }

    /**
     * @dev Internal function to withdraw all deposits of ERC20 tokens to the owner.
     */
    function _withdraw(address payee) private {
        _withdraw(depositsOf[payee], payee);
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
