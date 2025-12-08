import { useCallback } from 'react';
import { hapticsManager } from '@/lib/hapticsManager';

interface MobileControlsProps {
  onJump: () => void;
  onAttack: () => void;
  showAttackButton: boolean;
  doubleJumpAvailable: boolean;
  hasDoubleJumped: boolean;
  activeWeapon: string | null;
  weaponAmmo: number;
}

export function MobileControls({ 
  onJump, 
  onAttack, 
  showAttackButton, 
  doubleJumpAvailable,
  hasDoubleJumped,
  activeWeapon, 
  weaponAmmo 
}: MobileControlsProps) {
  const handleJumpStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    hapticsManager.lightImpact();
    onJump();
  }, [onJump]);

  const handleAttackStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    hapticsManager.mediumImpact();
    onAttack();
  }, [onAttack]);

  const getWeaponEmoji = () => {
    switch (activeWeapon) {
      case 'fireball': return '🔥';
      case 'laser': return '⚡';
      case 'bomb': return '💣';
      default: return '💫';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-50 p-4 pb-safe">
      <div className="max-w-4xl mx-auto flex justify-between items-end">
        {/* Jump Button - Left side */}
        <button
          onTouchStart={handleJumpStart}
          onMouseDown={handleJumpStart}
          className="pointer-events-auto relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-primary/80 active:bg-primary active:scale-95 transition-all shadow-lg border-4 border-primary-foreground/30 flex flex-col items-center justify-center touch-none select-none"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <span className="font-pixel text-primary-foreground text-sm sm:text-base">JUMP</span>
          {/* Double jump indicator */}
          {doubleJumpAvailable && !hasDoubleJumped && (
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent flex items-center justify-center animate-pulse shadow-lg">
              <span className="text-sm font-bold text-accent-foreground">2x</span>
            </div>
          )}
          {/* Visual feedback ring */}
          <div className="absolute inset-0 rounded-full border-2 border-primary-foreground/20 animate-ping" style={{ animationDuration: '2s' }} />
        </button>

        {/* Attack Button - Right side (only visible during boss fights) */}
        {showAttackButton && (
          <button
            onTouchStart={handleAttackStart}
            onMouseDown={handleAttackStart}
            className="pointer-events-auto relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-destructive/80 active:bg-destructive active:scale-95 transition-all shadow-lg border-4 border-destructive-foreground/30 flex flex-col items-center justify-center touch-none select-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <span className="text-3xl">{getWeaponEmoji()}</span>
            <span className="font-pixel text-destructive-foreground text-xs sm:text-sm mt-1">
              {activeWeapon ? `${weaponAmmo}` : 'FIRE'}
            </span>
            {/* Weapon ammo indicator */}
            {activeWeapon && weaponAmmo > 0 && (
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-accent-foreground">{weaponAmmo}</span>
              </div>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
