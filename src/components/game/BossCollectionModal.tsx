import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skull, Clock, Trophy, Lock, Swords } from 'lucide-react';
import { BOSS_CONFIGS, BossConfig } from '@/types/boss';

interface DefeatedBoss {
  type: string;
  defeatedAt: number;
  killTime?: number;
}

interface BossCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defeatedBosses: DefeatedBoss[];
}

export function BossCollectionModal({ isOpen, onClose, defeatedBosses }: BossCollectionModalProps) {
  const getBossStats = (bossType: string) => {
    const defeats = defeatedBosses.filter(b => b.type === bossType);
    if (defeats.length === 0) return null;
    
    const killTimes = defeats.filter(d => d.killTime).map(d => d.killTime!);
    const fastestKill = killTimes.length > 0 ? Math.min(...killTimes) : null;
    const totalDefeats = defeats.length;
    
    return { totalDefeats, fastestKill };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getBossGradient = (type: string) => {
    switch (type) {
      case 'mech':
        return 'from-red-500/20 to-orange-500/20';
      case 'dragon':
        return 'from-purple-500/20 to-pink-500/20';
      case 'titan':
        return 'from-yellow-500/20 to-amber-500/20';
      default:
        return 'from-primary/20 to-secondary/20';
    }
  };

  const getBossIcon = (type: string) => {
    switch (type) {
      case 'mech':
        return '🤖';
      case 'dragon':
        return '🐉';
      case 'titan':
        return '⚡';
      default:
        return '👾';
    }
  };

  const totalBossesDefeated = BOSS_CONFIGS.filter(
    boss => defeatedBosses.some(d => d.type === boss.type)
  ).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md bg-card border-primary/30 p-4 sm:p-6 max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="font-pixel text-base sm:text-lg text-primary flex items-center gap-2">
            <Swords className="w-4 h-4 sm:w-5 sm:h-5" />
            BOSS COLLECTION
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="mb-3 p-3 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-pixel text-[10px] text-muted-foreground">BOSSES DEFEATED</span>
            <span className="font-pixel text-xs text-primary">{totalBossesDefeated}/{BOSS_CONFIGS.length}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500"
              style={{ width: `${(totalBossesDefeated / BOSS_CONFIGS.length) * 100}%` }}
            />
          </div>
        </div>

        <ScrollArea className="h-[50vh] sm:h-[400px] pr-2">
          <div className="space-y-3">
            {BOSS_CONFIGS.map((boss) => {
              const stats = getBossStats(boss.type);
              const isDefeated = !!stats;

              return (
                <div
                  key={boss.type}
                  className={`relative p-4 rounded-lg border transition-all overflow-hidden ${
                    isDefeated 
                      ? 'border-primary/50 bg-card/80' 
                      : 'border-border/30 bg-muted/20 opacity-60'
                  }`}
                >
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${getBossGradient(boss.type)} pointer-events-none`} />
                  
                  <div className="relative flex items-start gap-4">
                    {/* Boss icon */}
                    <div 
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center text-3xl sm:text-4xl ${
                        isDefeated ? '' : 'grayscale'
                      }`}
                      style={{ 
                        backgroundColor: isDefeated ? `${boss.color}30` : '#33333350',
                        border: `2px solid ${isDefeated ? boss.color : '#555'}`,
                      }}
                    >
                      {isDefeated ? getBossIcon(boss.type) : <Lock className="w-6 h-6 text-muted-foreground" />}
                    </div>

                    {/* Boss info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-pixel text-xs sm:text-sm" style={{ color: isDefeated ? boss.color : 'inherit' }}>
                          {boss.name}
                        </h3>
                        {isDefeated && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-pixel">
                            DEFEATED
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-muted-foreground mb-2">
                        Spawns at {boss.triggerDistance}m • HP: {boss.health}
                      </div>

                      {isDefeated && stats ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <Trophy className="w-3 h-3 text-yellow-400" />
                            <span className="text-foreground">{stats.totalDefeats} defeats</span>
                          </div>
                          {stats.fastestKill && (
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <Clock className="w-3 h-3 text-blue-400" />
                              <span className="text-foreground">Best: {formatTime(stats.fastestKill)}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Skull className="w-3 h-3" />
                          <span>Reach {boss.triggerDistance}m to encounter</span>
                        </div>
                      )}

                      {/* Rewards */}
                      <div className="mt-2 pt-2 border-t border-border/30">
                        <div className="flex gap-3 text-[9px]">
                          <span className="text-yellow-400">+{boss.rewardCoins} coins</span>
                          <span className="text-cyan-400">+{boss.rewardXP} XP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
