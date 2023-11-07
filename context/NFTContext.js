import React, { useEffect, useState } from 'react';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';
import axios from 'axios';
import { MarketAddress, MarketAddressABI, USDCSepoliaAddress, USDCSepoliaABI, USDCFaucetABI, USDCFaucetAddress, DECIMALS, STATUS_FOR_SALE, STATUS_AUCTION } from './constants';
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

      const price = ethers.utils.parseUnits(formInputPrice, DECIMALS);
      const contract = fetchContract(signer);

      const transaction = await contract.listItem(id, price);
      await transaction.wait();

    } catch (error) {
      toast.error('An error has occurred listing item')
    }
  };

  const auctionItem = async (id, formInputPrice, durationInSeconds) => {
    try {


      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      const price = ethers.utils.parseUnits(formInputPrice, DECIMALS);
      const contract = fetchContract(signer);

      const transaction = await contract.auctionItem(id, price, durationInSeconds);
      await transaction.wait();

    } catch (error) {
      toast.error('An error has occurred while auctioning the item')
    }
  };

  const bid = async (id, formInputAmount) => {
    try {


      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      const contract = fetchContract(signer);
      const usdc_contract = fetchUSDCContract(signer)
      
      const amount = ethers.utils.parseUnits(formInputAmount, DECIMALS);
      const address = signer.getAddress()
      const bid = await contract.getBid(id, address);
      const newDeposit = amount - bid;
      
      const transaction_usdc = await usdc_contract.approve(MarketAddress, newDeposit)
      await transaction_usdc.wait();

      const transaction = await contract.bid(id, amount);
      await transaction.wait();

    } catch (error) {
      toast.error('An error has occurred while biding')
    }
  };

  const completeAuction = async (id) => {
    try {


      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      const contract = fetchContract(signer);

      const transaction = await contract.completeAuction(id);
      await transaction.wait();

    } catch (error) {
      toast.error('An error has occurred while completing the auction')
    }
  };

  const withdrawBid = async (id) => {
    try {


      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      const contract = fetchContract(signer);

      const transaction = await contract.withdrawBid(id);
      await transaction.wait();

      toast.success('We send your USDCs to your wallet')

    } catch (error) {
      toast.error('An error has occurred while withdrawing the bid')
    }
  };

  const withdraw = async () => {
    try {


      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      const contract = fetchContract(signer);

      const transaction = await contract.withdraw();
      await transaction.wait();

    } catch (error) {
      toast.error('An error has occurred while withdrawing the funds')
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

  const fetchAuctionItems = async (setLoading) => {
    try {

      setLoading(true)

      const network = process.env.NEXT_PUBLIC_ETH_NETWORK;
      const infura_key = process.env.NEXT_PUBLIC_INFURA_KEY
      const provider = new ethers.providers.InfuraProvider(network, infura_key);
      const contract = fetchContract(provider);

      const data = await contract.fetchAuctionItems();

      const items = await Promise.all(data.map(
        async ({ tokenId, owner, price: unformattedPrice, status, netPrice: unformattedNetPrice, startAt, endAt }) => {
          const tokenURI = await contract.tokenURI(tokenId);
          const { data: { image, name, description } } = await axios.get(tokenURI);
          const price = ethers.utils.formatUnits(unformattedPrice.toString(), DECIMALS);
          const netPrice = ethers.utils.formatUnits(unformattedNetPrice.toString(), DECIMALS);

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
            status,
            netPrice, 
            startAt, 
            endAt
          };
        },
      ));
      return items;
    } catch (error) {
      toast.error('An error has occurred fetching NFTs')
    }
  };

  const fetchNFT = async (id) => {
    try {

      const network = process.env.NEXT_PUBLIC_ETH_NETWORK;
      const infura_key = process.env.NEXT_PUBLIC_INFURA_KEY
      const provider = new ethers.providers.InfuraProvider(network, infura_key);
      const contract = fetchContract(provider);

      const { 
        tokenId, 
        owner, 
        price: unformattedPrice, 
        status, 
        netPrice: unformattedNetPrice, 
        startAt, 
        endAt 
      } = await contract.fetchNFT(id);

      const tokenURI = await contract.tokenURI(tokenId);
      const { data: { image, name, description } } = await axios.get(tokenURI);
      const price = ethers.utils.formatUnits(unformattedPrice.toString(), DECIMALS);
      const netPrice = ethers.utils.formatUnits(unformattedNetPrice.toString(), DECIMALS);

      image.replace("https:ipfs.io", "https://infura-ipfs.io")

      return {
        price,
        tokenId: tokenId.toNumber(),
        owner,
        image,
        name,
        description,
        tokenURI,
        status,
        netPrice, 
        startAt, 
        endAt
      };
    } catch (error) {
      toast.error('An error has occurred fetching NFT')
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
        async ({ tokenId, owner, price: unformattedPrice, status }) => {
          const tokenURI = await contract.tokenURI(tokenId);
          const { data: { image, name, description } } = await axios.get(tokenURI);
          const price = ethers.utils.formatUnits(unformattedPrice.toString(), DECIMALS);

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
            status
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
        data = data.filter((item) => (item.status == STATUS_FOR_SALE || item.status == STATUS_AUCTION));

      const items = await Promise.all(data.map(
        async ({ tokenId, owner, price: unformattedPrice, status }) => {
          const tokenURI = await contract.tokenURI(tokenId);
          const { data: { image, name, description } } = await axios.get(tokenURI);
          const price = ethers.utils.formatUnits(unformattedPrice.toString(), DECIMALS);



          return {
            price,
            tokenId: tokenId.toNumber(),
            owner,
            status,
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

      const price = ethers.utils.parseUnits(nft.price, DECIMALS);
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
            decimals: DECIMALS, // The number of decimals in the token.
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

      const format_balance = ethers.utils.formatUnits(balance.toString(), DECIMALS);
      setBalanceOfUSDC(format_balance);

    } catch (error) {
      toast.error('An error has occurred getting balance.')
      console.log(error.message)
    }
  };

  const getHighestBidder = async (id) => {
    try {

      const network = process.env.NEXT_PUBLIC_ETH_NETWORK;
      const infura_key = process.env.NEXT_PUBLIC_INFURA_KEY
      const provider = new ethers.providers.InfuraProvider(network, infura_key);
      const contract = fetchContract(provider);

      const address = await contract.getHighestBidder(id);
      return address;
    } catch (error) {
      toast.error('An error has occurred fetching the highest bidder')
    }
  };

  const getBid = async (id, address) => {
    try {

      const network = process.env.NEXT_PUBLIC_ETH_NETWORK;
      const infura_key = process.env.NEXT_PUBLIC_INFURA_KEY
      const provider = new ethers.providers.InfuraProvider(network, infura_key);
      const contract = fetchContract(provider);

      const bid = await contract.getBid(id, address);
      return bid;
    } catch (error) {
      toast.error('An error has occurred fetching bids')
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
        balanceOfUSDC,
        auctionItem,
        bid,
        completeAuction,
        withdrawBid,
        withdraw,
        fetchAuctionItems,
        fetchNFT,
        getHighestBidder,
        getBid,
      }}
    >
      {children}
    </NFTContext.Provider>
  );
};
