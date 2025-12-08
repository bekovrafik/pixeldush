import { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Timer, Coins, Zap, Trophy, Star, Sparkles } from 'lucide-react';

interface VictoryStats {
  bossesDefeated: string[];
  totalCoins: number;
  totalXP: number;
  timeSeconds: number;
  isRushMode: boolean;
  isEndlessMode: boolean;
  endlessWave: number;
  hasDied: boolean;
}

interface VictoryCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: VictoryStats | null;
}

const BOSS_NAMES: Record<string, string> = {
  mech: 'CYBER MECH',
  dragon: 'SHADOW DRAGON',
  titan: 'COSMIC TITAN',
};

const BOSS_COLORS: Record<string, string> = {
  mech: 'from-red-500 to-orange-500',
  dragon: 'from-purple-500 to-pink-500',
  titan: 'from-yellow-400 to-amber-500',
};

const BOSS_ICONS: Record<string, string> = {
  mech: '🤖',
  dragon: '🐉',
  titan: '👹',
};

export function VictoryCelebrationModal({ isOpen, onClose, stats }: VictoryCelebrationModalProps) {
  const [showContent, setShowContent] = useState(false);
  const [animatedCoins, setAnimatedCoins] = useState(0);
  const [animatedXP, setAnimatedXP] = useState(0);
  const [bossesRevealed, setBossesRevealed] = useState<number>(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    rotation: number;
  }>>([]);

  // Reset animations when modal opens
  useEffect(() => {
    if (isOpen && stats) {
      setShowContent(false);
      setAnimatedCoins(0);
      setAnimatedXP(0);
      setBossesRevealed(0);
      setShowConfetti(false);
      setParticles([]);

      // Stagger animations
      setTimeout(() => setShowContent(true), 100);
      setTimeout(() => setShowConfetti(true), 300);

      // Generate confetti particles
      const newParticles = Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 3 + 1,
        color: ['#FFD700', '#FF4444', '#9933FF', '#00FFFF', '#FF69B4', '#00FF00'][Math.floor(Math.random() * 6)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
      }));
      setParticles(newParticles);

      // Reveal bosses one by one
      stats.bossesDefeated.forEach((_, index) => {
        setTimeout(() => setBossesRevealed(index + 1), 600 + index * 400);
      });

      // Animate counters
      const coinDuration = 1500;
      const startTime = Date.now() + 800;
      const animateCounters = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed < 0) {
          requestAnimationFrame(animateCounters);
          return;
        }
        const progress = Math.min(elapsed / coinDuration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setAnimatedCoins(Math.floor(stats.totalCoins * eased));
        setAnimatedXP(Math.floor(stats.totalXP * eased));
        if (progress < 1) requestAnimationFrame(animateCounters);
      };
      requestAnimationFrame(animateCounters);
    }
  }, [isOpen, stats]);

  // Animate confetti particles
  useEffect(() => {
    if (!showConfetti || particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        rotation: p.rotation + 5,
      })).filter(p => p.y < 120));
    }, 50);

    return () => clearInterval(interval);
  }, [showConfetti, particles.length]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  if (!stats) return null;

  const getTitle = () => {
    if (stats.isEndlessMode) {
      return `ENDLESS WAVE ${stats.endlessWave}`;
    }
    if (stats.isRushMode) {
      return 'RUSH MODE COMPLETE!';
    }
    return 'ARENA VICTORY!';
  };

  const getSubtitle = () => {
    if (stats.hasDied) {
      return 'Completed with revive';
    }
    return 'FLAWLESS VICTORY! 2x BONUS!';
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-yellow-500/50 overflow-hidden">
        <DialogTitle className="sr-only">Victory Celebration</DialogTitle>
        
        {/* Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map(p => (
            <div
              key={p.id}
              className="absolute"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                transform: `rotate(${p.rotation}deg)`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
            />
          ))}
        </div>

        <div className={`relative z-10 transition-all duration-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Header */}
          <div className="text-center mb-4">
            <div className="flex justify-center mb-2">
              <div className="relative">
                <Trophy className="w-16 h-16 text-yellow-400 animate-bounce" />
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              {getTitle()}
            </h2>
            <p className={`text-sm mt-1 font-semibold ${stats.hasDied ? 'text-slate-400' : 'text-green-400 animate-pulse'}`}>
              {getSubtitle()}
            </p>
          </div>

          {/* Bosses Defeated */}
          <div className="mb-4">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2 text-center">Bosses Defeated</h3>
            <div className="flex justify-center gap-2">
              {stats.bossesDefeated.map((boss, index) => (
                <div
                  key={`${boss}-${index}`}
                  className={`relative transition-all duration-500 ${
                    index < bossesRevealed
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-50'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${BOSS_COLORS[boss]} flex items-center justify-center shadow-lg border-2 border-white/20`}>
                    <span className="text-3xl">{BOSS_ICONS[boss]}</span>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-slate-900 px-1 rounded text-[10px] font-bold text-white whitespace-nowrap">
                    {BOSS_NAMES[boss]}
                  </div>
                  {index < bossesRevealed && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-xs">✓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Time */}
            <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Timer className="w-4 h-4" />
                <span>TIME</span>
              </div>
              <div className="text-xl font-bold text-white font-mono">
                {formatTime(stats.timeSeconds)}
              </div>
            </div>

            {/* Mode */}
            <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Star className="w-4 h-4" />
                <span>MODE</span>
              </div>
              <div className="text-lg font-bold">
                {stats.isEndlessMode && <span className="text-purple-400">ENDLESS</span>}
                {stats.isRushMode && <span className="text-orange-400">RUSH</span>}
                {!stats.isEndlessMode && !stats.isRushMode && <span className="text-blue-400">STANDARD</span>}
              </div>
            </div>

            {/* Coins */}
            <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 rounded-lg p-3 border border-yellow-500/30">
              <div className="flex items-center gap-2 text-yellow-400 text-xs mb-1">
                <Coins className="w-4 h-4" />
                <span>COINS EARNED</span>
              </div>
              <div className="text-2xl font-black text-yellow-300">
                +{animatedCoins.toLocaleString()}
              </div>
            </div>

            {/* XP */}
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg p-3 border border-cyan-500/30">
              <div className="flex items-center gap-2 text-cyan-400 text-xs mb-1">
                <Zap className="w-4 h-4" />
                <span>XP EARNED</span>
              </div>
              <div className="text-2xl font-black text-cyan-300">
                +{animatedXP.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Endless Wave Info */}
          {stats.isEndlessMode && stats.endlessWave > 0 && (
            <div className="mb-4 text-center bg-purple-500/20 rounded-lg p-2 border border-purple-500/30">
              <span className="text-purple-300 text-sm">
                🌊 Reached Wave <span className="font-bold text-lg">{stats.endlessWave}</span>
              </span>
            </div>
          )}

          {/* Bonus Info */}
          {!stats.hasDied && (
            <div className="mb-4 text-center bg-green-500/20 rounded-lg p-2 border border-green-500/30 animate-pulse">
              <Crown className="inline-block w-4 h-4 text-yellow-400 mr-1" />
              <span className="text-green-300 text-sm font-semibold">
                No-Death Bonus: 2x Rewards Applied!
              </span>
            </div>
          )}

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold text-lg py-3"
          >
            CONTINUE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
