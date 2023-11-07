// export const getCreators = (nfts) => {
//   const creators = nfts.reduce((creatorObject, nft) => {
//     (creatorObject[nft.owner] = creatorObject[nft.owner] || []).push(nft);

//     return creatorObject;
//   }, {});

//   return Object.entries(creators).map((creator) => {
//     const owner = creator[0];
//     const sum = creator[1].map((item) => Number(item.price)).reduce((prev, curr) => prev + curr, 0);

//     return ({ owner, sum });
//   });
// };
export const getCreators = (nftsListed, nftsAuction) => {
  // Combina los dos conjuntos de NFT en uno solo
  const allNFTs = [...nftsListed, ...nftsAuction];

  // Crea un objeto para rastrear los creadores y sus sumas
  const creatorMap = {};

  // Itera sobre todos los NFT
  allNFTs.forEach((nft) => {
    const creator = nft.owner;
    const price = Number(nft.price) || 0;

    // Si el creador ya existe en el mapa, suma el precio
    if (creatorMap[creator]) {
      creatorMap[creator] += price;
    } else {
      // Si el creador no existe en el mapa, agrega una nueva entrada
      creatorMap[creator] = price;
    }
  });

  // Convierte el mapa en un arreglo de objetos con el formato deseado
  const creators = Object.entries(creatorMap).map(([owner, sum]) => ({ owner, sum }));

  return creators;
};
