// src/hooks/useCountdown.js
import { useState, useEffect } from 'react';

export const useCountdown = (initialSeconds = 900) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev <= 1 ? 0 : prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const reset = (seconds = initialSeconds) => {
    setTimeLeft(seconds);
  };

  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    timeLeft,
    formatTime: formatTime(),
    reset
  };
};