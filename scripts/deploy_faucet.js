const hre = require('hardhat');

async function main() {
  const Faucet = await hre.ethers.getContractFactory('USDCSepoliaFaucet');
  const tokensPerDay = 1500e6
  const faucet = await Faucet.deploy(tokensPerDay);
  await faucet.deployed();

  console.log('Faucet deployed to:', faucet.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
