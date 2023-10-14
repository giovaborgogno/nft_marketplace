import { useState, useEffect, useRef, useContext } from 'react';
import Image from 'next/dist/client/image';
import { useTheme } from 'next-themes';
import { Banner, CreatorCard, Loader, NFTCard, SearchBar } from '../components';
import left from '../assets/left.png';
import right from '../assets/right.png';
import creator1 from '../assets/creator1.png';
import creator2 from '../assets/creator2.png';
import creator3 from '../assets/creator3.png';
import creator4 from '../assets/creator4.png';
import creator5 from '../assets/creator5.png';
import creator6 from '../assets/creator6.png';
import creator7 from '../assets/creator7.png';
import creator8 from '../assets/creator8.png';
import creator9 from '../assets/creator9.png';
import { NFTContext } from '../context/NFTContext';
import { getCreators } from '../utils/getTopCreators';
import { shortenAddress } from '../utils/shortenAddress';

const images = {
  left,
  right,
  creator1,
  creator2,
  creator3,
  creator4,
  creator5,
  creator6,
  creator7,
  creator8,
  creator9,
  creator10: creator6
}

const Home = () => {
  const { theme } = useTheme;
  const parentRef = useRef(null);
  const scrollRef = useRef(null);
  const [hideButtons, setHideButtons] = useState(false);
  const { fetchNFTs, balanceOfUSDC } = useContext(NFTContext);
  const [nfts, setNfts] = useState([]);
  const [nftsCopy, setNftsCopy] = useState([]);
  const [activeSelect, setActiveSelect] = useState('Recently added');
  const [loading, setLoading] = useState(true)
  const handleScroll = (direction) => {
    const { current } = scrollRef;

    const scrollAmount = window.innerWidth > 1800 ? 270 : 210;

    if (direction === 'left') {
      current.scrollLeft -= scrollAmount;
    } else {
      current.scrollLeft += scrollAmount;
    }
  };

  const isScrollable = () => {
    const { current } = scrollRef;
    const { current: parent } = parentRef;

    if (current?.scrollWidth >= parent?.offsetWidth) return setHideButtons(false);
    return setHideButtons(true);
  };
  // useEffect(() => {
  //   isScrollable();
  //   const add_func = async () => window.addEventListener('resize', isScrollable);
  //   add_func()
  //   const remove_func = async () => window.removeEventListener('resize', isScrollable);
  //   return remove_func()
  // });

  useEffect(() => {
    fetchNFTs(setLoading)
      .then((items) => {
        setNfts(items);
        setNftsCopy(items);
        setLoading(false)
      });
  }, []);

  useEffect(() => {
    const sortedNfts = [...nfts];

    switch (activeSelect) {
      case 'Price (low to high)':
        setNfts(sortedNfts.sort((a, b) => a.price - b.price));
        break;
      case 'Price (high to low)':
        setNfts(sortedNfts.sort((a, b) => b.price - a.price));
        break;
      case 'Recently added':
        setNfts(sortedNfts.sort((a, b) => b.tokenId - a.tokenId));
        break;
      default:
        setNfts(nfts);
        break;
    }
  }, [activeSelect]);

  const onHandleSearch = (value) => {
    const filteredNfts = nfts.filter(({ name }) => name.toLowerCase().includes(value.toLowerCase()));

    if (filteredNfts.length) {
      setNfts(filteredNfts);
    } else {
      setNfts(nftsCopy);
    }
  };

  const onClearSearch = () => {
    if (nfts.length && nftsCopy.length) {
      setNfts(nftsCopy);
    }
  };

  const topCreators = getCreators(nftsCopy);

  return (
    <div className="flex justify-center sm:px-4 p-12">
      <div className="w-full minmd:w-4/5">
        <Banner
          name={(<>Discover, collect, and sell <br /> extraordinary NFTs</>)}
          childStyles="md:text-4xl sm:text-2xl xs:text-xl text-left"
          parentStyle="justify-start mb-7 h-72 sm:h-60 p-12 xs:p-4 xs:h-44 rounded-3xl"
        />
        <div>
          <h1 className="font-popppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold ml-4 xs:ml-0">Best Creators</h1>
          <div className="relative flex-1 max-w-full flex mt-3" ref={parentRef}>
            <div className="flex flex-row w-max overflow-x-scroll no-scrollbar select-none" ref={scrollRef}>
              {/* {[6, 7, 8, 9, 10].map((i) => (
                <CreatorCard
                  key={`creator-${i}`}
                  rank={i}
                  creatorImage={images[`creator${i}`]}
                  creatorName={`0x000test`}
                  creatorEths={10 - i * 0.5}
                />
              ))} */}
              {
                !loading
                  ?
                  topCreators.slice(0, 9).map((creator, i) => (
                    <CreatorCard
                      key={creator.owner}
                      rank={i + 1}
                      creatorImage={images[`creator${i + 1}`]}
                      creatorName={shortenAddress(creator.owner)}
                      creatorEths={creator.sum}
                    />
                  ))
                  :
                  <Loader />}
              {!hideButtons && (
                <>
                  <div onClick={() => handleScroll('left')} className="absolute w-8 h-8 minlg:w-12 minlg:h-12 top-45 cursor-pointer left-0">
                    <Image src={images.left} layout="fill" objectFit="contain" alt="left_arrow" className={theme === 'light' ? 'filter invert' : undefined} />
                  </div>
                  <div onClick={() => handleScroll('right')} className="absolute w-8 h-8 minlg:w-12 minlg:h-12 top-45 cursor-pointer right-0">
                    <Image src={images.right} layout="fill" objectFit="contain" alt="left_arrow" className={theme === 'light' ? 'filter invert' : undefined} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="mt-10">
          <div className="flexBetween mx-4 xs:mx-0 minlg:mx-8 sm:flex-col sm:items-start">
            <div className='flex-1 minlg:text-4xl sm:mb-4'>
              <h1 className="flex-1 before:font-popppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold ">Hot Bidz </h1>
              <p className='text-sm'>USDC Balance: {balanceOfUSDC}</p>
            </div>
            <div className="flex-2 sm:w-full flex flex-row sm:flex-col">
              <SearchBar activeSelect={activeSelect} setActiveSelect={setActiveSelect} handleSearch={onHandleSearch} clearSearch={onClearSearch} />
            </div>
          </div>
          <div className="mt-3 w-full flex flex-wrap justify-start md:justify-center">

            {
              !loading ?
                nfts.map((nft) => (
                  <NFTCard
                    key={nft.tokenId}
                    nft={nft}
                  />
                )) :
                <Loader />
            }
            {/* {
                  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                    <NFTCard
                      key={`nft-${i}`}
                      nft={{
                        i,
                        name: `Nifty NFT ${i}`,
                        price: (10 - i * 0.534).toFixed(2),
                        
                        owner: `0x${makeid(3)}...${makeid(4)}`,
                        description: 'Cool NFT on Sale',
                      }}
                    />
                  ))
                } */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
