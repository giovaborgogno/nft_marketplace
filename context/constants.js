import marketAbi from './NFTMarketplace.json';
import usdcAbi from './USDCSepolia.json';
import usdcFaucetAbi from './USDCSepoliaFaucet.json';

export const MarketAddress = process.env.NEXT_PUBLIC_MARKET_ADDRESS;
export const MarketAddressABI = marketAbi.abi;

export const USDCSepoliaAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS;
export const USDCSepoliaABI = usdcAbi.abi;

export const USDCFaucetAddress = process.env.NEXT_PUBLIC_FAUCET_ADDRESS;
export const USDCFaucetABI = usdcFaucetAbi.abi;