import Image from 'next/image';
import loader from '../assets/loader.gif';

const images = {
  loader
}


const Loader = ({width=100}) => (
  <div className="flexCenter w-full">
    <Image src={images.loader} alt="loader" width={width} height={width}  objectFit="contain" />
  </div>
);

export default Loader;
