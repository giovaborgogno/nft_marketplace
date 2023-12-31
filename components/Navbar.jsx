import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';

import logo02 from '../assets/logo02.png';
import menu from '../assets/menu.png';
import cross from '../assets/cross.png';
import { NFTContext } from '../context/NFTContext';
import Button from './Button';
import toast from 'react-hot-toast';

const images = {
  logo02,
  menu,
  cross
}

const MenuItems = ({ isMobile, active, setActive, setIsOpen }) => {
  const generateLink = (i) => {
    switch (i) {
      case 0:
        return '/';
      case 1:
        return '/listed-nfts';
      case 2:
        return '/my-nfts';
      default:
        return '/';
    }
  };

  return (
    <ul className={`list-none flexCenter flex-row ${isMobile && 'flex-col h-full'}`}>
      {['Explore NFTs', 'Listed NFTs', 'My NFTs'].map((item, i) => (
        <li
          key={i}
          onClick={() => {
            setActive(item);

            if (isMobile) setIsOpen(false);
          }}
          className={`flex flex-row items-center font-poppins font-semibold text-base dark:hover:text-white hover:text-nft-dark mx-3
          ${active === item
              ? 'dark:text-white text-nft-black-1'
              : 'dark:text-nft-gray-2 text-nft-gray-2'} 
          ${isMobile && 'my-5 text-xl'}`}
        >
          <Link href={generateLink(i)}>{item}</Link>
        </li>
      ))}
    </ul>
  );
};

const ButtonGroup = ({ setActive, router }) => {
  const { connectWallet, currentAccount, chainId } = useContext(NFTContext);
  const [chain_id, set_chain_id] = useState(chainId)

  useEffect(() => {
    set_chain_id(chainId)
  }, [chainId])

  return (
    <> {currentAccount ? chain_id == process.env.NEXT_PUBLIC_ETH_NETWORK_CHAIN_ID ? (
      <div className="flexCenter">
        <Button
          btnName="Create"
          btnType="primary"
          classStyles="mx-2 rounded-xl"
          handleClick={() => {
            setActive('');
            router.push('/create-nft');
          }}
        />
      </div>
    ) :
      (
        <div className="flexCenter">
          <Button
            btnName="Change to correct network"
            btnType="primary"
            classStyles="mx-2 rounded-xl !bg-red-600"
            handleClick={async () => {
              await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{
                  chainId: process.env.NEXT_PUBLIC_ETH_NETWORK_CHAIN_ID
                }]
              });
            }}
          />
        </div>
      )
      : (
        <Button
          btnName="Connect"
          btnType="outline"
          classStyles="mx-2 rounded-lg border-nft-border-button"
          handleClick={connectWallet}
        />

      )
    }</>
  )

};

const checkActive = (active, setActive, router) => {
  switch (router.pathname) {
    case '/':
      if (active !== 'Explore NFTs') setActive('Explore NFTs');
      break;
    case '/listed-nfts':
      if (active !== 'Listed NFTs') setActive('Listed NFTs');
      break;
    case '/my-nfts':
      if (active !== 'My NFTs') setActive('My NFTs');
      break;
    case '/create-nft':
      if (active !== '') setActive('');
      break;
    default:
      setActive('');
  }
};

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const [active, setActive] = useState('Explore NFTs');
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { balanceOfUSDC, getBalanceOfUSDC, claimUSDCTokens, currentAccount, checkIfWalletIsConnect } = useContext(NFTContext);
  const [isLoading, setIsLoading] = useState(false)
  const [interval, set_interval] = useState(false)

  useEffect(() => {
    if (currentAccount != '') getBalanceOfUSDC()
  }, [balanceOfUSDC, currentAccount]);

  useEffect(() => {
    setTheme('dark');
  }, []);

  useEffect(() => {

    //Implementing the setInterval method 
    const _interval = setInterval(() => {
      set_interval(!interval)
    }, 3000);

    //Clearing the interval 
    return () => clearInterval(_interval);
  }, [interval]);


  useEffect(() => {
    checkActive(active, setActive, router);
  }, [router.pathname]);

  useEffect(() => {
    // disable body scroll when navbar is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'visible';
    }
  }, [isOpen]);

  return (
    <nav className="flex w-full fixed z-10 p-4 flex-row border-b dark:bg-nft-dark bg-white dark:border-nft-black-1 border-nft-gray-1 justify-between">
      <div className="flex-none flex flex-row justify-start">
        <Link href="/">
          <div className="flexCenter md:hidden cursor-pointer" onClick={() => setActive('Explore NFTs')}>
            <Image src={images.logo02} objectFit="contain" width={32} height={32} alt="logo" />
            <p className=" dark:text-white text-nft-black-1 font-semibold text-lg ml-1">Los Pibes Marketplace</p>
          </div>
        </Link>
        <Link href="/">
          <div
            className="hidden md:flex"
            onClick={() => {
              setActive('Explore NFTs');
              setIsOpen(false);
            }}
          >
            <Image src={images.logo02} objectFit="contain" width={32} height={32} alt="logo" />
          </div>
        </Link>
      </div>

      <div className="flex-1 md:hidden flex items-center justify-end">
        <ul className="list-none flexCenter flex-row">
          <MenuItems active={active} setActive={setActive} />
        </ul>
      </div>

      <div className="flex-1 flex flex-row justify-end">
        <div className=" flex items-center mr-2">
          <input
            type="checkbox"
            className="checkbox"
            id="checkbox"
            onChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          />
          <label htmlFor="checkbox" className="flexBetween w-8 h-4 bg-black rounded-2xl p-1 relative label">
            <i className="fas fa-sun" />
            <i className="fas fa-moon" />
            <div className="w-3 h-3 absolute bg-white rounded-full ball" />
          </label>
        </div>

        <div className=" md:hidden flex items-center justify-end">

          <Button
            btnName="Claim 1500 USDC"
            btnType="outline"
            classStyles="ml-2 rounded-lg"
            handleClick={async () => {
              const isConnected = await checkIfWalletIsConnect();
              if (isConnected) {
                setIsLoading(true);
                await claimUSDCTokens()
                setIsLoading(false)
              }
              else {
                toast.error('Connect your metamask')
              }
            }}
            isLoading={isLoading}
          />
          <Link href='https://sepoliafaucet.com/' >
            <a target='_blank'>
              <Button
                btnName="Get Sepolia ETH for gas"
                btnType="outline"
                classStyles="ml-2 rounded-lg"
              />
            </a>
          </Link>



          <div className="">
            <ButtonGroup setActive={setActive} router={router} />
          </div>
        </div>
      </div>

      <div className="hidden md:flex ml-2">
        {!isOpen
          ? (
            <Image
              src={images.menu}
              objectFit="contain"
              width={25}
              height={25}
              alt="menu"
              onClick={() => setIsOpen(!isOpen)}
              className={theme === 'light' ? 'filter invert' : undefined}
            />
          )
          : (
            <Image
              src={images.cross}
              objectFit="contain"
              width={20}
              height={20}
              alt="close"
              onClick={() => setIsOpen(!isOpen)}
              className={theme === 'light' ? 'filter invert' : undefined}
            />
          )}

        {isOpen && (
          <div className="fixed inset-0 top-65 dark:bg-nft-dark bg-white z-10 nav-h flex justify-between flex-col items-center  gap-3">
            <div className="flex-1 p-4">
              <MenuItems active={active} setActive={setActive} isMobile setIsOpen={setIsOpen} />

            </div>
            <Button
              btnName="Claim 1500 USDC"
              btnType="outline"
              classStyles="ml-2 rounded-lg"
              handleClick={async () => {
                const isConnected = await checkIfWalletIsConnect();
                if (isConnected) {
                  await claimUSDCTokens()
                }
                else {
                  toast.error('Connect your metamask')
                }
              }}
            />
            <Link href='https://sepoliafaucet.com/' >
              <a target='_blank'>
                <Button
                  btnName="Get Sepolia ETH for gas"
                  btnType="outline"
                  classStyles="ml-2 rounded-lg"
                />
              </a>
            </Link>
            <div className="p-4 border-t dark:border-nft-black-1 border-nft-gray-1 mb-24">

              <ButtonGroup setActive={setActive} router={router} />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
