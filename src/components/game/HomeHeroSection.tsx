import { useState, useEffect } from 'react';
import { PixelCharacter, AnimatedSkinCycler, SKIN_COLORS } from './PixelCharacter';
import gameLogo from '@/assets/game-logo.png';

interface HomeHeroSectionProps {
  onTap?: () => void;
}

export function HomeHeroSection({ onTap }: HomeHeroSectionProps) {
  const [heroAnimation, setHeroAnimation] = useState<'running' | 'jumping' | 'celebrating'>('running');
  const [showBoss, setShowBoss] = useState(false);

  // Cycle through animations
  useEffect(() => {
    const animations: ('running' | 'jumping' | 'celebrating')[] = ['running', 'running', 'jumping', 'running', 'celebrating'];
    let index = 0;

    const animInterval = setInterval(() => {
      index = (index + 1) % animations.length;
      setHeroAnimation(animations[index]);
    }, 2500);

    return () => clearInterval(animInterval);
  }, []);

  // Show boss silhouette periodically
  useEffect(() => {
    const bossInterval = setInterval(() => {
      setShowBoss(true);
      setTimeout(() => setShowBoss(false), 1500);
    }, 8000);

    return () => clearInterval(bossInterval);
  }, []);

  const handleTap = () => {
    setHeroAnimation('jumping');
    setTimeout(() => setHeroAnimation('running'), 500);
    onTap?.();
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Logo */}
      <div className="relative z-20 mb-2">
        <img
          src={gameLogo}
          alt="Pixel Runner"
          className="w-48 md:w-64 h-auto drop-shadow-lg"
          style={{
            filter: 'drop-shadow(0 0 20px hsl(var(--primary) / 0.4))',
          }}
        />
      </div>

      {/* Hero Character Stage */}
      <div 
        className="relative w-full max-w-xs h-36 flex items-end justify-center cursor-pointer"
        onClick={handleTap}
      >
        {/* Circular glow/spotlight */}
        <div 
          className="absolute bottom-4 w-32 h-32 rounded-full animate-pulse-slow"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)',
            filter: 'blur(10px)',
          }}
        />

        {/* Background runners - left */}
        <div className="absolute left-0 bottom-8 opacity-40 scale-50">
          <PixelCharacter skinId="cat" animation="running" size={48} />
        </div>
        <div className="absolute left-8 bottom-12 opacity-25 scale-40">
          <PixelCharacter skinId="robot" animation="running" size={40} />
        </div>

        {/* Background runners - right */}
        <div className="absolute right-0 bottom-8 opacity-40 scale-50">
          <PixelCharacter skinId="ninja" animation="running" size={48} />
        </div>
        <div className="absolute right-8 bottom-12 opacity-25 scale-40">
          <PixelCharacter skinId="zombie" animation="running" size={40} />
        </div>

        {/* Main hero character */}
        <div className="relative z-10 mb-2">
          <AnimatedSkinCycler
            animation={heroAnimation}
            size={80}
            interval={3000}
            showGlow
          />
        </div>

        {/* Speed lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute h-0.5 bg-gradient-to-r from-primary/50 to-transparent animate-speed-line"
              style={{
                left: '-100%',
                top: `${30 + i * 12}%`,
                width: '60%',
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1.5s',
              }}
            />
          ))}
        </div>

        {/* Boss silhouette (appears periodically) */}
        {showBoss && (
          <div 
            className="absolute right-0 bottom-4 animate-slide-in-boss"
            style={{ opacity: 0.6 }}
          >
            <BossSilhouette />
          </div>
        )}

        {/* Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-primary/60 animate-float-particle"
              style={{
                left: `${10 + i * 12}%`,
                bottom: '20%',
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${2 + Math.random()}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Tap hint */}
      <p className="text-[10px] text-muted-foreground/60 font-pixel animate-pulse mt-1">
        TAP TO JUMP
      </p>

      {/* Ground line */}
      <div className="w-full max-w-xs h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {/* Animation styles */}
      <style>{`
        @keyframes speed-line {
          0% { transform: translateX(0); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateX(400%); opacity: 0; }
        }
        .animate-speed-line {
          animation: speed-line 1.5s linear infinite;
        }
        
        @keyframes slide-in-boss {
          0% { transform: translateX(100%); opacity: 0; }
          20% { transform: translateX(0); opacity: 0.6; }
          80% { transform: translateX(0); opacity: 0.6; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        .animate-slide-in-boss {
          animation: slide-in-boss 1.5s ease-in-out forwards;
        }
        
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 1; }
        }
        .animate-float-particle {
          animation: float-particle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Simple boss silhouette component
function BossSilhouette() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="text-red-500">
      {/* Boss body - spiky demon shape */}
      <path 
        d="M24 4 L28 12 L36 8 L32 16 L44 20 L32 24 L36 32 L28 28 L24 44 L20 28 L12 32 L16 24 L4 20 L16 16 L12 8 L20 12 Z"
        fill="currentColor"
        opacity="0.8"
      />
      {/* Glowing eyes */}
      <circle cx="18" cy="20" r="3" fill="#FFD700" opacity="0.9" />
      <circle cx="30" cy="20" r="3" fill="#FFD700" opacity="0.9" />
    </svg>
  );
}
