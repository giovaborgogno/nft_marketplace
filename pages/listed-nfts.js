import React, { useState, useEffect, useContext } from 'react';
import { NFTContext } from '../context/NFTContext';
import { Banner, Loader, NFTCard } from '../components';
import creator1 from '../assets/creator1.png';
import { shortenAddress } from '../utils/shortenAddress';
import Image from 'next/image';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

const images = {
  creator1
}

const ListedNFTs = () => {
  const [nfts, setNfts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchMyNFTsOrListedNFTs, currentAccount, checkIfWalletIsConnect } = useContext(NFTContext);

  const init = async () => {
    const isConnected = await checkIfWalletIsConnect()
    if (!isConnected) return;
    fetchMyNFTsOrListedNFTs('fetchItemsListed')
      .then((items) => {
        setNfts(items);
        setIsLoading(false);
      });
  };
  useEffect(() => {
    init()
  }, []);


  // if (!isLoading && nfts.length === 0) {
  //   return (
  //     <div className="flexCenter sm:p-4 p-16 min-h-screen">
  //       <h1 className="font-poppins dark:text-white text-nft-black-1 text-3xl font-extrabold">No NFTs Listed for Sale</h1>
  //     </div>
  //   );
  // }

  return (
    <>
      <div className="w-full flexCenter flex-col">
        <Banner
          name="Your Listed NFTs"
          childStyles="text-center mb-4 px-4"
          parentStyle="h-80 justify-center"
        />
      </div>
      <div className="flexCenter flex-col -mt-20 z-0">
        <div className="flexCenter w-40 h-40 sm:w-36 sm:h-36 p-1 bg-nft-black-2 rounded-full">
          <Image src={images.creator1} className="rounded-full object-cover" objectFit="cover" />
        </div>
        <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl mt-6">{shortenAddress(currentAccount)}</p>
      </div>
      <div className="flex justify-center sm:px-4 p-12 min-h-screen">


        <div className="w-full minmd:w-4/5">
          <div className="mt-4">
            <div className="mt-3 w-full flex sm:flex-col flex-wrap justify-start justify-center">
              {
                isLoading ? <Loader /> : nfts?.length ? nfts?.map((nft, i) => <NFTCard key={i} nft={nft} />)
                  :
                  <div className="flexCenter sm:p-4 p-16">
                    <h1 className="font-poppins dark:text-white text-nft-black-1 text-3xl font-extrabold">No NFTs listed</h1>
                  </div>
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ListedNFTs;
