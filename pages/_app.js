import Script from 'next/script';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { NFTProvider } from '../context/NFTContext';
import { Footer, Navbar } from '../components';
import '../styles/globals.css';
import Head from 'next/head';

const Marketplace = ({ Component, pageProps }) => (
  <NFTProvider>
    <ThemeProvider attribute="class">

      <Head>
        <link rel="shortcut icon" href="/logo02.jpeg" />
        <title>WebDAO Marketplace</title>
        <meta
          name="description"
          content="Los Pibes Marketplace"
        />
      </Head>
      <div className="dark:bg-nft-dark bg-white min-h-screen">
        <Navbar />
        <div className="pt-65">
          <Component {...pageProps} />
        </div>
        <Footer />
      </div>
      <Toaster />

      <Script src="https://kit.fontawesome.com/d45b25ceeb.js" crossorigin="anonymous" />

    </ThemeProvider>
  </NFTProvider>
);

export default Marketplace;
