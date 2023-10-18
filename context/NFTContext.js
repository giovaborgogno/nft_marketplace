import React, { useEffect, useState } from 'react';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';
import axios from 'axios';
import { MarketAddress, MarketAddressABI, USDCSepoliaAddress, USDCSepoliaABI, USDCFaucetABI, USDCFaucetAddress } from './constants';
import { NFTStorage, Blob } from 'nft.storage'
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
const NFT_STORAGE_TOKEN = process.env.NEXT_PUBLIC_NFT_STORAGE_TOKEN
const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

const getChainId = () => {
  const get_chain_id = async () => {
    try {
      const chain_id = await window.ethereum.request({ method: 'eth_chainId' });
      return chain_id;
    } catch (error) {
      return 0;
    }
  }
  return get_chain_id()
}

const fetchContract = (signerOrProvider) => new ethers.Contract(MarketAddress, MarketAddressABI, signerOrProvider);
const fetchUSDCContract = (signerOrProvider) => new ethers.Contract(USDCSepoliaAddress, USDCSepoliaABI, signerOrProvider);
const fetchUSDCFaucetContract = (signerOrProvider) => new ethers.Contract(USDCFaucetAddress, USDCFaucetABI, signerOrProvider);

export const NFTContext = React.createContext();

export const NFTProvider = ({ children }) => {
  const nftCurrency = 'USDC';
  const [currentAccount, setCurrentAccount] = useState('');
  const [chainId, setChainId] = useState(process.env.NEXT_PUBLIC_ETH_NETWORK_CHAIN_ID)
  const [balanceOfUSDC, setBalanceOfUSDC] = useState(0)
  const router = useRouter();

  const connectWallet = async () => {
    try {
      if (!window.ethereum) return toast.error('Please install Metamask');

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{
            chainId: process.env.NEXT_PUBLIC_ETH_NETWORK_CHAIN_ID
          }]
        });
      }

      setCurrentAccount(accounts[0]);
      // window.location.reload();
      router.reload()
    } catch (error) {
      toast.error(error.message)
      // toast.error('You need to connect your Metamask')
      router.push('/');
    }

  };

  const checkIfWalletIsConnect = async () => {
    try {
      if (!window.ethereum) {
        const path = router.pathname
        if (path == '/' || path == '/nft-details') return false;
        router.push('/');
        toast.error('Please install Metamask');
        return false;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });

      if (accounts.length) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{
            chainId: process.env.NEXT_PUBLIC_ETH_NETWORK_CHAIN_ID
          }]
        });

        await window.ethereum.on('chainChanged', async () => {

          const new_chain_id = await getChainId()
          setChainId(new_chain_id);
          console.log('new chain id: ',new_chain_id)
         })

        setCurrentAccount(accounts[0]);
      } else {
        const path = router.pathname
        if (path == '/' || path == '/nft-details') return false;
        router.push('/')
        toast.error('Connect your metamask!')
        console.log('No accounts found');
        return false
      }
      return true
    } catch (error) {
      toast.error(error.message)
      // toast.error('You need to connect your Metamask')
      router.push('/');
      return false;
    }

  };

  const uploadToIPFS = async (file) => {
    try {
      const metadata = await client.store({
        name: "ABC",
        description: "ABC",
        image: file
      })

      return metadata.data.image.href;
    } catch (error) {
      toast.error('An error has occurred uploading file')
      console.log('Error uploading to file');
    }
  };

  const createNFT = async (formInput, fileUrl, router) => {
    const { name, description } = formInput;
    if (!name || !description || !fileUrl) return;
    const data = JSON.stringify({
      name, description, image: fileUrl,
    });

    try {
      const metadata = new Blob([data]);
      const cid = await client.storeBlob(metadata);
      const url = "https://ipfs.io/ipfs/" + cid;

      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      const contract = fetchContract(signer);

      const transaction = await contract.createToken(url);
      await transaction.wait();

      router.push('/my-nfts');
    } catch (error) {
      toast.error('An error has occurred creating NFTs')
      console.log('Error uploading to create nft');
    }
  };

  const listItem = async (formInputPrice, id) => {
    try {


      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      const price = ethers.utils.parseUnits(formInputPrice, 6);
      const contract = fetchContract(signer);

      const transaction = await contract.listItem(id, price);
      await transaction.wait();

    } catch (error) {
      toast.error('An error has occurred listing item')
    }
  };

  const unListItem = async (id) => {
    try {


      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      const contract = fetchContract(signer);

      const transaction = await contract.unListItem(id);
      await transaction.wait();

    } catch (error) {
      toast.error('An error has occurred unlisting item')
    }
  };

  const fetchNFTs = async (setLoading) => {
    try {

      setLoading(true)

      const network = process.env.NEXT_PUBLIC_ETH_NETWORK;
      const infura_key = process.env.NEXT_PUBLIC_INFURA_KEY
      const provider = new ethers.providers.InfuraProvider(network, infura_key);
      const contract = fetchContract(provider);

      const data = await contract.fetchMarketItems();

      const items = await Promise.all(data.map(
        async ({ tokenId, owner, price: unformattedPrice, onSale }) => {
          const tokenURI = await contract.tokenURI(tokenId);
          const { data: { image, name, description } } = await axios.get(tokenURI);
          const price = ethers.utils.formatUnits(unformattedPrice.toString(), 6);

          image.replace("https:ipfs.io", "https://infura-ipfs.io")
          console.log(image)

          return {
            price,
            tokenId: tokenId.toNumber(),
            owner,
            image,
            name,
            description,
            tokenURI,
            onSale
          };
        },
      ));
      return items;
    } catch (error) {
      toast.error('An error has occurred fetching NFTs')
    }
  };

  const fetchMyNFTsOrListedNFTs = async (type) => {

    try {

      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      const contract = fetchContract(signer);

      let data = await contract.fetchMyNFTs();

      if (type === 'fetchItemsListed')
        data = data.filter((item) => item.onSale == true);

      const items = await Promise.all(data.map(
        async ({ tokenId, owner, price: unformattedPrice, onSale }) => {
          const tokenURI = await contract.tokenURI(tokenId);
          const { data: { image, name, description } } = await axios.get(tokenURI);
          const price = ethers.utils.formatUnits(unformattedPrice.toString(), 6);



          return {
            price,
            tokenId: tokenId.toNumber(),
            owner,
            onSale,
            image,
            name,
            description,
            tokenURI,
          };
        },
      ));
      console.log('items: ', items)
      return items;

    } catch (error) {
      toast.error('An error has occurred fetching NFTs')
      router.push('/')
    }
  };

  const buyNFT = async (nft) => {
    try {
      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      const contract = fetchContract(signer);
      const usdc_contract = fetchUSDCContract(signer)

      const price = ethers.utils.parseUnits(nft.price, 6);
      const transaction_usdc = await usdc_contract.approve(MarketAddress, price)
      await transaction_usdc.wait();
      const transaction = await contract.createMarketSale(nft.tokenId);

      await transaction.wait();
      await ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC721',
          options: {
            address: process.env.NEXT_PUBLIC_MARKET_ADDRESS,
            tokenId: nft.tokenId 
          },
        },
      });
      getBalanceOfUSDC()
    } catch (error) {
      router.push('/')
      toast.error('An error has occurred buying NFTs')
      console.log(error.message)
    }

  };

  const claimUSDCTokens = async () => {
    try {
      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      const contract = fetchUSDCFaucetContract(signer)
      const transaction = await contract.claimTokens()
      await transaction.wait()
      toast.success('We send USDC to your wallet')
      getBalanceOfUSDC()
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: process.env.NEXT_PUBLIC_USDC_ADDRESS, // The address of the token.
            symbol: 'SepoliaUSDC', // A ticker symbol or shorthand, up to 5 characters.
            decimals: 6, // The number of decimals in the token.
            image: "https://ipfs.io/ipfs/bafybeibxxoboebmzbpqj5ooqfadl5uecjyth4i5wozcul5kkq7yernxyn4/Allianz Logo.jpeg", // A string URL of the token logo.
          },
        },
      });

    } catch (error) {
      toast.error('You can claim tokens once a day')
    }
  };

  const getBalanceOfUSDC = async () => {
    try {
      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      const contract = fetchUSDCContract(signer)
      const address = await signer.getAddress()
      const balance = await contract.balanceOf(address)

      const format_balance = ethers.utils.formatUnits(balance.toString(), 6);
      setBalanceOfUSDC(format_balance);

    } catch (error) {
      toast.error('An error has occurred getting balance.')
      console.log(error.message)
    }
  };

  useEffect(() => {
    checkIfWalletIsConnect();
  }, []);
  return (
    <NFTContext.Provider
      value={{
        nftCurrency,
        connectWallet,
        currentAccount,
        uploadToIPFS,
        createNFT,
        fetchNFTs,
        fetchMyNFTsOrListedNFTs,
        buyNFT,
        listItem,
        checkIfWalletIsConnect,
        unListItem,
        chainId, 
        setChainId,
        claimUSDCTokens,
        getBalanceOfUSDC,
        balanceOfUSDC
      }}
    >
      {children}
    </NFTContext.Provider>
  );
};
