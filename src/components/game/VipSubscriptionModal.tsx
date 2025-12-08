import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Crown, Check, Sparkles, Zap, Shield, Coins, Ban, Star, Loader2, Gift, Calendar, ExternalLink } from 'lucide-react';
import { SUBSCRIPTIONS, purchaseManager } from '@/lib/purchaseManager';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

interface VipSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  onOpenAuth: () => void;
  onPurchaseComplete?: () => void;
}

const VIP_BENEFITS = [
  { icon: Ban, label: 'Ad-Free Gameplay', description: 'No interruptions, ever!' },
  { icon: Coins, label: '2x Coin Bonus', description: 'Double coins from all sources' },
  { icon: Sparkles, label: '3 Exclusive Skins', description: 'Diamond Elite, Phoenix Flame, Shadow King' },
  { icon: Shield, label: 'Extended Shield', description: '+50% shield duration' },
  { icon: Zap, label: 'Speed Boost', description: 'Up to +30% movement speed' },
  { icon: Star, label: 'VIP Badge', description: 'Show off on leaderboards' },
  { icon: Gift, label: 'Daily VIP Bonus', description: 'Up to 500 coins daily!' },
];

export function VipSubscriptionModal({
  isOpen,
  onClose,
  isLoggedIn,
  onOpenAuth,
  onPurchaseComplete,
}: VipSubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [purchasing, setPurchasing] = useState(false);

  const monthlyPlan = SUBSCRIPTIONS.find(s => s.period === 'monthly');
  const yearlyPlan = SUBSCRIPTIONS.find(s => s.period === 'yearly');
  const isNative = Capacitor.isNativePlatform();

  const handlePurchase = async () => {
    if (!isLoggedIn) {
      onOpenAuth();
      return;
    }

    setPurchasing(true);
    
    try {
      const subscription = selectedPlan === 'monthly' ? monthlyPlan : yearlyPlan;
      if (!subscription) {
        toast.error('Subscription plan not found');
        return;
      }

      const result = await purchaseManager.purchaseSubscription(subscription.productId);
      
      if (result.success) {
        if (isNative) {
          toast.success('🎉 Welcome to VIP! Enjoy your benefits!');
          onPurchaseComplete?.();
          onClose();
        } else {
          // For web, Stripe opens in new tab - show info toast
          toast.info('Checkout opened in new tab. Complete your purchase there.', {
            duration: 5000,
          });
        }
      } else if (result.error) {
        if (result.error !== 'Purchase cancelled') {
          toast.error(result.error);
        }
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to process purchase. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const yearlySavings = monthlyPlan && yearlyPlan ? 
    Math.round((parseFloat(monthlyPlan.price.replace(/[^0-9.]/g, '')) * 12 - parseFloat(yearlyPlan.price.replace(/[^0-9.]/g, ''))) / (parseFloat(monthlyPlan.price.replace(/[^0-9.]/g, '')) * 12) * 100) : 
    40;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md bg-card border-accent/30 p-4 sm:p-6 max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-pixel text-base sm:text-lg text-accent flex items-center gap-2">
            <Crown className="w-5 h-5" />
            VIP SUBSCRIPTION
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-2">
          <div className="space-y-4">
            {/* Hero Section */}
            <div className="relative p-4 rounded-lg bg-gradient-to-br from-purple-500/20 via-accent/20 to-yellow-500/20 border border-accent/30 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-accent/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl" />
              <div className="relative text-center">
                <Crown className="w-12 h-12 text-accent mx-auto mb-2 animate-pulse" />
                <h3 className="font-pixel text-lg text-foreground mb-1">Become VIP</h3>
                <p className="text-sm text-muted-foreground">
                  Unlock exclusive rewards and dominate!
                </p>
              </div>
            </div>

            {/* Plan Selection */}
            <div className="space-y-2">
              <h3 className="font-pixel text-xs text-muted-foreground">CHOOSE YOUR PLAN</h3>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Monthly Plan */}
                <button
                  onClick={() => setSelectedPlan('monthly')}
                  className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                    selectedPlan === 'monthly'
                      ? 'border-accent bg-accent/10'
                      : 'border-border/50 bg-muted/20 hover:border-border'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-pixel text-[10px] text-muted-foreground">MONTHLY</span>
                  </div>
                  <p className="font-pixel text-lg text-foreground">$4.99</p>
                  <p className="text-[10px] text-muted-foreground">per month</p>
                  {selectedPlan === 'monthly' && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-accent" />
                    </div>
                  )}
                </button>

                {/* Yearly Plan */}
                <button
                  onClick={() => setSelectedPlan('yearly')}
                  className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                    selectedPlan === 'yearly'
                      ? 'border-accent bg-accent/10'
                      : 'border-border/50 bg-muted/20 hover:border-border'
                  }`}
                >
                  {/* Best Value Badge */}
                  <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 rounded text-[8px] font-pixel text-white">
                    SAVE {yearlySavings}%
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-pixel text-[10px] text-muted-foreground">YEARLY</span>
                  </div>
                  <p className="font-pixel text-lg text-foreground">$29.99</p>
                  <p className="text-[10px] text-muted-foreground">per year</p>
                  <p className="text-[9px] text-green-400 mt-1">+ 5000 bonus coins!</p>
                  {selectedPlan === 'yearly' && (
                    <div className="absolute top-2 right-2 mt-4">
                      <Check className="w-4 h-4 text-accent" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Benefits List */}
            <div className="space-y-2">
              <h3 className="font-pixel text-xs text-muted-foreground">VIP BENEFITS</h3>
              {VIP_BENEFITS.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded bg-muted/30 border border-border/30">
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

            {/* Yearly Exclusive Benefits */}
            {selectedPlan === 'yearly' && (
              <div className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
                <h4 className="font-pixel text-xs text-green-400 mb-2">YEARLY EXCLUSIVE</h4>
                <ul className="space-y-1 text-[10px] text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-400" />
                    5000 bonus coins on purchase
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-400" />
                    Exclusive yearly badge
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-400" />
                    Save {yearlySavings}% compared to monthly
                  </li>
                </ul>
              </div>
            )}

            {/* Purchase Button */}
            {isLoggedIn ? (
              <Button
                onClick={handlePurchase}
                disabled={purchasing}
                className="w-full font-pixel text-sm gap-2 bg-gradient-to-r from-accent to-yellow-500 hover:from-accent/90 hover:to-yellow-500/90 h-12"
              >
                {purchasing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isNative ? (
                  <Crown className="w-4 h-4" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                {purchasing ? 'PROCESSING...' : `SUBSCRIBE ${selectedPlan.toUpperCase()}`}
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
              {isNative 
                ? 'Cancel anytime. Subscription auto-renews. Managed through Google Play / App Store.'
                : 'Cancel anytime. Subscription auto-renews. Managed through Stripe.'}
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
