import { useCallback, useState, useEffect } from 'react';
import { hapticsManager } from '@/lib/hapticsManager';

interface MobileControlsProps {
  onJump: () => void;
  onAttack: () => void;
  showAttackButton: boolean;
  doubleJumpAvailable: boolean;
  hasDoubleJumped: boolean;
  activeWeapon: string | null;
  weaponAmmo: number;
  justPickedUpWeapon?: boolean;
}

export function MobileControls({ 
  onJump, 
  onAttack, 
  showAttackButton, 
  doubleJumpAvailable,
  hasDoubleJumped,
  activeWeapon, 
  weaponAmmo,
  justPickedUpWeapon = false,
}: MobileControlsProps) {
  const [showWeaponTutorial, setShowWeaponTutorial] = useState(false);
  const [pulseAttack, setPulseAttack] = useState(false);
  
  // Show weapon tutorial when first picking up a weapon
  useEffect(() => {
    if (justPickedUpWeapon && activeWeapon) {
      setShowWeaponTutorial(true);
      setPulseAttack(true);
      
      const timer = setTimeout(() => {
        setShowWeaponTutorial(false);
      }, 3000);
      
      const pulseTimer = setTimeout(() => {
        setPulseAttack(false);
      }, 5000);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(pulseTimer);
      };
    }
  }, [justPickedUpWeapon, activeWeapon]);

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
    setShowWeaponTutorial(false);
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
          <div className="relative">
            {/* Weapon tutorial tooltip */}
            {showWeaponTutorial && (
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-2 rounded-lg shadow-lg animate-bounce whitespace-nowrap z-10">
                <div className="font-pixel text-xs">TAP TO FIRE! {getWeaponEmoji()}</div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-accent" />
              </div>
            )}
            
            <button
              onTouchStart={handleAttackStart}
              onMouseDown={handleAttackStart}
              className={`pointer-events-auto relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-destructive/80 active:bg-destructive active:scale-95 transition-all shadow-lg border-4 border-destructive-foreground/30 flex flex-col items-center justify-center touch-none select-none ${
                pulseAttack ? 'animate-pulse ring-4 ring-accent ring-opacity-75' : ''
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span className={`text-3xl ${activeWeapon ? 'animate-bounce' : ''}`}>{getWeaponEmoji()}</span>
              <span className="font-pixel text-destructive-foreground text-xs sm:text-sm mt-1">
                {activeWeapon ? `${weaponAmmo}` : 'FIRE'}
              </span>
              {/* Weapon ammo indicator */}
              {activeWeapon && weaponAmmo > 0 && (
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-lg animate-pulse">
                  <span className="text-sm font-bold text-accent-foreground">{weaponAmmo}</span>
                </div>
              )}
              {/* New weapon indicator */}
              {justPickedUpWeapon && (
                <div className="absolute inset-0 rounded-full border-4 border-accent animate-ping" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
