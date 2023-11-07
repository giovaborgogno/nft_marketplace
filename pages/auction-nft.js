import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

import { NFTContext } from '../context/NFTContext';
import { Button, Input, Loader } from '../components';
import toast from 'react-hot-toast';

const AuctionNFT = () => {
  const { auctionItem, isLoadingNFT, checkIfWalletIsConnect } = useContext(NFTContext);
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState(0);
  const [image, setImage] = useState('');
  const router = useRouter();
  const { id, tokenURI } = router.query;
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);

  const fetchNFT = async () => {
    const { data } = await axios.get(tokenURI);

    setPrice(data.price);
    setImage(data.image);
    setIsLoading(false);
  };


  useEffect(()=>{
    checkIfWalletIsConnect()
  },[])

  useEffect(() => {
    if (tokenURI) fetchNFT();
  }, [tokenURI]);

  const createAuction = async () => {
    setIsLoadingPayment(true);
    await auctionItem(id, price, duration);
    router.push('/listed-nfts');
    setIsLoadingPayment(false);
  };

  if (isLoadingNFT) {
    return (
      <div className="flexCenter" style={{ height: '51vh' }}>
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex justify-center sm:px-4 p-12">
      <div className="w-3/5 md:w-full">
        <h1 className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl">Auction NFT</h1>

        <Input
          inputType="number"
          title="Price"
          placeholder="Asset Price"
          handleClick={(e) => setPrice(e.target.value)}
          type='currency'
        />
        <Input
          inputType="number"
          title="Duration"
          placeholder="Duration Time"
          handleClick={(e) => setDuration(e.target.value)}
        />

        {image && <img className="rounded mt-4" width="350" src={image} />}

        <div className="mt-7 w-full flex justify-end">
          <Button
            btnName="Create Auction"
            btnType="primary"
            classStyles="rounded-xl"
            handleClick={createAuction}
            isLoading={isLoadingPayment}
          />
        </div>
      </div>
    </div>
  );
};

export default AuctionNFT;
