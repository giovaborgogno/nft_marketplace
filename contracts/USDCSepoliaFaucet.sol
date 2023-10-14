// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract USDCSepoliaFaucet is Ownable {
    IERC20 constant private token = IERC20(0x82346f167B2b938A56AFdb694753C5BA7A2ab550);
    uint256 public tokensPerDay;
    mapping(address => uint256) public lastClaimTime;

    event TokensClaimed(address indexed recipient, uint256 amount);

    constructor(
        uint256 _tokensPerDay
    ) {
        tokensPerDay = _tokensPerDay;
    }

    modifier onlyOnceADay() {
        require(
            block.timestamp - lastClaimTime[msg.sender] >= 1 days,
            "Can only claim once a day"
        );
        _;
    }

    function setTokensPerDay(uint256 _tokensPerDay) public onlyOwner {
        tokensPerDay = _tokensPerDay;
    }

    function claimTokens() public onlyOnceADay {
        require(
            token.balanceOf(address(this)) >= tokensPerDay,
            "Insufficient tokens in the faucet"
        );
        lastClaimTime[msg.sender] = block.timestamp;
        token.transfer(msg.sender, tokensPerDay);
        emit TokensClaimed(msg.sender, tokensPerDay);
    }

    function withdraw() public onlyOwner {
        token.transfer(owner(), token.balanceOf(address(this)));
    }
}
