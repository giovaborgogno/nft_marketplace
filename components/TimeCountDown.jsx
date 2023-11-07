import React from 'react'
const {useState, useEffect} = React;

const TimeCountDown = ({date}) => {
  const [countdownDate, setCountdownDate] = useState((new Date(date * 1000)).getTime());
  const [distanceToDate, setDistanceToDate] = useState(0)
  const [state, setState] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(()=>{
    setCountdownDate((new Date(date * 1000)).getTime())
  },[date])

  useEffect(() => {
    setInterval(() => setNewTime(), 1000);
  }, []);

  const setNewTime = () => {
    if (countdownDate) {
      const currentTime = new Date().getTime();

      const distanceToDate = countdownDate - currentTime;
      setDistanceToDate(distanceToDate)

      let days = Math.floor(distanceToDate / (1000 * 60 * 60 * 24));
      let hours = Math.floor(
        (distanceToDate % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      let minutes = Math.floor(
        (distanceToDate % (1000 * 60 * 60)) / (1000 * 60),
      );
      let seconds = Math.floor((distanceToDate % (1000 * 60)) / 1000);

      const numbersToAddZeroTo = [1, 2, 3, 4, 5, 6, 7, 8, 9];

      days = `${days}`;
      if (numbersToAddZeroTo.includes(hours)) {
        hours = `0${hours}`;
      } else if (numbersToAddZeroTo.includes(minutes)) {
        minutes = `0${minutes}`;
      } else if (numbersToAddZeroTo.includes(seconds)) {
        seconds = `0${seconds}`;
      }

      setState({ days: days, hours: hours, minutes, seconds });
    }
  };

  return (
    <div>
        {distanceToDate <= 0 ? 
        <>Auction Expired</>
        :
        <div className='flex'>
        <div className='mr-2'>
          <div className='time'>{state.days || '00'}</div>
          <small className="time-text">Días</small>
        </div>
        <div className='mr-2'>
          <div className='time'>{state.hours || '00'}</div>
          <small className="time-text">Horas</small>
        </div>
        <div className='mr-2'>
          <div className='time'>{state.minutes || '00'}</div>
          <small className="time-text">Min</small>
        </div>
        <div className='mr-2'>
          <div className='time'>{state.seconds || '00'}</div>
          <small className="time-text">Seg</small>
        </div>
      </div>
        }
    </div>
  );
};

export default TimeCountDown;