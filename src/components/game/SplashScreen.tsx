import { useState, useEffect } from 'react';
import gameLogo from '@/assets/game-logo.png';
import { PixelCharacter } from './PixelCharacter';

interface SplashScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

export function SplashScreen({ onComplete, minDuration = 2500 }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / minDuration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(interval);
        setFadeOut(true);
        setTimeout(onComplete, 500);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [minDuration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/40 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Radial glow behind logo */}
      <div className="absolute w-[500px] h-[300px] bg-primary/20 rounded-full blur-[100px] animate-pulse-slow" />

      {/* Logo with animations */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Main logo image */}
        <div className="relative animate-scale-in">
          <img
            src={gameLogo}
            alt="Pixel Runner"
            className="w-[280px] md:w-[400px] h-auto drop-shadow-2xl"
            style={{
              filter: 'drop-shadow(0 0 30px hsl(var(--primary) / 0.5))',
            }}
          />
          
          {/* Shine effect */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shine"
          />
        </div>

        {/* Animated character running */}
        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-24 h-24 rounded-full bg-primary/20 blur-xl animate-pulse"
            />
          </div>
          <PixelCharacter 
            animation="running" 
            size={72} 
            showGlow 
            showTrail
          />
        </div>

        {/* Loading bar */}
        <div className="mt-6 w-48 h-2 bg-muted/50 rounded-full overflow-hidden border border-border/30">
          <div
            className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full transition-all duration-100 relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/30 animate-pulse" />
          </div>
        </div>

        {/* Loading text */}
        <p className="mt-4 font-pixel text-xs text-muted-foreground animate-pulse">
          {progress < 30 && 'Loading assets...'}
          {progress >= 30 && progress < 60 && 'Preparing game...'}
          {progress >= 60 && progress < 90 && 'Almost ready...'}
          {progress >= 90 && 'Get ready!'}
        </p>

        {/* Version */}
        <p className="mt-6 text-[10px] text-muted-foreground/50">v1.0.0</p>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/10 to-transparent" />

      {/* Inline styles for shine animation */}
      <style>{`
        @keyframes shine {
          0% { transform: translateX(-200%) skewX(-12deg); }
          50%, 100% { transform: translateX(200%) skewX(-12deg); }
        }
        .animate-shine {
          animation: shine 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
