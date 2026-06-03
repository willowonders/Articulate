import { useState, useRef, useCallback } from 'react';

interface UseTimerReturn {
  time: number;
  isRunning: boolean;
  formatted: string;
  progress: number;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useTimer(maxSeconds: number = 120): UseTimerReturn {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setTime((prev) => {
        if (prev >= maxSeconds) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsRunning(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  }, [maxSeconds]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setTime(0);
  }, [stop]);

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const progress = time / maxSeconds;

  return { time, isRunning, formatted, progress, start, stop, reset };
}
