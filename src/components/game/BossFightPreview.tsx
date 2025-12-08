import { useState, useEffect } from 'react';
import { PixelCharacter, SKIN_COLORS } from './PixelCharacter';

interface BossFightPreviewProps {
  isVisible: boolean;
  onClose: () => void;
  onContinue: () => void;
}

const BOSS_TYPES = [
  { name: 'MECH TITAN', color: '#A8A8A8', accentColor: '#3498DB', icon: '🤖' },
  { name: 'FIRE LORD', color: '#FF4500', accentColor: '#FFD700', icon: '🔥' },
  { name: 'ICE QUEEN', color: '#ADD8E6', accentColor: '#87CEEB', icon: '❄️' },
  { name: 'SHADOW KING', color: '#4B0082', accentColor: '#800080', icon: '👑' },
];

export function BossFightPreview({ isVisible, onClose, onContinue }: BossFightPreviewProps) {
  const [currentBoss, setCurrentBoss] = useState(0);
  const [fightPhase, setFightPhase] = useState<'approach' | 'fight' | 'victory'>('approach');
  const [playerX, setPlayerX] = useState(-20);
  const [bossHealth, setBossHealth] = useState(100);
  const [showDamage, setShowDamage] = useState(false);
  const [damageValue, setDamageValue] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      // Reset state when hidden
      setCurrentBoss(0);
      setFightPhase('approach');
      setPlayerX(-20);
      setBossHealth(100);
      return;
    }

    // Approach phase - player runs toward boss
    if (fightPhase === 'approach') {
      const approachInterval = setInterval(() => {
        setPlayerX((prev) => {
          if (prev >= 30) {
            setFightPhase('fight');
            return 30;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(approachInterval);
    }

    // Fight phase - attacks and damage
    if (fightPhase === 'fight') {
      const fightInterval = setInterval(() => {
        const damage = Math.floor(Math.random() * 20) + 10;
        setDamageValue(damage);
        setShowDamage(true);
        setTimeout(() => setShowDamage(false), 300);

        setBossHealth((prev) => {
          const newHealth = prev - damage;
          if (newHealth <= 0) {
            setFightPhase('victory');
            return 0;
          }
          return newHealth;
        });
      }, 600);
      return () => clearInterval(fightInterval);
    }

    // Victory phase - cycle to next boss
    if (fightPhase === 'victory') {
      const victoryTimeout = setTimeout(() => {
        setCurrentBoss((prev) => (prev + 1) % BOSS_TYPES.length);
        setFightPhase('approach');
        setPlayerX(-20);
        setBossHealth(100);
      }, 1500);
      return () => clearTimeout(victoryTimeout);
    }
  }, [isVisible, fightPhase]);

  if (!isVisible) return null;

  const boss = BOSS_TYPES[currentBoss];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/60 hover:text-white text-sm font-pixel"
        >
          ✕ SKIP
        </button>

        {/* Arena */}
        <div className="relative h-64 bg-gradient-to-b from-red-900/30 to-background rounded-2xl border border-red-500/30 overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent" />
          
          {/* Lightning effects */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-16 bg-gradient-to-b from-yellow-400 to-transparent opacity-0 animate-lightning"
                style={{
                  left: `${20 + i * 30}%`,
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            ))}
          </div>

          {/* Boss name banner */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1 bg-red-500/20 rounded-full border border-red-500/40">
            <span className="text-lg">{boss.icon}</span>
            <span className="font-pixel text-[10px] text-red-400">{boss.name}</span>
          </div>

          {/* Boss health bar */}
          <div className="absolute top-14 left-1/2 -translate-x-1/2 w-32">
            <div className="h-2 bg-muted/50 rounded-full overflow-hidden border border-red-500/30">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-200"
                style={{ width: `${bossHealth}%` }}
              />
            </div>
          </div>

          {/* Fight arena */}
          <div className="absolute bottom-8 left-0 right-0 flex items-end justify-between px-8">
            {/* Player character */}
            <div
              className="transition-transform duration-100"
              style={{ transform: `translateX(${playerX}px)` }}
            >
              <PixelCharacter
                animation={fightPhase === 'fight' ? 'fighting' : fightPhase === 'victory' ? 'celebrating' : 'running'}
                size={56}
                showGlow
              />
            </div>

            {/* Damage number */}
            {showDamage && (
              <div
                className="absolute left-1/2 top-20 -translate-x-1/2 font-pixel text-xl text-yellow-400 animate-bounce"
                style={{ textShadow: '0 0 10px #FFD700' }}
              >
                -{damageValue}
              </div>
            )}

            {/* Boss character */}
            <div className={`relative ${fightPhase === 'victory' ? 'animate-boss-defeat' : bossHealth < 50 ? 'animate-boss-hurt' : ''}`}>
              {/* Boss body */}
              <svg width="80" height="80" viewBox="0 0 40 40" style={{ imageRendering: 'pixelated' }}>
                {/* Body */}
                <rect x="8" y="10" width="24" height="20" fill={boss.color} rx="2" />
                {/* Head */}
                <rect x="6" y="2" width="28" height="12" fill={boss.color} rx="2" />
                {/* Evil eyes */}
                <rect x="10" y="5" width="6" height="4" fill={boss.accentColor} />
                <rect x="24" y="5" width="6" height="4" fill={boss.accentColor} />
                <rect x="12" y="6" width="2" height="2" fill="white" />
                <rect x="26" y="6" width="2" height="2" fill="white" />
                {/* Legs */}
                <rect x="10" y="30" width="6" height="8" fill={boss.accentColor} />
                <rect x="24" y="30" width="6" height="8" fill={boss.accentColor} />
                {/* Arms */}
                <rect x="0" y="12" width="8" height="6" fill={boss.color} />
                <rect x="32" y="12" width="8" height="6" fill={boss.color} />
              </svg>
              
              {/* Boss glow */}
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-50 -z-10"
                style={{ background: boss.color }}
              />
            </div>
          </div>

          {/* Ground */}
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-muted to-transparent" />
          
          {/* Victory text */}
          {fightPhase === 'victory' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="font-pixel text-2xl text-yellow-400 animate-scale-in" style={{ textShadow: '0 0 20px #FFD700' }}>
                VICTORY!
              </div>
            </div>
          )}
        </div>

        {/* Continue button */}
        <button
          onClick={onContinue}
          className="w-full mt-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl font-pixel text-sm text-white border border-white/20 active:scale-95 transition-transform"
        >
          VIEW BOSS COLLECTION →
        </button>

        {/* Hint text */}
        <p className="text-center mt-3 font-pixel text-[9px] text-muted-foreground">
          Defeat all bosses to unlock exclusive rewards!
        </p>
      </div>

      <style>{`
        @keyframes lightning {
          0%, 90%, 100% { opacity: 0; }
          92%, 98% { opacity: 1; }
        }
        .animate-lightning {
          animation: lightning 2s ease-in-out infinite;
        }
        @keyframes boss-hurt {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        .animate-boss-hurt {
          animation: boss-hurt 0.3s ease-in-out infinite;
        }
        @keyframes boss-defeat {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(0.5) rotate(10deg); }
        }
        .animate-boss-defeat {
          animation: boss-defeat 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
