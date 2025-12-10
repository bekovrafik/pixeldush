import { useState, useCallback, useRef } from 'react';
import { hapticsManager } from '@/lib/hapticsManager';

export interface ScreenFlash {
  color: string;
  intensity: number;
  duration: number;
  startTime: number;
}

export interface PowerUpExplosion {
  x: number;
  y: number;
  color: string;
  particles: Array<{
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    size: number;
    alpha: number;
    color: string;
  }>;
  startTime: number;
}

export function usePowerUpEffects() {
  const [screenFlash, setScreenFlash] = useState<ScreenFlash | null>(null);
  const [explosions, setExplosions] = useState<PowerUpExplosion[]>([]);
  const animationRef = useRef<number | null>(null);

  const triggerPowerUpCollection = useCallback((x: number, y: number, type: 'shield' | 'magnet' | 'multiplier' | 'weapon' | 'coin') => {
    const colors: Record<string, { main: string; particles: string[]; flash: boolean; particleCount: number }> = {
      shield: { main: '#00BFFF', particles: ['#00BFFF', '#87CEEB', '#FFFFFF', '#00FFFF'], flash: true, particleCount: 25 },
      magnet: { main: '#FF00FF', particles: ['#FF00FF', '#CC00CC', '#FF66FF', '#FFFFFF'], flash: true, particleCount: 25 },
      multiplier: { main: '#FFD700', particles: ['#FFD700', '#FFA500', '#FFFF00', '#FFFFFF'], flash: true, particleCount: 25 },
      weapon: { main: '#FF4500', particles: ['#FF4500', '#FF6600', '#FF8800', '#FFCC00'], flash: true, particleCount: 25 },
      coin: { main: '#FFD700', particles: ['#FFD700', '#FFC700', '#FFFF00', '#FFFFFF', '#FFA500'], flash: false, particleCount: 12 },
    };
    
    const colorConfig = colors[type];
    
    // Trigger screen flash (not for coins - too frequent)
    if (colorConfig.flash) {
      setScreenFlash({
        color: colorConfig.main,
        intensity: 0.4,
        duration: 150,
        startTime: Date.now(),
      });
    }
    
    // Create explosion particles - coins get smaller, faster burst
    const particleCount = colorConfig.particleCount;
    const particles = [];
    const isCoin = type === 'coin';
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = isCoin ? 2 + Math.random() * 3 : 3 + Math.random() * 5;
      particles.push({
        x: x,
        y: y,
        velocityX: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
        velocityY: Math.sin(angle) * speed + (Math.random() - 0.5) * 2 - (isCoin ? 2 : 0), // coins burst upward
        size: isCoin ? 2 + Math.random() * 3 : 4 + Math.random() * 6,
        alpha: 1,
        color: colorConfig.particles[Math.floor(Math.random() * colorConfig.particles.length)],
      });
    }
    
    setExplosions(prev => [...prev, {
      x,
      y,
      color: colorConfig.main,
      particles,
      startTime: Date.now(),
    }]);
    
    // Trigger haptic feedback (light for coins, stronger for power-ups)
    if (isCoin) {
      hapticsManager.lightImpact();
    } else {
      hapticsManager.successNotification();
    }
    
    // Auto-clear flash
    if (colorConfig.flash) {
      setTimeout(() => setScreenFlash(null), 200);
    }
  }, []);

  const updateExplosions = useCallback(() => {
    setExplosions(prev => {
      const now = Date.now();
      return prev
        .map(explosion => ({
          ...explosion,
          particles: explosion.particles
            .map(p => ({
              ...p,
              x: p.x + p.velocityX,
              y: p.y + p.velocityY,
              velocityY: p.velocityY + 0.2, // gravity
              alpha: p.alpha - 0.03,
              size: p.size * 0.98,
            }))
            .filter(p => p.alpha > 0),
        }))
        .filter(explosion => explosion.particles.length > 0 && now - explosion.startTime < 2000);
    });
  }, []);

  const drawPowerUpEffects = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    // Draw screen flash
    if (screenFlash) {
      const elapsed = Date.now() - screenFlash.startTime;
      const progress = elapsed / screenFlash.duration;
      const intensity = screenFlash.intensity * (1 - progress);
      
      if (intensity > 0) {
        ctx.save();
        ctx.fillStyle = screenFlash.color;
        ctx.globalAlpha = intensity;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
      }
    }
    
    // Draw explosions
    explosions.forEach(explosion => {
      ctx.save();
      explosion.particles.forEach(particle => {
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        
        // Star-shaped particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Sparkle effect
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.globalAlpha = particle.alpha * 0.5;
        ctx.beginPath();
        ctx.moveTo(particle.x - particle.size * 1.5, particle.y);
        ctx.lineTo(particle.x + particle.size * 1.5, particle.y);
        ctx.moveTo(particle.x, particle.y - particle.size * 1.5);
        ctx.lineTo(particle.x, particle.y + particle.size * 1.5);
        ctx.stroke();
      });
      ctx.restore();
    });
  }, [screenFlash, explosions]);

  return {
    screenFlash,
    explosions,
    triggerPowerUpCollection,
    updateExplosions,
    drawPowerUpEffects,
  };
}
