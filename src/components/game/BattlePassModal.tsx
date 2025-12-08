import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Crown, Lock, Check, Coins, Gift, Sparkles, Clock, Star } from 'lucide-react';
import { toast } from 'sonner';

interface BattlePassTier {
  id: string;
  tier_number: number;
  xp_required: number;
  free_reward_type: string;
  free_reward_value: string | null;
  premium_reward_type: string;
  premium_reward_value: string | null;
}

interface UserBattlePass {
  current_xp: number;
  current_tier: number;
  is_premium: boolean;
  claimed_free_tiers: number[];
  claimed_premium_tiers: number[];
}

interface BattlePassSeason {
  name: string;
}

interface BattlePassModalProps {
  isOpen: boolean;
  onClose: () => void;
  season: BattlePassSeason | null;
  tiers: BattlePassTier[];
  userProgress: UserBattlePass | null;
  loading: boolean;
  isLoggedIn: boolean;
  timeRemaining: { days: number; hours: number };
  onClaimReward: (tierNumber: number, isPremium: boolean) => Promise<{ success: boolean; reward?: { type: string; value: string } }>;
  onUpgradeToPremium: (cost: number) => Promise<boolean>;
  onOpenAuth: () => void;
  onPurchaseComplete: () => void;
}

const PREMIUM_COST = 5000;

export function BattlePassModal({
  isOpen,
  onClose,
  season,
  tiers,
  userProgress,
  loading,
  isLoggedIn,
  timeRemaining,
  onClaimReward,
  onUpgradeToPremium,
  onOpenAuth,
  onPurchaseComplete,
}: BattlePassModalProps) {
  const currentXP = userProgress?.current_xp || 0;
  const currentTier = userProgress?.current_tier || 0;
  const isPremium = userProgress?.is_premium || false;
  const claimedFreeTiers = userProgress?.claimed_free_tiers || [];
  const claimedPremiumTiers = userProgress?.claimed_premium_tiers || [];

  const nextTier = tiers.find(t => t.tier_number === currentTier + 1);
  const xpProgress = nextTier ? ((currentXP - (tiers[currentTier - 1]?.xp_required || 0)) / (nextTier.xp_required - (tiers[currentTier - 1]?.xp_required || 0))) * 100 : 100;

  const handleClaimReward = async (tierNumber: number, isPremiumReward: boolean) => {
    if (!isLoggedIn) {
      onOpenAuth();
      return;
    }

    const result = await onClaimReward(tierNumber, isPremiumReward);
    if (result.success && result.reward) {
      const rewardText = result.reward.type === 'coins' 
        ? `${result.reward.value} coins` 
        : `${result.reward.value} skin`;
      toast.success(`Claimed: ${rewardText}!`);
      onPurchaseComplete();
    }
  };

  const handleUpgrade = async () => {
    if (!isLoggedIn) {
      onOpenAuth();
      return;
    }

    const success = await onUpgradeToPremium(PREMIUM_COST);
    if (success) {
      onPurchaseComplete();
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'coins': return <Coins className="w-4 h-4 text-yellow-400" />;
      case 'skin': return <Sparkles className="w-4 h-4 text-purple-400" />;
      default: return <Gift className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const canClaimFree = (tier: BattlePassTier) => {
    // Fix: tier_number must be <= currentTier, AND currentTier must be >= tier_number
    // If currentTier is 0, user hasn't reached any tier yet
    return currentTier >= tier.tier_number && 
           tier.free_reward_type !== 'none' && 
           tier.free_reward_value !== null &&
           !claimedFreeTiers.includes(tier.tier_number);
  };

  const canClaimPremium = (tier: BattlePassTier) => {
    return currentTier >= tier.tier_number && 
           isPremium && 
           tier.premium_reward_type !== 'none' &&
           tier.premium_reward_value !== null &&
           !claimedPremiumTiers.includes(tier.tier_number);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl bg-card border-primary/30 p-4 sm:p-6 max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-pixel text-base sm:text-lg text-primary flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              BATTLE PASS
            </div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs">
              <Clock className="w-3 h-3" />
              <span className="text-muted-foreground">{timeRemaining.days}d {timeRemaining.hours}h</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : !season ? (
          <div className="text-center py-8 text-muted-foreground">
            No active season
          </div>
        ) : (
          <>
            {/* Season Header */}
            <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg p-3 sm:p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-pixel text-xs sm:text-sm text-foreground">{season.name}</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Tier {currentTier} • {currentXP} XP
                  </p>
                </div>
                {isPremium ? (
                  <div className="flex items-center gap-1 px-2 py-1 bg-accent/20 rounded text-accent">
                    <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="font-pixel text-[9px] sm:text-[10px]">PREMIUM</span>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleUpgrade}
                    className="game-button text-[9px] sm:text-[10px] h-7 sm:h-8"
                  >
                    <Crown className="w-3 h-3 mr-1" />
                    UPGRADE ({PREMIUM_COST} 🪙)
                  </Button>
                )}
              </div>
              <Progress value={Math.min(xpProgress, 100)} className="h-2" />
              {nextTier && (
                <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1">
                  Next: {nextTier.xp_required - currentXP} XP to Tier {nextTier.tier_number}
                </p>
              )}
            </div>

            {/* Tiers List */}
            <ScrollArea className="h-[45vh] sm:h-[350px] pr-2">
              <div className="space-y-2">
                {tiers.map((tier) => {
                  const isUnlocked = tier.tier_number <= currentTier;
                  const freeClaimable = canClaimFree(tier);
                  const premiumClaimable = canClaimPremium(tier);
                  const freeClaimed = claimedFreeTiers.includes(tier.tier_number);
                  const premiumClaimed = claimedPremiumTiers.includes(tier.tier_number);

                  return (
                    <div
                      key={tier.id}
                      className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-all ${
                        isUnlocked
                          ? 'bg-card/50 border-primary/30'
                          : 'bg-muted/20 border-border/30 opacity-60'
                      }`}
                    >
                      {/* Tier Number */}
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isUnlocked ? 'bg-primary/20' : 'bg-muted/30'
                      }`}>
                        <span className="font-pixel text-[10px] sm:text-xs">{tier.tier_number}</span>
                      </div>

                      {/* Free Reward */}
                      <div className="flex-1 min-w-0">
                        <div className={`flex items-center gap-2 p-2 rounded border ${
                          tier.free_reward_type === 'none' 
                            ? 'bg-muted/10 border-border/20' 
                            : freeClaimed 
                              ? 'bg-green-500/10 border-green-500/30' 
                              : freeClaimable 
                                ? 'bg-primary/10 border-primary/30' 
                                : 'bg-muted/20 border-border/30'
                        }`}>
                          {tier.free_reward_type === 'none' ? (
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground">—</span>
                          ) : (
                            <>
                              {getRewardIcon(tier.free_reward_type)}
                              <span className="text-[9px] sm:text-[10px] text-foreground flex-1">
                                {tier.free_reward_type === 'coins' ? `${tier.free_reward_value}` : tier.free_reward_value}
                              </span>
                              {freeClaimed ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : freeClaimable ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleClaimReward(tier.tier_number, false)}
                                  className="h-5 px-1.5 text-[8px]"
                                >
                                  CLAIM
                                </Button>
                              ) : !isUnlocked ? (
                                <Lock className="w-3 h-3 text-muted-foreground" />
                              ) : null}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Premium Reward */}
                      <div className="flex-1 min-w-0">
                        <div className={`flex items-center gap-2 p-2 rounded border ${
                          premiumClaimed 
                            ? 'bg-accent/10 border-accent/30' 
                            : premiumClaimable 
                              ? 'bg-accent/20 border-accent/50' 
                              : 'bg-muted/20 border-border/30'
                        }`}>
                          <Crown className="w-3 h-3 text-accent flex-shrink-0" />
                          {getRewardIcon(tier.premium_reward_type)}
                          <span className="text-[9px] sm:text-[10px] text-foreground flex-1">
                            {tier.premium_reward_type === 'coins' ? `${tier.premium_reward_value}` : tier.premium_reward_value}
                          </span>
                          {premiumClaimed ? (
                            <Check className="w-3 h-3 text-accent" />
                          ) : premiumClaimable ? (
                            <Button
                              size="sm"
                              onClick={() => handleClaimReward(tier.tier_number, true)}
                              className="h-5 px-1.5 text-[8px] bg-accent hover:bg-accent/80"
                            >
                              CLAIM
                            </Button>
                          ) : !isPremium ? (
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          ) : !isUnlocked ? (
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {!isLoggedIn && (
              <div className="mt-3 p-2 rounded-lg bg-muted/50 text-center">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-2">
                  Sign in to track progress
                </p>
                <Button size="sm" onClick={onOpenAuth} className="font-pixel text-[9px] h-7">
                  SIGN IN
                </Button>
              </div>
            )}

            <p className="text-[8px] sm:text-[10px] text-muted-foreground text-center mt-2">
              Earn XP by playing games and completing challenges
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
