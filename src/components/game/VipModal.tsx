import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Crown, Check, Sparkles, Zap, Shield, Coins, Ban, Star, Loader2, Settings, Gift, BarChart3, Shirt } from 'lucide-react';
import { VipStatsCard } from './VipStatsCard';
import { VipSkinsSection } from './VipSkinsSection';
import { VipStats } from '@/hooks/useVipStats';
import { CharacterSkin } from '@/types/game';

interface VipModalProps {
  isOpen: boolean;
  onClose: () => void;
  isVip: boolean;
  subscriptionEnd: string | null;
  loading: boolean;
  checkoutLoading: boolean;
  isLoggedIn: boolean;
  canClaimDailyBonus?: boolean;
  dailyBonusDay?: number;
  dailyBonusCoins?: number;
  allDailyBonuses?: number[];
  onClaimDailyBonus?: () => Promise<{ error: Error | null; coins: number }>;
  vipStats?: VipStats | null;
  currentTier?: { name: string; icon: string; bonusMultiplier: number };
  nextTier?: { name: string; monthsRequired: number; bonusMultiplier: number } | null;
  monthsUntilNextTier?: number | null;
  vipSkins?: CharacterSkin[];
  ownedSkinIds?: string[];
  selectedSkin?: string;
  onSelectSkin?: (skinId: string) => void;
  onStartCheckout: () => void;
  onOpenPortal: () => void;
  onOpenAuth: () => void;
}

type VipTab = 'benefits' | 'stats' | 'skins';

const VIP_BENEFITS = [
  { icon: Ban, label: 'Ad-Free Gameplay', description: 'No interruptions, ever!' },
  { icon: Coins, label: '2x Coin Bonus', description: 'Double coins from all sources' },
  { icon: Sparkles, label: '3 Exclusive Skins', description: 'Diamond Elite, Phoenix Flame, Shadow King' },
  { icon: Shield, label: 'Extended Shield', description: '+50% shield duration' },
  { icon: Zap, label: 'Speed Boost', description: 'Up to +30% movement speed' },
  { icon: Star, label: 'VIP Badge', description: 'Show off on leaderboards' },
  { icon: Gift, label: 'Daily VIP Bonus', description: 'Up to 500 coins daily!' },
];

export function VipModal({
  isOpen,
  onClose,
  isVip,
  subscriptionEnd,
  loading,
  checkoutLoading,
  isLoggedIn,
  canClaimDailyBonus = false,
  dailyBonusDay = 1,
  dailyBonusCoins = 100,
  allDailyBonuses = [100, 150, 200, 250, 300, 400, 500],
  onClaimDailyBonus,
  vipStats = null,
  currentTier = { name: 'Bronze', icon: '🥉', bonusMultiplier: 1 },
  nextTier = null,
  monthsUntilNextTier = null,
  vipSkins = [],
  ownedSkinIds = [],
  selectedSkin = 'default',
  onSelectSkin,
  onStartCheckout,
  onOpenPortal,
  onOpenAuth,
}: VipModalProps) {
  const [activeTab, setActiveTab] = useState<VipTab>('benefits');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleClaimBonus = async () => {
    if (onClaimDailyBonus) {
      await onClaimDailyBonus();
    }
  };

  const handleSelectSkin = (skinId: string) => {
    if (onSelectSkin) {
      onSelectSkin(skinId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md bg-card border-primary/30 p-4 sm:p-6 max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="font-pixel text-base sm:text-lg text-accent flex items-center gap-2">
            <Crown className="w-5 h-5" />
            VIP MEMBERSHIP
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : isVip ? (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {/* Tab Navigation */}
              <div className="flex gap-1 p-1 rounded-lg bg-muted/30">
                <Button
                  variant={activeTab === 'benefits' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('benefits')}
                  className="flex-1 font-pixel text-[10px] gap-1"
                >
                  <Gift className="w-3 h-3" />
                  BENEFITS
                </Button>
                <Button
                  variant={activeTab === 'stats' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('stats')}
                  className="flex-1 font-pixel text-[10px] gap-1"
                >
                  <BarChart3 className="w-3 h-3" />
                  STATS
                </Button>
                <Button
                  variant={activeTab === 'skins' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('skins')}
                  className="flex-1 font-pixel text-[10px] gap-1"
                >
                  <Shirt className="w-3 h-3" />
                  SKINS
                </Button>
              </div>

              {/* VIP Status Banner */}
              <div className="p-3 rounded-lg bg-gradient-to-br from-accent/20 to-yellow-500/20 border border-accent/50 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-xl">{currentTier.icon}</span>
                  <span className="font-pixel text-sm text-accent">{currentTier.name} VIP</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Renews on {subscriptionEnd ? formatDate(subscriptionEnd) : 'N/A'}
                </p>
              </div>

              {/* Benefits Tab */}
              {activeTab === 'benefits' && (
                <>
                  {/* VIP Daily Bonus Section */}
                  <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Gift className="w-5 h-5 text-green-400" />
                      <span className="font-pixel text-xs text-green-400">DAILY VIP BONUS</span>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 mb-3">
                      {allDailyBonuses.map((coins, i) => {
                        const day = i + 1;
                        const isPast = day < dailyBonusDay;
                        const isCurrent = day === dailyBonusDay;
                        
                        return (
                          <div
                            key={i}
                            className={`p-1.5 rounded text-center text-[8px] ${
                              isCurrent ? 'bg-green-500/30 border border-green-400 ring-2 ring-green-400/50' :
                              isPast ? 'bg-muted/50 opacity-50' :
                              'bg-muted/30'
                            }`}
                          >
                            <p className="font-pixel text-[8px] text-muted-foreground">D{day}</p>
                            <p className={`font-pixel ${isCurrent ? 'text-green-400' : 'text-foreground'}`}>
                              {coins}
                            </p>
                            {isPast && <Check className="w-2.5 h-2.5 mx-auto text-green-400" />}
                          </div>
                        );
                      })}
                    </div>
                    
                    <Button
                      onClick={handleClaimBonus}
                      disabled={!canClaimDailyBonus}
                      className={`w-full font-pixel text-xs ${
                        canClaimDailyBonus 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' 
                          : 'bg-muted'
                      }`}
                    >
                      {canClaimDailyBonus ? (
                        <>
                          <Gift className="w-4 h-4 mr-2" />
                          CLAIM {dailyBonusCoins} COINS
                        </>
                      ) : (
                        'CLAIMED TODAY ✓'
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-pixel text-xs text-muted-foreground">YOUR BENEFITS</h3>
                    {VIP_BENEFITS.map((benefit, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded bg-muted/30">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                          <benefit.icon className="w-4 h-4 text-accent" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-foreground">{benefit.label}</p>
                          <p className="text-[10px] text-muted-foreground">{benefit.description}</p>
                        </div>
                        <Check className="w-4 h-4 text-green-400" />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Stats Tab */}
              {activeTab === 'stats' && (
                <VipStatsCard
                  stats={vipStats}
                  currentTier={currentTier}
                  nextTier={nextTier}
                  monthsUntilNextTier={monthsUntilNextTier}
                />
              )}

              {/* Skins Tab */}
              {activeTab === 'skins' && (
                <VipSkinsSection
                  vipSkins={vipSkins}
                  ownedSkinIds={ownedSkinIds}
                  selectedSkin={selectedSkin}
                  isVip={isVip}
                  onSelectSkin={handleSelectSkin}
                  onOpenShop={() => {}}
                />
              )}

              <Button 
                onClick={onOpenPortal} 
                variant="outline" 
                className="w-full font-pixel text-xs gap-2"
              >
                <Settings className="w-4 h-4" />
                MANAGE SUBSCRIPTION
              </Button>
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              <div className="relative p-4 rounded-lg bg-gradient-to-br from-purple-500/20 via-accent/20 to-yellow-500/20 border border-accent/30 overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-accent/10 rounded-full blur-2xl" />
                <div className="relative text-center">
                  <Crown className="w-12 h-12 text-accent mx-auto mb-2" />
                  <h3 className="font-pixel text-lg text-foreground mb-1">Become VIP</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Unlock exclusive rewards and dominate the game!
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-pixel text-2xl text-accent">$4.99</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-pixel text-xs text-muted-foreground">VIP BENEFITS</h3>
                {VIP_BENEFITS.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded bg-muted/30 border border-border/30">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <benefit.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">{benefit.label}</p>
                      <p className="text-[10px] text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {isLoggedIn ? (
                <Button 
                  onClick={onStartCheckout} 
                  className="w-full font-pixel text-sm gap-2 bg-gradient-to-r from-accent to-yellow-500 hover:from-accent/90 hover:to-yellow-500/90"
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Crown className="w-4 h-4" />
                  )}
                  {checkoutLoading ? 'LOADING...' : 'SUBSCRIBE NOW'}
                </Button>
              ) : (
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    Sign in to subscribe to VIP
                  </p>
                  <Button size="sm" onClick={onOpenAuth} className="font-pixel text-xs">
                    SIGN IN
                  </Button>
                </div>
              )}

              <p className="text-[9px] text-muted-foreground text-center">
                Cancel anytime. Subscription auto-renews monthly.
              </p>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
