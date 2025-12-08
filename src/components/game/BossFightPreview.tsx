import { useState, useEffect, useCallback } from 'react';
import { PixelCharacter } from './PixelCharacter';

interface BossFightPreviewProps {
  isVisible: boolean;
  onClose: () => void;
  onContinue: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
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
  const [particles, setParticles] = useState<Particle[]>([]);
  const [screenShake, setScreenShake] = useState({ x: 0, y: 0 });
  const [isShaking, setIsShaking] = useState(false);

  // Create explosion particles
  const createExplosion = useCallback((x: number, y: number, color: string, count: number = 15) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        id: Date.now() + i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 4,
        life: 1,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  }, []);

  // Trigger screen shake
  const triggerShake = useCallback((intensity: number = 5, duration: number = 300) => {
    setIsShaking(true);
    const shakeInterval = setInterval(() => {
      setScreenShake({
        x: (Math.random() - 0.5) * intensity * 2,
        y: (Math.random() - 0.5) * intensity * 2,
      });
    }, 30);

    setTimeout(() => {
      clearInterval(shakeInterval);
      setScreenShake({ x: 0, y: 0 });
      setIsShaking(false);
    }, duration);
  }, []);

  // Update particles
  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.15, // gravity
            life: p.life - 0.03,
          }))
          .filter((p) => p.life > 0)
      );
    }, 30);

    return () => clearInterval(interval);
  }, [particles.length]);

  useEffect(() => {
    if (!isVisible) {
      setCurrentBoss(0);
      setFightPhase('approach');
      setPlayerX(-20);
      setBossHealth(100);
      setParticles([]);
      return;
    }

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

    if (fightPhase === 'fight') {
      const fightInterval = setInterval(() => {
        const damage = Math.floor(Math.random() * 20) + 10;
        setDamageValue(damage);
        setShowDamage(true);
        setTimeout(() => setShowDamage(false), 300);

        // Hit particles
        createExplosion(70, 50, BOSS_TYPES[currentBoss].accentColor, 8);
        triggerShake(3, 150);

        setBossHealth((prev) => {
          const newHealth = prev - damage;
          if (newHealth <= 0) {
            setFightPhase('victory');
            // Big explosion on defeat!
            setTimeout(() => {
              createExplosion(70, 50, BOSS_TYPES[currentBoss].color, 30);
              createExplosion(70, 50, '#FFD700', 20);
              triggerShake(12, 500);
            }, 100);
            return 0;
          }
          return newHealth;
        });
      }, 600);
      return () => clearInterval(fightInterval);
    }

    if (fightPhase === 'victory') {
      const victoryTimeout = setTimeout(() => {
        setCurrentBoss((prev) => (prev + 1) % BOSS_TYPES.length);
        setFightPhase('approach');
        setPlayerX(-20);
        setBossHealth(100);
        setParticles([]);
      }, 1500);
      return () => clearTimeout(victoryTimeout);
    }
  }, [isVisible, fightPhase, createExplosion, triggerShake, currentBoss]);

  if (!isVisible) return null;

  const boss = BOSS_TYPES[currentBoss];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm mx-4">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/60 hover:text-white text-sm font-pixel"
        >
          ✕ SKIP
        </button>

        {/* Arena with screen shake */}
        <div
          className="relative h-64 bg-gradient-to-b from-red-900/30 to-background rounded-2xl border border-red-500/30 overflow-hidden transition-transform"
          style={{
            transform: `translate(${screenShake.x}px, ${screenShake.y}px)`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent" />

          {/* Flash effect on hit */}
          {isShaking && (
            <div className="absolute inset-0 bg-white/20 animate-flash pointer-events-none" />
          )}

          {/* Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((p) => (
              <div
                key={p.id}
                className="absolute rounded-full"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  opacity: p.life,
                  boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
          </div>

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

            {/* Damage number with float animation */}
            {showDamage && (
              <div
                className="absolute left-1/2 top-16 -translate-x-1/2 font-pixel text-2xl text-yellow-400 animate-damage-float"
                style={{ textShadow: '0 0 15px #FFD700, 0 0 30px #FF4500' }}
              >
                -{damageValue}
              </div>
            )}

            {/* Boss character */}
            <div className={`relative ${fightPhase === 'victory' ? 'animate-boss-defeat' : bossHealth < 50 ? 'animate-boss-hurt' : ''}`}>
              <svg width="80" height="80" viewBox="0 0 40 40" style={{ imageRendering: 'pixelated' }}>
                <rect x="8" y="10" width="24" height="20" fill={boss.color} rx="2" />
                <rect x="6" y="2" width="28" height="12" fill={boss.color} rx="2" />
                <rect x="10" y="5" width="6" height="4" fill={boss.accentColor} />
                <rect x="24" y="5" width="6" height="4" fill={boss.accentColor} />
                <rect x="12" y="6" width="2" height="2" fill="white" />
                <rect x="26" y="6" width="2" height="2" fill="white" />
                <rect x="10" y="30" width="6" height="8" fill={boss.accentColor} />
                <rect x="24" y="30" width="6" height="8" fill={boss.accentColor} />
                <rect x="0" y="12" width="8" height="6" fill={boss.color} />
                <rect x="32" y="12" width="8" height="6" fill={boss.color} />
              </svg>
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-50 -z-10"
                style={{ background: boss.color }}
              />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-muted to-transparent" />

          {/* Victory text with particles */}
          {fightPhase === 'victory' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="font-pixel text-3xl text-yellow-400 animate-victory-bounce" style={{ textShadow: '0 0 30px #FFD700, 0 0 60px #FF4500' }}>
                VICTORY!
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onContinue}
          className="w-full mt-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl font-pixel text-sm text-white border border-white/20 active:scale-95 transition-transform"
        >
          VIEW BOSS COLLECTION →
        </button>

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
          25% { transform: translateX(-5px) rotate(-2deg); }
          75% { transform: translateX(5px) rotate(2deg); }
        }
        .animate-boss-hurt {
          animation: boss-hurt 0.2s ease-in-out infinite;
        }
        @keyframes boss-defeat {
          0% { opacity: 1; transform: scale(1); }
          30% { transform: scale(1.2) rotate(-5deg); }
          60% { opacity: 0.5; transform: scale(0.8) rotate(10deg); }
          100% { opacity: 0; transform: scale(0) rotate(20deg) translateY(20px); }
        }
        .animate-boss-defeat {
          animation: boss-defeat 0.8s ease-out forwards;
        }
        @keyframes damage-float {
          0% { opacity: 1; transform: translate(-50%, 0) scale(0.5); }
          20% { transform: translate(-50%, -10px) scale(1.2); }
          100% { opacity: 0; transform: translate(-50%, -40px) scale(0.8); }
        }
        .animate-damage-float {
          animation: damage-float 0.6s ease-out forwards;
        }
        @keyframes victory-bounce {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.15) rotate(-3deg); }
          50% { transform: scale(1.1) rotate(3deg); }
          75% { transform: scale(1.15) rotate(-2deg); }
        }
        .animate-victory-bounce {
          animation: victory-bounce 0.6s ease-in-out infinite;
        }
        @keyframes flash {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.3; }
        }
        .animate-flash {
          animation: flash 0.1s ease-out;
        }
      `}</style>
    </div>
  );
}
