import { useState, useEffect } from 'react';
import { PixelCharacter, SKIN_COLORS } from './PixelCharacter';

interface AnimatedGameLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showCharacter?: boolean;
  animate?: boolean;
  className?: string;
}

export function AnimatedGameLogo({ 
  size = 'md', 
  showCharacter = true, 
  animate = true,
  className = '' 
}: AnimatedGameLogoProps) {
  const [glowIntensity, setGlowIntensity] = useState(0.5);
  const [characterAnim, setCharacterAnim] = useState<'running' | 'jumping'>('running');

  useEffect(() => {
    if (!animate) return;

    // Pulsing glow effect
    const glowInterval = setInterval(() => {
      setGlowIntensity(0.4 + Math.sin(Date.now() / 500) * 0.3);
    }, 50);

    // Character animation cycling
    const animInterval = setInterval(() => {
      setCharacterAnim((prev) => (prev === 'running' ? 'jumping' : 'running'));
    }, 3000);

    return () => {
      clearInterval(glowInterval);
      clearInterval(animInterval);
    };
  }, [animate]);

  const sizeConfig = {
    sm: { width: 180, fontSize: 20, charSize: 28, spacing: 2 },
    md: { width: 260, fontSize: 28, charSize: 40, spacing: 3 },
    lg: { width: 360, fontSize: 40, charSize: 56, spacing: 4 },
  };

  const config = sizeConfig[size];

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* Glow backdrop */}
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: config.width * 1.2,
          height: config.width * 0.6,
          background: `radial-gradient(ellipse, hsl(var(--primary) / ${glowIntensity}) 0%, transparent 70%)`,
        }}
      />

      {/* Logo container */}
      <div className="relative flex items-center gap-1">
        {/* PIXEL text */}
        <div className="relative">
          <svg
            width={config.width * 0.45}
            height={config.fontSize * 1.5}
            viewBox="0 0 80 28"
            style={{ imageRendering: 'pixelated' }}
          >
            {/* P */}
            <rect x="0" y="0" width="4" height="24" fill="hsl(var(--primary))" />
            <rect x="4" y="0" width="8" height="4" fill="hsl(var(--primary))" />
            <rect x="12" y="0" width="4" height="12" fill="hsl(var(--primary))" />
            <rect x="4" y="8" width="8" height="4" fill="hsl(var(--primary))" />
            
            {/* I */}
            <rect x="20" y="0" width="4" height="24" fill="hsl(var(--primary))" />
            
            {/* X */}
            <rect x="28" y="0" width="4" height="4" fill="hsl(var(--primary))" />
            <rect x="40" y="0" width="4" height="4" fill="hsl(var(--primary))" />
            <rect x="30" y="4" width="4" height="4" fill="hsl(var(--primary))" />
            <rect x="38" y="4" width="4" height="4" fill="hsl(var(--primary))" />
            <rect x="32" y="8" width="8" height="8" fill="hsl(var(--primary))" />
            <rect x="30" y="16" width="4" height="4" fill="hsl(var(--primary))" />
            <rect x="38" y="16" width="4" height="4" fill="hsl(var(--primary))" />
            <rect x="28" y="20" width="4" height="4" fill="hsl(var(--primary))" />
            <rect x="40" y="20" width="4" height="4" fill="hsl(var(--primary))" />
            
            {/* E */}
            <rect x="48" y="0" width="4" height="24" fill="hsl(var(--primary))" />
            <rect x="52" y="0" width="12" height="4" fill="hsl(var(--primary))" />
            <rect x="52" y="10" width="8" height="4" fill="hsl(var(--primary))" />
            <rect x="52" y="20" width="12" height="4" fill="hsl(var(--primary))" />
            
            {/* L */}
            <rect x="68" y="0" width="4" height="24" fill="hsl(var(--primary))" />
            <rect x="72" y="20" width="8" height="4" fill="hsl(var(--primary))" />
          </svg>
          
          {/* Shine effect */}
          {animate && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-logo-shine" />
            </div>
          )}
        </div>

        {/* Character in the middle */}
        {showCharacter && (
          <div className="relative -mx-1 z-10">
            <PixelCharacter
              animation={characterAnim}
              size={config.charSize}
              showGlow
            />
          </div>
        )}

        {/* RUNNER text */}
        <div className="relative">
          <svg
            width={config.width * 0.55}
            height={config.fontSize * 1.5}
            viewBox="0 0 100 28"
            style={{ imageRendering: 'pixelated' }}
          >
            {/* R */}
            <rect x="0" y="0" width="4" height="24" fill="hsl(var(--accent))" />
            <rect x="4" y="0" width="8" height="4" fill="hsl(var(--accent))" />
            <rect x="12" y="0" width="4" height="12" fill="hsl(var(--accent))" />
            <rect x="4" y="8" width="8" height="4" fill="hsl(var(--accent))" />
            <rect x="8" y="12" width="4" height="4" fill="hsl(var(--accent))" />
            <rect x="12" y="16" width="4" height="8" fill="hsl(var(--accent))" />
            
            {/* U */}
            <rect x="20" y="0" width="4" height="20" fill="hsl(var(--accent))" />
            <rect x="24" y="20" width="8" height="4" fill="hsl(var(--accent))" />
            <rect x="32" y="0" width="4" height="20" fill="hsl(var(--accent))" />
            
            {/* N */}
            <rect x="40" y="0" width="4" height="24" fill="hsl(var(--accent))" />
            <rect x="44" y="4" width="4" height="4" fill="hsl(var(--accent))" />
            <rect x="48" y="8" width="4" height="4" fill="hsl(var(--accent))" />
            <rect x="52" y="12" width="4" height="4" fill="hsl(var(--accent))" />
            <rect x="56" y="0" width="4" height="24" fill="hsl(var(--accent))" />
            
            {/* N */}
            <rect x="64" y="0" width="4" height="24" fill="hsl(var(--accent))" />
            <rect x="68" y="4" width="4" height="4" fill="hsl(var(--accent))" />
            <rect x="72" y="8" width="4" height="4" fill="hsl(var(--accent))" />
            <rect x="76" y="12" width="4" height="4" fill="hsl(var(--accent))" />
            <rect x="80" y="0" width="4" height="24" fill="hsl(var(--accent))" />
            
            {/* ER */}
            <rect x="88" y="0" width="4" height="24" fill="hsl(var(--accent))" />
            <rect x="92" y="0" width="8" height="4" fill="hsl(var(--accent))" />
            <rect x="92" y="10" width="6" height="4" fill="hsl(var(--accent))" />
            <rect x="92" y="20" width="8" height="4" fill="hsl(var(--accent))" />
          </svg>
        </div>
      </div>

      {/* Tagline */}
      <p 
        className="mt-2 font-pixel text-muted-foreground tracking-widest"
        style={{ fontSize: config.fontSize * 0.35 }}
      >
        RUN • JUMP • SURVIVE
      </p>

      <style>{`
        @keyframes logo-shine {
          0% { transform: translateX(-200%) skewX(-12deg); }
          50%, 100% { transform: translateX(300%) skewX(-12deg); }
        }
        .animate-logo-shine {
          animation: logo-shine 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
