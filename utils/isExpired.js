export const isExpired = (timestamp) => {
    const endAt = new Date(timestamp * 1000).getTime()
    const currentTime = new Date().getTime();
    return currentTime >= endAt;
  };
  