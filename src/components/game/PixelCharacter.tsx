import { useState, useEffect } from 'react';

export interface PixelCharacterColors {
  body: string;
  accent: string;
}

export const SKIN_COLORS: Record<string, PixelCharacterColors> = {
  default: { body: '#4ECDC4', accent: '#2C3E50' },
  cat: { body: '#FF9F43', accent: '#2C3E50' },
  robot: { body: '#A8A8A8', accent: '#3498DB' },
  ninja: { body: '#2C3E50', accent: '#E74C3C' },
  zombie: { body: '#7CB342', accent: '#558B2F' },
  astronaut: { body: '#ECF0F1', accent: '#3498DB' },
  diamond: { body: '#00BFFF', accent: '#87CEEB' },
  phoenix: { body: '#FF4500', accent: '#FFD700' },
  shadow_king: { body: '#4B0082', accent: '#800080' },
  frost_queen: { body: '#ADD8E6', accent: '#87CEEB' },
  thunder_lord: { body: '#FFD700', accent: '#87CEEB' },
  cosmic_guardian: { body: '#9400D3', accent: '#FF1493' },
};

type AnimationType = 'idle' | 'running' | 'jumping' | 'celebrating' | 'fighting';

interface PixelCharacterProps {
  skinId?: string;
  colors?: PixelCharacterColors;
  animation?: AnimationType;
  size?: number;
  showGlow?: boolean;
  showTrail?: boolean;
  className?: string;
}

export function PixelCharacter({
  skinId = 'default',
  colors,
  animation = 'idle',
  size = 64,
  showGlow = false,
  showTrail = false,
  className = '',
}: PixelCharacterProps) {
  const [frame, setFrame] = useState(0);
  const [jumpOffset, setJumpOffset] = useState(0);

  const skinColors = colors || SKIN_COLORS[skinId] || SKIN_COLORS.default;

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % 8);
    }, animation === 'running' ? 100 : animation === 'celebrating' ? 150 : 200);

    return () => clearInterval(interval);
  }, [animation]);

  useEffect(() => {
    if (animation === 'jumping') {
      const jumpInterval = setInterval(() => {
        setJumpOffset((prev) => {
          const newOffset = prev + 1;
          return newOffset > 20 ? 0 : newOffset;
        });
      }, 50);
      return () => clearInterval(jumpInterval);
    } else {
      setJumpOffset(0);
    }
  }, [animation]);

  // Calculate leg positions for running animation
  const getLegOffset = (isLeft: boolean) => {
    if (animation !== 'running') return 0;
    const offset = Math.sin((frame + (isLeft ? 0 : 4)) * 0.8) * 4;
    return offset;
  };

  // Calculate jump offset for animation
  const getJumpY = () => {
    if (animation !== 'jumping') return 0;
    // Parabolic jump: goes up then down
    const progress = jumpOffset / 20;
    return -Math.sin(progress * Math.PI) * 20;
  };

  // Calculate bounce for idle/celebrating
  const getBounce = () => {
    if (animation === 'idle') {
      return Math.sin(frame * 0.5) * 2;
    }
    if (animation === 'celebrating') {
      return Math.abs(Math.sin(frame * 0.8)) * 8;
    }
    return 0;
  };

  const scale = size / 64;
  const y = getJumpY() + getBounce();
  
  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ 
        width: size, 
        height: size * 1.2,
        transform: `translateY(${y * scale}px)`,
        transition: animation === 'idle' ? 'transform 0.2s ease-out' : 'none',
      }}
    >
      {/* Glow effect */}
      {showGlow && (
        <div 
          className="absolute rounded-full animate-pulse"
          style={{
            width: size * 1.5,
            height: size * 1.5,
            background: `radial-gradient(circle, ${skinColors.body}40 0%, transparent 70%)`,
            filter: 'blur(8px)',
          }}
        />
      )}

      {/* Speed trail effect */}
      {showTrail && animation === 'running' && (
        <>
          <div
            className="absolute opacity-30"
            style={{
              left: -size * 0.3,
              transform: 'scaleX(0.8)',
            }}
          >
            <CharacterBody colors={skinColors} size={size} scale={scale} frame={frame} getLegOffset={getLegOffset} />
          </div>
          <div
            className="absolute opacity-15"
            style={{
              left: -size * 0.5,
              transform: 'scaleX(0.6)',
            }}
          >
            <CharacterBody colors={skinColors} size={size} scale={scale} frame={frame} getLegOffset={getLegOffset} />
          </div>
        </>
      )}

      {/* Main character */}
      <div className="relative z-10">
        <CharacterBody 
          colors={skinColors} 
          size={size} 
          scale={scale} 
          frame={frame} 
          getLegOffset={getLegOffset}
          isCelebrating={animation === 'celebrating'}
          isFighting={animation === 'fighting'}
        />
      </div>

      {/* Shadow */}
      <div 
        className="absolute rounded-full"
        style={{
          bottom: -4 * scale,
          width: size * 0.6,
          height: size * 0.15,
          background: 'rgba(0,0,0,0.3)',
          filter: 'blur(2px)',
          transform: `scaleX(${1 - Math.abs(y) * 0.01})`,
        }}
      />
    </div>
  );
}

interface CharacterBodyProps {
  colors: PixelCharacterColors;
  size: number;
  scale: number;
  frame: number;
  getLegOffset: (isLeft: boolean) => number;
  isCelebrating?: boolean;
  isFighting?: boolean;
}

function CharacterBody({ colors, size, scale, frame, getLegOffset, isCelebrating, isFighting }: CharacterBodyProps) {
  return (
    <svg 
      width={size} 
      height={size * 1.1} 
      viewBox="0 0 32 36" 
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Body */}
      <rect x="8" y="10" width="16" height="14" fill={colors.body} />
      
      {/* Head */}
      <rect x="6" y="2" width="20" height="10" fill={colors.body} rx="2" />
      
      {/* Eyes */}
      <rect x="18" y="4" width="4" height="4" fill="white" />
      <rect x="20" y="4" width="2" height="4" fill={colors.accent} />
      
      {/* Left leg */}
      <rect 
        x="10" 
        y="24" 
        width="4" 
        height="8" 
        fill={colors.accent}
        transform={`translate(0, ${getLegOffset(true)})`}
      />
      
      {/* Right leg */}
      <rect 
        x="18" 
        y="24" 
        width="4" 
        height="8" 
        fill={colors.accent}
        transform={`translate(0, ${getLegOffset(false)})`}
      />

      {/* Arms for celebrating */}
      {isCelebrating && (
        <>
          <rect 
            x="2" 
            y="12" 
            width="6" 
            height="4" 
            fill={colors.body}
            transform={`rotate(${-45 + Math.sin(frame) * 20}, 5, 14)`}
          />
          <rect 
            x="24" 
            y="12" 
            width="6" 
            height="4" 
            fill={colors.body}
            transform={`rotate(${45 - Math.sin(frame) * 20}, 27, 14)`}
          />
        </>
      )}

      {/* Fighting punch effect */}
      {isFighting && (
        <>
          <rect 
            x="24" 
            y="14" 
            width="8" 
            height="4" 
            fill={colors.body}
          />
          {/* Impact lines */}
          <line x1="30" y1="12" x2="34" y2="10" stroke={colors.accent} strokeWidth="1" opacity={frame % 2 ? 1 : 0.5} />
          <line x1="32" y1="16" x2="36" y2="16" stroke={colors.accent} strokeWidth="1" opacity={frame % 2 ? 0.5 : 1} />
          <line x1="30" y1="20" x2="34" y2="22" stroke={colors.accent} strokeWidth="1" opacity={frame % 2 ? 1 : 0.5} />
        </>
      )}
    </svg>
  );
}

// Animated character that cycles through skins
export function AnimatedSkinCycler({
  skins = Object.keys(SKIN_COLORS).slice(0, 6),
  animation = 'running',
  size = 64,
  interval = 2000,
  showGlow = true,
}: {
  skins?: string[];
  animation?: AnimationType;
  size?: number;
  interval?: number;
  showGlow?: boolean;
}) {
  const [currentSkinIndex, setCurrentSkinIndex] = useState(0);

  useEffect(() => {
    const skinInterval = setInterval(() => {
      setCurrentSkinIndex((prev) => (prev + 1) % skins.length);
    }, interval);

    return () => clearInterval(skinInterval);
  }, [skins.length, interval]);

  return (
    <div className="relative">
      <PixelCharacter
        skinId={skins[currentSkinIndex]}
        animation={animation}
        size={size}
        showGlow={showGlow}
        showTrail={animation === 'running'}
      />
    </div>
  );
}
