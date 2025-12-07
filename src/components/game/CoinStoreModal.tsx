import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Coins, Play, Gift, Sparkles, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { admobManager } from '@/lib/admobManager';
import { supabase } from '@/integrations/supabase/client';

interface CoinStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  profileId: string | null;
  currentCoins: number;
  onCoinsEarned: () => void;
  onOpenAuth: () => void;
}

interface AdReward {
  id: string;
  name: string;
  coins: number;
  description: string;
  cooldownMinutes: number;
  icon: 'play' | 'gift' | 'sparkles';
}

const AD_REWARDS: AdReward[] = [
  { id: 'watch_ad', name: 'Watch Ad', coins: 25, description: 'Watch a short video', cooldownMinutes: 0, icon: 'play' },
  { id: 'bonus_ad', name: 'Bonus Reward', coins: 50, description: 'Double coins reward', cooldownMinutes: 30, icon: 'gift' },
  { id: 'mega_reward', name: 'Mega Reward', coins: 100, description: 'Premium reward', cooldownMinutes: 60, icon: 'sparkles' },
];

export function CoinStoreModal({
  isOpen,
  onClose,
  isLoggedIn,
  profileId,
  currentCoins,
  onCoinsEarned,
  onOpenAuth,
}: CoinStoreModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [lastClaimed, setLastClaimed] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('coinStoreCooldowns');
    return saved ? JSON.parse(saved) : {};
  });

  const getTimeRemaining = (rewardId: string, cooldownMinutes: number): number => {
    const lastTime = lastClaimed[rewardId] || 0;
    const cooldownMs = cooldownMinutes * 60 * 1000;
    const elapsed = Date.now() - lastTime;
    return Math.max(0, cooldownMs - elapsed);
  };

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const handleWatchAd = async (reward: AdReward) => {
    if (!isLoggedIn || !profileId) {
      onOpenAuth();
      return;
    }

    const remaining = getTimeRemaining(reward.id, reward.cooldownMinutes);
    if (remaining > 0) {
      toast.error(`Please wait ${formatTimeRemaining(remaining)} before claiming again.`);
      return;
    }

    setLoading(reward.id);
    toast.info('Loading ad...');

    try {
      const success = await admobManager.showRewardedAd();
      
      if (success) {
        // Add coins to profile
        const { error } = await supabase
          .from('profiles')
          .update({ coins: currentCoins + reward.coins })
          .eq('id', profileId);

        if (!error) {
          toast.success(`🎉 You earned ${reward.coins} coins!`);
          
          // Update cooldown
          const newCooldowns = { ...lastClaimed, [reward.id]: Date.now() };
          setLastClaimed(newCooldowns);
          localStorage.setItem('coinStoreCooldowns', JSON.stringify(newCooldowns));
          
          onCoinsEarned();
        } else {
          toast.error('Failed to add coins. Please try again.');
        }
      } else {
        toast.error('Ad not available. Please try again later.');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const getIcon = (iconType: AdReward['icon']) => {
    switch (iconType) {
      case 'play': return Play;
      case 'gift': return Gift;
      case 'sparkles': return Sparkles;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md bg-card border-primary/30 p-4 sm:p-6 max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="font-pixel text-base sm:text-lg text-primary flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              FREE COINS
            </div>
            {isLoggedIn && (
              <span className="text-[10px] sm:text-xs text-accent font-pixel">
                {currentCoins} 🪙
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[40vh] sm:h-[300px] pr-2 sm:pr-4">
          <div className="space-y-2 sm:space-y-3">
            <p className="text-[10px] sm:text-xs text-muted-foreground text-center mb-3 sm:mb-4">
              Watch ads to earn free coins!
            </p>

            {AD_REWARDS.map((reward) => {
              const remaining = getTimeRemaining(reward.id, reward.cooldownMinutes);
              const isOnCooldown = remaining > 0;
              const Icon = getIcon(reward.icon);
              const isLoading = loading === reward.id;

              return (
                <div
                  key={reward.id}
                  className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border transition-all ${
                    isOnCooldown
                      ? 'bg-muted/30 border-border/50 opacity-60'
                      : 'bg-card/50 border-accent/30 hover:border-accent/50'
                  }`}
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isOnCooldown ? 'bg-muted/50' : 'bg-accent/20'
                  }`}>
                    {isOnCooldown ? (
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                    ) : (
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-pixel text-[10px] sm:text-xs text-foreground">
                      {reward.name}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">
                      {reward.description}
                    </p>
                    <p className="text-[10px] sm:text-xs text-accent font-pixel mt-0.5">
                      +{reward.coins} coins
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    {isOnCooldown ? (
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground font-pixel text-center">
                        <Clock className="w-3 h-3 mx-auto mb-0.5" />
                        {formatTimeRemaining(remaining)}
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleWatchAd(reward)}
                        disabled={isLoading}
                        className="game-button text-[9px] sm:text-[10px] h-7 sm:h-8 px-2 sm:px-3"
                      >
                        {isLoading ? (
                          '...'
                        ) : (
                          <>
                            <Play className="w-3 h-3 mr-1" />
                            WATCH
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {!isLoggedIn && (
          <div className="mt-3 sm:mt-4 p-2 sm:p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-2">
              Sign in to earn coins
            </p>
            <Button size="sm" onClick={onOpenAuth} className="font-pixel text-[9px] sm:text-[10px] h-7 sm:h-8">
              SIGN IN
            </Button>
          </div>
        )}

        <p className="text-[8px] sm:text-[10px] text-muted-foreground text-center mt-2">
          Ad availability depends on your device and region
        </p>
      </DialogContent>
    </Dialog>
  );
}
