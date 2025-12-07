import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Crown, Check, Sparkles, Zap, Shield, Coins, Ban, Star, Loader2, Settings } from 'lucide-react';

interface VipModalProps {
  isOpen: boolean;
  onClose: () => void;
  isVip: boolean;
  subscriptionEnd: string | null;
  loading: boolean;
  checkoutLoading: boolean;
  isLoggedIn: boolean;
  onStartCheckout: () => void;
  onOpenPortal: () => void;
  onOpenAuth: () => void;
}

const VIP_BENEFITS = [
  { icon: Ban, label: 'Ad-Free Gameplay', description: 'No interruptions, ever!' },
  { icon: Coins, label: '2x Coin Bonus', description: 'Double coins from all sources' },
  { icon: Sparkles, label: '3 Exclusive Skins', description: 'Diamond Elite, Phoenix Flame, Shadow King' },
  { icon: Shield, label: 'Extended Shield', description: '+50% shield duration' },
  { icon: Zap, label: 'Speed Boost', description: 'Up to +30% movement speed' },
  { icon: Star, label: 'VIP Badge', description: 'Show off on leaderboards' },
];

export function VipModal({
  isOpen,
  onClose,
  isVip,
  subscriptionEnd,
  loading,
  checkoutLoading,
  isLoggedIn,
  onStartCheckout,
  onOpenPortal,
  onOpenAuth,
}: VipModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
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
          // VIP Active State
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-accent/20 to-yellow-500/20 border border-accent/50 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="w-6 h-6 text-accent" />
                <span className="font-pixel text-lg text-accent">VIP ACTIVE</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your subscription renews on {subscriptionEnd ? formatDate(subscriptionEnd) : 'N/A'}
              </p>
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

            <Button 
              onClick={onOpenPortal} 
              variant="outline" 
              className="w-full font-pixel text-xs gap-2"
            >
              <Settings className="w-4 h-4" />
              MANAGE SUBSCRIPTION
            </Button>
          </div>
        ) : (
          // Non-VIP State
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {/* Hero section */}
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

              {/* Benefits list */}
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

              {/* CTA */}
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
