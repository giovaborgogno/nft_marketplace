import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';

import { NFTContext } from '../context/NFTContext';
import { shortenAddress } from '../utils/shortenAddress';
import { Button, Input, Loader, Modal, TimeCountDown } from '../components';
import creator1 from '../assets/creator1.png';
import creator2 from '../assets/creator2.png';
import nft2 from '../assets/nft2.png';
import { STATUS_AUCTION, STATUS_DEFAULT, STATUS_FOR_SALE } from '../context/constants';
import { isExpired } from '../utils/isExpired';

const images = {
  creator1,
  creator2,
  nft2
}

const PaymentBodyCmp = ({ nft, nftCurrency }) => (

  <div className="flex flex-col">
    <div className="flexBetween">
      <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-base minlg:text-xl">Item</p>
      <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-base minlg:text-xl">Subtotal</p>
    </div>
    <div className="flexBetweenStart my-5">
      <div className="flex-1 flexStartCenter">
        <div className="relative w-28 h-28">
          <Image src={nft.image || images.nft2} layout="fill" objectFit="cover" />
        </div>
        <div className="flexCenterStart flex-col ml-5">
          <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-sm minlg:text-xl">{shortenAddress(nft.owner)}</p>
          <p className="font-poppins dark:text-white text-nft-black-1 text-sm minlg:text-xl font-normal">{nft.name}</p>
        </div>
      </div>
      <div>
        <p className="font-poppins dark:text-white text-nft-black-1 text-sm minlg:text-xl font-normal">{nft.price} <span className="font-semibold">{nftCurrency}</span></p>
      </div>
    </div>
    <div className="flexBetween mt-10">
      <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-base minlg:text-xl">Total</p>
      <p className="font-poppins dark:text-white text-nft-black-1 text-base minlg:text-xl font-normal">{nft.price} <span className="font-semibold">{nftCurrency}</span></p>
    </div>
  </div>
);

const AuctionBodyCmp = ({ nft, nftCurrency, setBidAmount }) => (

  <div className="flex flex-col">
    <div className="flexBetween">
      <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-base minlg:text-xl">Item</p>
      <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-base minlg:text-xl">Min Bid</p>
    </div>
    <div className="flexBetweenStart my-5">
      <div className="flex-1 flexStartCenter">
        <div className="relative w-28 h-28">
          <Image src={nft.image || images.nft2} layout="fill" objectFit="cover" />
        </div>
        <div className="flexCenterStart flex-col ml-5">
          <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-sm minlg:text-xl">{shortenAddress(nft.owner)}</p>
          <p className="font-poppins dark:text-white text-nft-black-1 text-sm minlg:text-xl font-normal">{nft.name}</p>
        </div>
      </div>
      <div>
        <p className="font-poppins dark:text-white text-nft-black-1 text-sm minlg:text-xl font-normal">{nft.price} <span className="font-semibold">{nftCurrency}</span></p>
      </div>
    </div>
    <div className="flexBetween mt-10">
      <Input
        inputType="number"
        title="Place a Bid"
        placeholder="Amount"
        handleClick={(e) => setBidAmount(e.target.value)}
        type='currency'
      />
      {/* <p className="font-poppins dark:text-white text-nft-black-1 text-base minlg:text-xl font-normal">{nft.price} <span className="font-semibold">{nftCurrency}</span></p> */}
    </div>
  </div>
);

const TopBidder = ({ currentPrice, highestBidder, endAt }) => (
  <>
    <div className="mt-10 flex flex-row sm:flex-col">
      <h2 className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl minlg:text-3xl">Auction Live</h2>
    </div>
    <div className="mt-2">
      <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xl minlg:text-xl">Highest Bidder</p>
      <div className="flex flex-row items-center mt-3">
        <div className="relative w-12 h-12 minlg:w-20 minlg:h-20 mr-2">
          <Image src={images.creator2} objectFit="cover" className="rounded-full" />
        </div>
        <p className="font-poppins dark:text-white text-nft-black-1 text-sm minlg:text-lg font-semibold">{shortenAddress(highestBidder)}</p>
      </div>
    </div>
    <div className='mt-4'>
        <p className='font-poppins dark:text-white text-nft-black-1 text-sm minlg:text-lg font-semibold'>Current Price: {currentPrice} USDC</p>
      {endAt && <TimeCountDown date={endAt} />}
    </div>

  </>

)

const NFTDetails = () => {
  const {
    nftCurrency,
    currentAccount,
    buyNFT,
    checkIfWalletIsConnect,
    unListItem,
    connectWallet,
    fetchNFT,
    bid,
    getHighestBidder,
    completeAuction,
    getBid,
    withdrawBid
  } = useContext(NFTContext);
  const [nft, setNft] = useState({
    image: '',
    tokenId: '',
    name: '',
    owner: '',
    price: '',
    status: '',
    netPrice: '',
    startAt: '',
    endAt: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const router = useRouter();
  const [paymentModal, setPaymentModal] = useState(false);
  const [auctionModal, setAuctionModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [bidAmount, setBidAmount] = useState(0);
  const [myBid, setMyBid] = useState(0)
  const [highestBidder, setHighestBidder] = useState('');

  const checkout = async () => {
    setIsLoadingPayment(true)
    await buyNFT(nft);

    setPaymentModal(false);
    setSuccessModal(true);
    setIsLoadingPayment(false)
  };

  const placeBid = async () => {
    setIsLoadingPayment(true)
    await bid(nft.tokenId, bidAmount);
    await fetch_nft(nft.tokenId);

    setAuctionModal(false);
    setSuccessModal(true);
    setIsLoadingPayment(false)
  };

  useEffect(() => {
    checkIfWalletIsConnect()
  }, [])

  useEffect(() => {
    if (!router.isReady) return;
    setNft(router.query);
    setIsLoading(false);
  }, [router.isReady]);

  const fetch_nft = async (tokenId) => {
    const item = await fetchNFT(tokenId);
    setNft({
      ...nft,
      ...item
    });
    if (item.status == STATUS_AUCTION) {
      const address = await getHighestBidder(tokenId)
      setHighestBidder(address)
      console.log(address)
    }
    if (currentAccount != ''){
      const my_bid = await getBid(tokenId, currentAccount)
      setMyBid(my_bid)
    }
  }
  useEffect(() => {
    if (nft.tokenId != '') {
      fetch_nft(nft.tokenId)
      setInterval(() => {
        fetch_nft(nft.tokenId)
      }, 30000);
    }
  }, [nft?.tokenId])

  const handleUnList = async () => {
    setIsLoadingPayment(true);
    await unListItem(nft.tokenId)
    setIsLoadingPayment(false);
    router.push('/listed-nfts')
  }

  const complete_auction = async () => {
    setIsLoadingPayment(true);
    await completeAuction(nft.tokenId)
    setIsLoadingPayment(false);
    router.push('/my-nfts')
  }

  const claim_bid = async () => {
    setIsLoadingPayment(true);
    await withdrawBid(nft.tokenId)
    setIsLoadingPayment(false);
    router.push('/')
  }

  

  if (isLoading) return <Loader />;

  return (
    <div className="relative flex justify-center md:flex-col min-h-screen">
      <div className="relative flex-1 flexCenter sm:px-4 p-12 border-r md:border-r-0 md:border-b dark:border-nft-black-1 border-nft-gray-1">
        <div className="relative w-557 minmd:w-2/3 minmd:h-2/3 sm:w-full sm:h-300 h-557 ">
          <Image src={nft.image || images.nft2} objectFit="cover" className=" rounded-xl shadow-lg" layout="fill" />
        </div>
      </div>

      <div className="flex-1 justify-start sm:px-4 p-12 sm:pb-4">
        <div className="flex flex-row sm:flex-col">
          <h2 className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl minlg:text-3xl">{nft.name}</h2>
        </div>

        <div className="mt-10">
          <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl minlg:text-2xl">Owner</p>
          <div className="flex flex-row items-center mt-3">
            <div className="relative w-12 h-12 minlg:w-20 minlg:h-20 mr-2">
              <Image src={images.creator1} objectFit="cover" className="rounded-full" />
            </div>
            <p className="font-poppins dark:text-white text-nft-black-1 text-sm minlg:text-lg font-semibold">{shortenAddress(nft.owner)}</p>
          </div>
        </div>

        <div className="mt-10 flex flex-col">
          <div className="w-full border-b dark:border-nft-black-1 border-nft-gray-1 flex flex-row">
            <p className="font-poppins dark:text-white text-nft-black-1 font-medium text-base mb-2">Details</p>
          </div>
          <div className="mt-3">
            <p className="font-poppins dark:text-white text-nft-black-1 font-normal text-base">
              Description: {nft.description}
            </p>
            <p className="font-poppins dark:text-white text-nft-black-1 font-normal text-base">
              Token Id: {nft.tokenId}
            </p>
            <p className="font-poppins dark:text-white text-nft-black-1 font-normal text-base">
              Contract Address: {process.env.NEXT_PUBLIC_MARKET_ADDRESS}
            </p>
          </div>
        </div>
        {nft.status == STATUS_AUCTION &&
          <TopBidder currentPrice={nft.price} highestBidder={highestBidder} endAt={nft.endAt} />}
        <div className="flex flex-row sm:flex-col mt-10">
          {currentAccount == '' ?
            <Button
              btnName="Connect your wallet"
              btnType="primary"
              classStyles="mr-5 sm:mr-0 sm:mb-5 rounded-xl"
              handleClick={connectWallet}
            />
            : currentAccount === nft.owner.toLowerCase()
              ? nft.status == STATUS_FOR_SALE ?
                (
                  <div className='flex flex-col gap-2'><p>On Sale for ${nft.price} ${nftCurrency}</p>
                    <Button
                      btnName="Unlist from Marketplace"
                      btnType="primary"
                      classStyles="mr-5 sm:mr-0 sm:mb-5 rounded-xl"
                      handleClick={handleUnList}
                      isLoading={isLoadingPayment}
                    />
                  </div>
                )
                : nft.status == STATUS_AUCTION && nft.price == nft.netPrice ?
                  (
                    <div className='flex flex-col gap-2'><p>Auction Live</p>
                      <Button
                        btnName="Unlist from Marketplace"
                        btnType="primary"
                        classStyles="mr-5 sm:mr-0 sm:mb-5 rounded-xl"
                        handleClick={handleUnList}
                        isLoading={isLoadingPayment}
                      />
                    </div>
                  )
                  : nft.status == STATUS_AUCTION && isExpired(nft.endAt) ?
                    (
                      <Button
                        btnName="Complete Auction"
                        btnType="primary"
                        classStyles="mr-5 sm:mr-0 sm:mb-5 rounded-xl"
                        handleClick={complete_auction}
                        isLoading={isLoadingPayment}
                      />
                    )
                    :
                    nft.status == STATUS_AUCTION && !isExpired(nft.endAt) ?
                    <></>
                    :
                    (
                      <>
                        <Button
                          btnName="List on Marketplace"
                          btnType="primary"
                          classStyles="mr-5 sm:mr-0 sm:mb-5 rounded-xl"
                          handleClick={() => router.push(`/resell-nft?id=${nft.tokenId}&tokenURI=${nft.tokenURI}`)}
                        />
                        <Button
                          btnName="Create Auction"
                          btnType="primary"
                          classStyles="mr-5 sm:mr-0 sm:mb-5 rounded-xl"
                          handleClick={() => router.push(`/auction-nft?id=${nft.tokenId}&tokenURI=${nft.tokenURI}`)}
                        />
                      </>
                    )
              :
              nft.status == STATUS_FOR_SALE ? (
                <Button
                  btnName={`Buy for ${nft.price} ${nftCurrency}`}
                  btnType="primary"
                  classStyles="mr-5 sm:mr-0 sm:mb-5 rounded-xl"
                  handleClick={() => { setPaymentModal(true); }}
                />
              )
                :
                nft.status == STATUS_AUCTION && isExpired(nft.endAt) && highestBidder.toLowerCase() == currentAccount.toLowerCase() ?
                  (
                    <Button
                      btnName="Complete Auction"
                      btnType="primary"
                      classStyles="mr-5 sm:mr-0 sm:mb-5 rounded-xl"
                      handleClick={complete_auction}
                      isLoading={isLoadingPayment}
                    />
                  )
                  :
                  nft.status == STATUS_AUCTION && !isExpired(nft.endAt) ?
                    <Button
                      btnName={`Place Bid`}
                      btnType="primary"
                      classStyles="mr-5 sm:mr-0 sm:mb-5 rounded-xl"
                      handleClick={() => { setAuctionModal(true); }}
                    />
                    :
                    isExpired(nft.endAt) && myBid > 0 ?
                    <div className='flex flex-col gap-2'><p>You are not the winner</p>
                    <Button
                      btnName={`Claim Bid`}
                      btnType="primary"
                      classStyles="mr-5 sm:mr-0 sm:mb-5 rounded-xl"
                      handleClick={claim_bid}
                      isLoading={isLoadingPayment}
                    />
                    </div>
                    :
                    <></>
          }
        </div>
      </div>

      {paymentModal
        && (
          <Modal
            header="Check Out"
            body={<PaymentBodyCmp nft={nft} nftCurrency={nftCurrency} />}
            footer={(
              <div className="flex flex-row gap-2">
                <Button
                  btnName="Confirm"
                  classStyles="mr-5 sm:mr-0 rounded-xl"
                  handleClick={checkout}
                  isLoading={isLoadingPayment}
                />
                <Button
                  btnName="Cancel"
                  classStyles="rounded-xl"
                  handleClick={() => { setPaymentModal(false); }}
                />
              </div>
            )}
            handleClose={() => { setPaymentModal(false); }}
          />
        )}
      {auctionModal
        &&
        (
          <Modal
            header="Check Out"
            body={<AuctionBodyCmp nft={nft} nftCurrency={nftCurrency} setBidAmount={setBidAmount} />}
            footer={(
              <div className="flex flex-row gap-2">
                <Button
                  btnName="Confirm"
                  classStyles="mr-5 sm:mr-0 rounded-xl"
                  handleClick={placeBid}
                  isLoading={isLoadingPayment}
                />
                <Button
                  btnName="Cancel"
                  classStyles="rounded-xl"
                  handleClick={() => { setAuctionModal(false); }}
                />
              </div>
            )}
            handleClose={() => { setAuctionModal(false); }}
          />
        )
      }
      {successModal
        && (
          <Modal
            header="Payment Successful"
            body={(
              <div className="flexCenter flex-col text-center" onClick={() => setSuccessModal(false)}>
                <div className="relative w-52 h-52">
                  <Image src={nft.image || images.nft2} objectFit="cover" layout="fill" />
                </div>
                <p className="font-poppins dark:text-white text-nft-black-1 text-sm minlg:text-xl font-normal mt-10"> You successfully purchased <span className="font-semibold">{nft.name}</span> from <span className="font-semibold">{shortenAddress(nft.owner)}</span>.</p>
              </div>
            )}
            footer={
              nft.status == STATUS_FOR_SALE ?
                (
                  <div className="flexCentre flex-col ">
                    <Button
                      btnName="Check it out"
                      classStyles="sm:mb-5 sm:mr-0 rounded-xl"
                      handleClick={() => { router.push('/my-nfts'); }}
                    />
                  </div>
                )
                : <></>}
            handleClose={() => { setSuccessModal(false); }}
          />
        )}
    </div>

  );
};

export default NFTDetails;
