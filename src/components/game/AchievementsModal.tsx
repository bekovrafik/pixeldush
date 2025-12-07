import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Award, Check, Lock } from 'lucide-react';
import { Achievement, UserAchievement } from '@/types/game';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
  unlockedIds: string[];
  loading: boolean;
}

export function AchievementsModal({ isOpen, onClose, achievements, unlockedIds, loading }: AchievementsModalProps) {
  const sortedAchievements = [...achievements].sort((a, b) => {
    const aUnlocked = unlockedIds.includes(a.id);
    const bUnlocked = unlockedIds.includes(b.id);
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    return a.requirement_value - b.requirement_value;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm sm:max-w-md bg-card border-primary/30 max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-pixel text-sm sm:text-lg text-primary flex items-center gap-2">
            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            ACHIEVEMENTS
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[50vh] sm:h-[400px] pr-2 sm:pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="font-pixel text-xs text-muted-foreground animate-pulse">LOADING...</div>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedAchievements.map((achievement) => {
                const isUnlocked = unlockedIds.includes(achievement.id);
                return (
                  <div
                    key={achievement.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      isUnlocked ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/30 opacity-60'
                    }`}
                  >
                    <div className="text-2xl sm:text-3xl flex-shrink-0">{achievement.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-pixel text-[10px] sm:text-xs text-foreground truncate">{achievement.name}</p>
                        {isUnlocked && <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{achievement.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-pixel text-[10px] sm:text-xs text-accent">+{achievement.reward_coins} 🪙</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="mt-2 text-center">
          <p className="font-pixel text-[10px] sm:text-xs text-muted-foreground">
            {unlockedIds.length} / {achievements.length} UNLOCKED
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
