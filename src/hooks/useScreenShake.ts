import { useState, useCallback, useRef } from 'react';

interface ShakeConfig {
  intensity: number;
  duration: number;
}

export function useScreenShake() {
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });
  const shakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shakeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const shake = useCallback(({ intensity, duration }: ShakeConfig) => {
    // Clear any existing shake
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    if (shakeIntervalRef.current) clearInterval(shakeIntervalRef.current);

    const startTime = Date.now();
    
    shakeIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        if (shakeIntervalRef.current) clearInterval(shakeIntervalRef.current);
        setShakeOffset({ x: 0, y: 0 });
        return;
      }

      // Decay intensity over time
      const currentIntensity = intensity * (1 - progress);
      
      setShakeOffset({
        x: (Math.random() - 0.5) * 2 * currentIntensity,
        y: (Math.random() - 0.5) * 2 * currentIntensity,
      });
    }, 16); // ~60fps

    shakeTimeoutRef.current = setTimeout(() => {
      if (shakeIntervalRef.current) clearInterval(shakeIntervalRef.current);
      setShakeOffset({ x: 0, y: 0 });
    }, duration);
  }, []);

  const shakeOnDamage = useCallback(() => {
    shake({ intensity: 8, duration: 200 });
  }, [shake]);

  const shakeOnBossDefeat = useCallback(() => {
    shake({ intensity: 15, duration: 500 });
  }, [shake]);

  const shakeOnHit = useCallback(() => {
    shake({ intensity: 4, duration: 100 });
  }, [shake]);

  return {
    shakeOffset,
    shake,
    shakeOnDamage,
    shakeOnBossDefeat,
    shakeOnHit,
  };
}
