import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Check, Calendar } from 'lucide-react';
import { DAILY_REWARDS } from '@/types/game';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
  canClaim: boolean;
  lastClaimDay: number;
  onClaim: () => void;
  isLoggedIn: boolean;
  onOpenAuth: () => void;
}

export function DailyRewardModal({ isOpen, onClose, currentStreak, canClaim, lastClaimDay, onClaim, isLoggedIn, onOpenAuth }: DailyRewardModalProps) {
  const todayRewardIndex = Math.min(currentStreak, 6);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm sm:max-w-md bg-card border-accent/30 max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-pixel text-sm sm:text-lg text-accent flex items-center gap-2">
            <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
            DAILY REWARDS
          </DialogTitle>
        </DialogHeader>

        {!isLoggedIn ? (
          <div className="text-center py-6 sm:py-8">
            <Gift className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">Sign in to claim daily rewards!</p>
            <Button onClick={onOpenAuth} className="game-button text-xs sm:text-sm">SIGN IN</Button>
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-pixel text-xs sm:text-sm text-primary">{currentStreak} DAY STREAK</span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {DAILY_REWARDS.map((reward, index) => {
                const isClaimed = index < lastClaimDay;
                const isToday = index === todayRewardIndex && canClaim;
                const isFuture = index > todayRewardIndex || (index === todayRewardIndex && !canClaim);
                
                return (
                  <div
                    key={reward.day}
                    className={`flex flex-col items-center p-1.5 sm:p-2 rounded-lg border transition-all ${
                      isClaimed ? 'border-primary bg-primary/20' :
                      isToday ? 'border-accent bg-accent/20 animate-pulse' :
                      'border-border/50 bg-muted/30 opacity-50'
                    }`}
                  >
                    <span className="font-pixel text-[8px] sm:text-[10px] text-muted-foreground">D{reward.day}</span>
                    <span className="text-sm sm:text-lg">🪙</span>
                    <span className="font-pixel text-[8px] sm:text-[10px] text-accent">{reward.coins}</span>
                    {isClaimed && <Check className="w-3 h-3 text-primary mt-0.5" />}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex justify-center">
              {canClaim ? (
                <Button onClick={onClaim} className="game-button bg-accent text-accent-foreground text-xs sm:text-sm">
                  <Gift className="w-4 h-4 mr-2" />
                  CLAIM {DAILY_REWARDS[todayRewardIndex].coins} COINS
                </Button>
              ) : (
                <p className="font-pixel text-[10px] sm:text-xs text-muted-foreground">Come back tomorrow!</p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
