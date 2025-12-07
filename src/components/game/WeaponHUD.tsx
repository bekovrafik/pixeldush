import { WeaponType, WEAPON_CONFIGS } from '@/types/game';

interface WeaponHUDProps {
  activeWeapon: WeaponType | null;
  weaponAmmo: number;
  showAttackButton: boolean;
}

export function WeaponHUD({ activeWeapon, weaponAmmo, showAttackButton }: WeaponHUDProps) {
  if (!showAttackButton) return null;

  const getWeaponInfo = () => {
    if (!activeWeapon) {
      return { emoji: '💫', name: 'Energy Shot', color: 'bg-primary' };
    }
    const config = WEAPON_CONFIGS[activeWeapon];
    return { emoji: config.emoji, name: activeWeapon.charAt(0).toUpperCase() + activeWeapon.slice(1), color: 'bg-destructive' };
  };

  const weapon = getWeaponInfo();

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50">
      {/* Weapon Icon */}
      <div className={`w-10 h-10 rounded-lg ${weapon.color}/20 flex items-center justify-center border-2 border-current`}>
        <span className="text-xl">{weapon.emoji}</span>
      </div>
      
      {/* Weapon Info */}
      <div className="flex flex-col">
        <span className="font-pixel text-[10px] text-foreground">{weapon.name}</span>
        {activeWeapon && weaponAmmo > 0 ? (
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              {Array.from({ length: weaponAmmo }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-2 h-4 rounded-sm bg-accent animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
            <span className="font-pixel text-[8px] text-muted-foreground">{weaponAmmo}</span>
          </div>
        ) : (
          <span className="font-pixel text-[8px] text-muted-foreground">∞</span>
        )}
      </div>
      
      {/* Attack hint */}
      <div className="hidden sm:flex flex-col items-center ml-2">
        <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground text-[8px] font-pixel">X</kbd>
        <span className="text-[6px] text-muted-foreground mt-0.5">ATTACK</span>
      </div>
    </div>
  );
}
