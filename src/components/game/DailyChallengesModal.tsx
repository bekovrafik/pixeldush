import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Target, Check, Gift, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface DailyChallenge {
  id: string;
  challenge_type: string;
  title: string;
  description: string;
  target_value: number;
  reward_coins: number;
  icon: string;
}

interface UserChallengeProgress {
  id: string;
  challenge_id: string;
  current_progress: number;
  is_completed: boolean;
  is_claimed: boolean;
  challenge: DailyChallenge;
}

interface DailyChallengesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProgress: UserChallengeProgress[];
  loading: boolean;
  isLoggedIn: boolean;
  onClaimReward: (progressId: string) => Promise<{ error: Error | null; reward?: number }>;
  onOpenAuth: () => void;
  onPurchaseComplete: () => void;
}

export function DailyChallengesModal({
  isOpen,
  onClose,
  userProgress,
  loading,
  isLoggedIn,
  onClaimReward,
  onOpenAuth,
  onPurchaseComplete,
}: DailyChallengesModalProps) {
  const handleClaim = async (progressId: string) => {
    const result = await onClaimReward(progressId);
    if (result.error) {
      toast.error('Failed to claim reward');
    } else {
      toast.success(`🎉 Claimed ${result.reward} coins!`);
      onPurchaseComplete();
    }
  };

  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const completedCount = userProgress.filter(p => p.is_completed).length;
  const totalCount = userProgress.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md bg-card border-primary/30 p-4 sm:p-6 max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="font-pixel text-base sm:text-lg text-primary flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              DAILY CHALLENGES
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground font-normal">
              <Clock className="w-3 h-3" />
              {getTimeUntilReset()}
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Progress Summary */}
        <div className="mb-3 p-2 sm:p-3 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-pixel text-[9px] sm:text-[10px] text-muted-foreground">TODAY'S PROGRESS</span>
            <span className="font-pixel text-[10px] sm:text-xs text-primary">{completedCount}/{totalCount}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-500"
              style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
            />
          </div>
        </div>

        <ScrollArea className="h-[45vh] sm:h-[350px] pr-2 sm:pr-4">
          {!isLoggedIn ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Target className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground mb-3">Sign in to access daily challenges</p>
              <Button size="sm" onClick={onOpenAuth} className="font-pixel text-[10px]">
                SIGN IN
              </Button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="font-pixel text-xs text-muted-foreground animate-pulse">
                LOADING...
              </div>
            </div>
          ) : userProgress.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Target className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">No challenges available</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {userProgress.map((progress) => {
                const challenge = progress.challenge;
                const progressPercent = Math.min((progress.current_progress / challenge.target_value) * 100, 100);

                return (
                  <div
                    key={progress.id}
                    className={`p-3 sm:p-4 rounded-lg border transition-all ${
                      progress.is_claimed
                        ? 'bg-muted/20 border-border/30 opacity-60'
                        : progress.is_completed
                          ? 'bg-accent/10 border-accent/50'
                          : 'bg-card/50 border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 ${
                        progress.is_completed ? 'bg-accent/20' : 'bg-muted/50'
                      }`}>
                        {challenge.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-pixel text-[10px] sm:text-xs text-foreground truncate">
                            {challenge.title}
                          </p>
                          {progress.is_completed && !progress.is_claimed && (
                            <Check className="w-3 h-3 text-accent flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {challenge.description}
                        </p>

                        {/* Progress bar */}
                        <div className="mt-2">
                          <div className="flex justify-between text-[9px] sm:text-[10px] mb-1">
                            <span className="text-muted-foreground">
                              {progress.current_progress}/{challenge.target_value}
                            </span>
                            <span className="text-accent font-pixel">+{challenge.reward_coins} 🪙</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                progress.is_completed ? 'bg-accent' : 'bg-primary'
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Claim button */}
                      <div className="flex-shrink-0">
                        {progress.is_claimed ? (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Check className="w-3 h-3" />
                            <span className="font-pixel text-[8px] sm:text-[9px]">CLAIMED</span>
                          </div>
                        ) : progress.is_completed ? (
                          <Button
                            size="sm"
                            onClick={() => handleClaim(progress.id)}
                            className="game-button text-[9px] sm:text-[10px] h-7 sm:h-8 px-2 sm:px-3"
                          >
                            <Gift className="w-3 h-3 mr-1" />
                            CLAIM
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
