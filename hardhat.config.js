require('dotenv').config();
const fs = require('fs');
require('@nomiclabs/hardhat-waffle');

const { INFURA_API_URL, SEPOLIA_PRIVATE_KEY } = process.env;

module.exports = {
  networks: {
    sepolia: {
      url: INFURA_API_URL,
      accounts: [SEPOLIA_PRIVATE_KEY]
    }
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
};
