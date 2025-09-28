import { useState, useEffect, useRef } from 'react';

interface UseTimerProps {
  duration: number; // Total duration in seconds
  isActive?: boolean;
  onComplete?: () => void;
  onTick?: (timeLeft: number) => void;
}

interface UseTimerReturn {
  timeLeft: number;
  isActive: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  restart: () => void;
}

export function useTimer({
  duration,
  isActive = false,
  onComplete,
  onTick,
}: UseTimerProps): UseTimerReturn {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [active, setActive] = useState(isActive);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (active && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          onTick?.(newTime);
          
          if (newTime <= 0) {
            setActive(false);
            onComplete?.();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active, timeLeft, onComplete, onTick]);

  const start = () => setActive(true);
  const pause = () => setActive(false);
  const reset = () => {
    setActive(false);
    setTimeLeft(duration);
  };
  const restart = () => {
    setTimeLeft(duration);
    setActive(true);
  };

  return {
    timeLeft,
    isActive: active,
    start,
    pause,
    reset,
    restart,
  };
}