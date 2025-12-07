import { useEffect, useState } from 'react';
import { CharacterSkin } from '@/types/game';
import { Zap, Coins, ArrowUp, Shield } from 'lucide-react';

interface SkinPreviewProps {
  skin: CharacterSkin;
  colors: { body: string; accent: string };
  isSelected: boolean;
}

export function SkinPreview({ skin, colors, isSelected }: SkinPreviewProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [showAbility, setShowAbility] = useState(0);

  // Running animation
  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % 4);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Ability indicator rotation
  useEffect(() => {
    const abilities = [];
    if (skin.speed_bonus > 0) abilities.push('speed');
    if (skin.coin_multiplier > 1) abilities.push('coins');
    if (skin.jump_power_bonus > 0) abilities.push('jump');
    if (skin.shield_duration_bonus > 0) abilities.push('shield');
    
    if (abilities.length === 0) return;
    
    const interval = setInterval(() => {
      setShowAbility((prev) => (prev + 1) % abilities.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [skin]);

  // Calculate leg positions for running animation
  const getLegOffset = (legIndex: number) => {
    const phases = [
      [0, 2], // Frame 0: left back, right forward
      [1, 1], // Frame 1: both middle
      [2, 0], // Frame 2: left forward, right back
      [1, 1], // Frame 3: both middle
    ];
    return phases[frameIndex][legIndex];
  };

  const getActiveAbility = () => {
    const abilities = [];
    if (skin.speed_bonus > 0) abilities.push({ type: 'speed', value: skin.speed_bonus, icon: Zap, color: '#FBBF24' });
    if (skin.coin_multiplier > 1) abilities.push({ type: 'coins', value: skin.coin_multiplier, icon: Coins, color: '#FFD700' });
    if (skin.jump_power_bonus > 0) abilities.push({ type: 'jump', value: skin.jump_power_bonus, icon: ArrowUp, color: '#4ADE80' });
    if (skin.shield_duration_bonus > 0) abilities.push({ type: 'shield', value: skin.shield_duration_bonus, icon: Shield, color: '#60A5FA' });
    
    if (abilities.length === 0) return null;
    return abilities[showAbility % abilities.length];
  };

  const activeAbility = getActiveAbility();

  return (
    <div 
      className="relative w-10 h-12 sm:w-12 sm:h-14 flex-shrink-0"
      style={{
        filter: isSelected ? `drop-shadow(0 0 8px ${colors.body})` : undefined,
      }}
    >
      {/* Character body */}
      <div 
        className="absolute inset-0 rounded transition-transform"
        style={{
          backgroundColor: colors.body,
          transform: `translateY(${frameIndex % 2 === 0 ? -1 : 0}px)`,
        }}
      >
        {/* Head */}
        <div 
          className="absolute top-0 left-0.5 right-0.5 h-4 sm:h-5 rounded-t"
          style={{ backgroundColor: colors.body }}
        />
        
        {/* Eye */}
        <div 
          className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 w-2 sm:w-2.5 h-1.5 sm:h-2 rounded-sm"
          style={{ backgroundColor: colors.accent }}
        />
        
        {/* Left leg */}
        <div 
          className="absolute bottom-0 left-1 w-2 sm:w-2.5 rounded-b transition-all duration-100"
          style={{ 
            backgroundColor: colors.accent,
            height: `${8 + getLegOffset(0) * 2}px`,
            transform: `translateY(${getLegOffset(0)}px)`,
          }}
        />
        
        {/* Right leg */}
        <div 
          className="absolute bottom-0 right-1 w-2 sm:w-2.5 rounded-b transition-all duration-100"
          style={{ 
            backgroundColor: colors.accent,
            height: `${8 + getLegOffset(1) * 2}px`,
            transform: `translateY(${getLegOffset(1)}px)`,
          }}
        />
      </div>

      {/* Ability indicator */}
      {activeAbility && (
        <div 
          className="absolute -top-1.5 -right-1.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center animate-pulse"
          style={{ backgroundColor: `${activeAbility.color}30`, border: `1px solid ${activeAbility.color}` }}
        >
          <activeAbility.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" style={{ color: activeAbility.color }} />
        </div>
      )}

      {/* Speed lines when moving fast */}
      {skin.speed_bonus > 0 && (
        <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 flex flex-col gap-0.5">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i}
              className="h-0.5 bg-yellow-400/50 rounded animate-pulse"
              style={{ 
                width: `${6 + Math.random() * 4}px`,
                animationDelay: `${i * 100}ms`,
              }}
            />
          ))}
        </div>
      )}

      {/* Coin sparkle effect */}
      {skin.coin_multiplier > 1 && frameIndex === 0 && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] text-yellow-400 animate-bounce">
          ✨
        </div>
      )}

      {/* Shield glow effect */}
      {skin.shield_duration_bonus > 0 && (
        <div 
          className="absolute inset-0 rounded pointer-events-none animate-pulse"
          style={{ 
            boxShadow: `0 0 ${8 + (frameIndex % 2) * 4}px rgba(96, 165, 250, 0.3)`,
          }}
        />
      )}
    </div>
  );
}
