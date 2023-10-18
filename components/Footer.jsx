import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/router';
import logo02 from '../assets/logo02.png';
import linkedin from '../assets/linkedin.png';
import instagram from '../assets/instagram.png';
import glogo from '../assets/g-logo.svg';
import twitter from '../assets/twitter.png';
import telegram from '../assets/telegram.png';
import discord from '../assets/discord.png';
import Button from './Button';
import Link from 'next/link';

const images = {
  logo02,
  instagram,
  twitter,
  telegram,
  discord,
  linkedin,
  glogo
}

const FooterLinks = ({ heading, items, extraClasses }) => {
  const router = useRouter();
  return (
    <div className={`flex-1 justify-start items-start ${extraClasses}`}>
      <h3 className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xl mb-10">{heading}</h3>
      {/* {items.map((item, index) => <p onClick={() => { router.push(`/${item.toLowerCase()}`) }} key={item + index} className="font-poppins dark:text-white text-nft-black-1 font-normal text-base cursor-pointer dark:hover:text-nft-gray-1 hover:text-nft-black-1 my-3">{item}</p>)} */}

      {items.map((item, index) => <p key={item + index} className="font-poppins dark:text-white text-nft-black-1 font-normal text-base cursor-pointer dark:hover:text-nft-gray-1 hover:text-nft-black-1 my-3"><Link href='/'>{item}</Link></p>)}

    </div>
  )
};

const Footer = () => {
  const { theme } = useTheme();

  return (
    <footer className="flexCenter flex-col border-t dark:border-nft-black-1 border-nft-gray-1 sm:py-8 py-16">
      <div className="w-full minmd:w-4/5 flex flex-row md:flex-col sm:px-4 px-16">
        <div className="flexStart flex-1 flex-col">
          <div className="flexCenter cursor-pointer">
            <Image src={images.logo02} objectFit="contain" width={32} height={32} alt="logo" />
            <p className=" dark:text-white text-nft-dark font-semibold text-lg ml-1">Los Pibes Marketplace</p>
          </div>

          <a href='https://github.com/giovaborgogno/nft_marketplace' rel="noreferrer" target='_blank' className='mt-6'>
            <Button
              btnName="Go to GitHUb Repository"
              btnType="primary"
              classStyles=" rounded-lg "
            />
          </a>
        </div>

        <div className="flex-1 flexBetweenStart flex-wrap ml-10 md:ml-0 md:mt-8">

          <FooterLinks heading="Support" items={['Help Center', 'Terms of service', 'Legal', 'Privacy policy']} extraClasses="ml-4" />
        </div>
      </div>

      <div className="flexCenter w-full mt-5 border-t dark:border-nft-black-1 border-nft-gray-1 sm:px-4 px-16">
        <div className="flexBetween flex-row w-full minmd:w-4/5 sm:flex-col mt-7">
          <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-base">Giovanni Borgogno. All Rights Reserved</p>
          <div className="flex flex-row sm:mt-4 items-start">
            {[images.linkedin].map((image, index) => (
              <a className="mx-2 cursor-pointer" key={`image ${index}`} href="https://www.linkedin.com/in/giovaborgogno/" rel="noreferrer" target='_blank'>
                <Image src={image} key={index} objectFit="contain" width={24} height={24} alt="social" className={`hover:filter hover:brightness-75 ${theme === 'light' ? 'filter invert' : 'undefined'}`} />
              </a>
            ))}
            <a href='https://giovaborgogno.com'  className='hover:text-gray-300 hover:filter hover:brightness-75 flex flex-row items-center' rel="noreferrer" target='_blank'><Image src={glogo} objectFit="contain" width={24} height={24} alt="social" className={`hover:filter hover:brightness-75 `} /> Portfolio</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
