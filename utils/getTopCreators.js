export const getCreators = (nfts) => {
  const creators = nfts.reduce((creatorObject, nft) => {
    (creatorObject[nft.owner] = creatorObject[nft.owner] || []).push(nft);

    return creatorObject;
  }, {});

  return Object.entries(creators).map((creator) => {
    const owner = creator[0];
    const sum = creator[1].map((item) => Number(item.price)).reduce((prev, curr) => prev + curr, 0);

    return ({ owner, sum });
  });
};
