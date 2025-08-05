"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseTimerOptions {
  initialTime?: number; // in seconds
  step?: number; // countdown step in seconds
  autoStart?: boolean;
  onTick?: (timeLeft: number) => void;
  onComplete?: () => void;
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
}

export interface UseTimerReturn {
  time: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  addTime: (seconds: number) => void;
  setTime: (seconds: number) => void;
  formatTime: (time?: number) => string;
}

export function useTimer({
  initialTime = 0,
  step = 1,
  autoStart = false,
  onTick,
  onComplete,
  onStart,
  onPause,
  onReset,
}: UseTimerOptions = {}): UseTimerReturn {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialTimeRef = useRef(initialTime);

  // Update initial time ref when initialTime changes
  useEffect(() => {
    initialTimeRef.current = initialTime;
  }, [initialTime]);

  const start = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
      onStart?.();
    }
  }, [isRunning, onStart]);

  const pause = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      onPause?.();
    }
  }, [isRunning, onPause]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTime(initialTimeRef.current);
    onReset?.();
  }, [onReset]);

  const addTime = useCallback((seconds: number) => {
    setTime((prevTime) => Math.max(0, prevTime + seconds));
  }, []);

  const setTimerTime = useCallback((seconds: number) => {
    setTime(Math.max(0, seconds));
  }, []);

  const formatTime = useCallback((timeValue?: number) => {
    const timeToFormat = timeValue ?? time;
    const hours = Math.floor(timeToFormat / 3600);
    const minutes = Math.floor((timeToFormat % 3600) / 60);
    const seconds = timeToFormat % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }, [time]);

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          const newTime = Math.max(0, prevTime - step);
          
          // Call onTick callback
          onTick?.(newTime);
          
          // Check if timer completed
          if (newTime === 0) {
            setIsRunning(false);
            onComplete?.();
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
      }
    };
  }, [isRunning, step, onTick, onComplete]);

  // Auto-start effect
  useEffect(() => {
    if (autoStart && time > 0 && !isRunning) {
      start();
    }
  }, [autoStart, time, isRunning, start]);

  return {
    time,
    isRunning,
    start,
    pause,
    reset,
    addTime,
    setTime: setTimerTime,
    formatTime,
  };
}

// Hook for stopwatch functionality (counts up)
export function useStopwatch({
  autoStart = false,
  onTick,
  onStart,
  onPause,
  onReset,
}: Omit<UseTimerOptions, 'initialTime' | 'onComplete'> = {}) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
      onStart?.();
    }
  }, [isRunning, onStart]);

  const pause = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      onPause?.();
    }
  }, [isRunning, onPause]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTime(0);
    onReset?.();
  }, [onReset]);

  const formatTime = useCallback((timeValue?: number) => {
    const timeToFormat = timeValue ?? time;
    const hours = Math.floor(timeToFormat / 3600);
    const minutes = Math.floor((timeToFormat % 3600) / 60);
    const seconds = timeToFormat % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }, [time]);

  // Stopwatch effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime + 1;
          onTick?.(newTime);
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
      }
    };
  }, [isRunning, onTick]);

  return {
    time,
    isRunning,
    start,
    pause,
    reset,
    formatTime,
  };
}
