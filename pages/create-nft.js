import React, { useState, useMemo, useCallback, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { useTheme } from 'next-themes';

import { Button, Input, Loader } from '../components';
import upload from '../assets/upload.png';
import loader from '../assets/loader.gif';
import { NFTContext } from '../context/NFTContext';

const images = {
  upload, 
  loader
}

const CreateNFT = () => {

  const [loadingFile, setLoadingFile] = useState(false)
  const [isLoading, setIsLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const { theme } = useTheme();
  const [formInput, setFormInput] = useState({
    name: '',
    description: '',
  });
  const { uploadToIPFS, createNFT, checkIfWalletIsConnect } = useContext(NFTContext);
  const router = useRouter();
  const onDrop = useCallback(async (acceptedFile) => {
    setLoadingFile(true);
    const url = await uploadToIPFS(acceptedFile[0]);
    console.log({ url });
    setFileUrl(url.replace("ipfs://","https://ipfs.io/ipfs/"));
    setLoadingFile(false);
  }, []);

  useEffect(()=>{
    checkIfWalletIsConnect()
  },[])

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
    accept: 'image/*',
    maxSize: 50000000,
  });

  const fileStyle = useMemo(
    () => `dark:bg-nft-black-1 bg-white border dark:border-white border-nft-gray-2 flex flex-col items-center p-5 rounded-sm border-dashed 
        ${isDragActive && 'border-file-active'} 
        ${isDragAccept && 'border-file-accept'}
        ${isDragReject && 'border-file-reject'}
      `,
    [isDragActive, isDragAccept, isDragReject],
  );

  const handleClick = async (formInput, fileUrl, router) => {
    setIsLoading(true);
    await createNFT(formInput, fileUrl, router);
    setIsLoading(false);
  }

  return (
    <div className="flex justify-center sm:px-4 p-12">
      <div className="w-3/5 md:w-full">
        <h1 className="font-poppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold ml-4 sm:mb-4">
          Create New NFT
        </h1>
        <div className="mt-16">
          <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xl">
            Upload files
          </p>
          <div className="mt-4">
            <div {...getRootProps()} className={fileStyle}>
              <input {...getInputProps()} />
              <div className="flexCenter flex-col text-center">
                <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xl">
                  JPG, GIF, SVG, WEBM Mx 100mb.
                </p>
                <div className="my-12 w-full flex justify-center">
                  <Image
                    src={loadingFile ? images.loader : images.upload}
                    width={100}
                    height={100}
                    objectFit="contain"
                    alt="File Upload"
                    className={theme === 'light' ? 'filter invert' : ''}
                  />
                </div>
                <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-sm">
                  Drag and Drop File
                </p>
                <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xl mt-2">
                  or Browse media on your device
                </p>
              </div>
            </div>
            {fileUrl && (
              <aside>
                <div>
                  <img src={fileUrl} alt="asset_file" />
                </div>
              </aside>
            )}
          </div>
        </div>
        <Input
          inputType="input"
          title="Name"
          placeholder="NFT Name"
          handleClick={(e) => setFormInput({ ...formInput, name: e.target.value })}
        />
        <Input
          inputType="textarea"
          title="Desciption"
          placeholder="Description of your NFT"
          handleClick={(e) => setFormInput({ ...formInput, description: e.target.value })}
        />

        <div className="mt-7 w-full flex justify-end">
          <Button
            btnName="Create NFT"
            classStyles={`rounded-xl ${isLoading ? 'my-1' : ''}`}
            handleClick={() => handleClick(formInput, fileUrl, router)}
            isLoading={isLoading}
            btnType="primary"
            disabled={fileUrl == '' || formInput.name == '' || formInput.description == '' || loadingFile}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateNFT;
