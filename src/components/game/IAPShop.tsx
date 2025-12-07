import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Coins, Sparkles, Crown, RotateCcw, Star } from 'lucide-react';
import { toast } from 'sonner';
import { COIN_PACKS, PREMIUM_SKINS, purchaseManager } from '@/lib/purchaseManager';
import { supabase } from '@/integrations/supabase/client';

interface IAPShopProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  profileId: string | null;
  currentCoins: number;
  onPurchaseComplete: () => void;
  onOpenAuth: () => void;
}

export function IAPShop({
  isOpen,
  onClose,
  isLoggedIn,
  profileId,
  currentCoins,
  onPurchaseComplete,
  onOpenAuth,
}: IAPShopProps) {
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'coins' | 'skins'>('coins');

  const handlePurchaseCoins = async (packId: string, coins: number) => {
    if (!isLoggedIn || !profileId) {
      onOpenAuth();
      return;
    }

    setPurchasing(packId);

    try {
      const result = await purchaseManager.purchaseProduct(packId);

      if (result.success) {
        // Add coins to user's account
        const { error } = await supabase
          .from('profiles')
          .update({ coins: currentCoins + coins })
          .eq('id', profileId);

        if (!error) {
          toast.success(`🎉 You received ${coins} coins!`);
          onPurchaseComplete();
        } else {
          toast.error('Failed to add coins. Please contact support.');
        }
      } else {
        if (result.error !== 'Purchase cancelled') {
          toast.error(result.error || 'Purchase failed');
        }
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setPurchasing(null);
    }
  };

  const handlePurchaseSkin = async (skinId: string, productId: string) => {
    if (!isLoggedIn || !profileId) {
      onOpenAuth();
      return;
    }

    setPurchasing(skinId);

    try {
      const result = await purchaseManager.purchaseProduct(productId);

      if (result.success) {
        // Add skin to user's owned skins
        const { error } = await supabase
          .from('owned_skins')
          .insert({ profile_id: profileId, skin_id: skinId });

        if (!error) {
          toast.success('🎨 Skin unlocked!');
          onPurchaseComplete();
        } else {
          toast.error('Failed to unlock skin. Please contact support.');
        }
      } else {
        if (result.error !== 'Purchase cancelled') {
          toast.error(result.error || 'Purchase failed');
        }
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestorePurchases = async () => {
    setPurchasing('restore');
    const result = await purchaseManager.restorePurchases();
    setPurchasing(null);

    if (result.success) {
      toast.success('Purchases restored!');
      onPurchaseComplete();
    } else {
      toast.error(result.error || 'Failed to restore purchases');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-pixel text-lg text-primary flex items-center gap-2">
            <Crown className="w-5 h-5 text-accent" />
            PREMIUM STORE
          </DialogTitle>
        </DialogHeader>

        {/* Tab Buttons */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === 'coins' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('coins')}
            className={`flex-1 text-xs ${activeTab === 'coins' ? 'game-button' : 'border-primary/50'}`}
          >
            <Coins className="w-3 h-3 mr-1 text-accent" />
            COINS
          </Button>
          <Button
            variant={activeTab === 'skins' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('skins')}
            className={`flex-1 text-xs ${activeTab === 'skins' ? 'game-button' : 'border-primary/50'}`}
          >
            <Sparkles className="w-3 h-3 mr-1 text-secondary" />
            SKINS
          </Button>
        </div>

        <ScrollArea className="h-[350px] pr-4">
          {activeTab === 'coins' ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground text-center mb-4">
                Current balance: <span className="text-accent font-pixel">{currentCoins} 🪙</span>
              </p>

              {COIN_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                    pack.popular
                      ? 'bg-accent/10 border-accent/50 ring-1 ring-accent/30'
                      : 'bg-card/50 border-border hover:border-primary/50'
                  }`}
                >
                  {pack.popular && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-accent rounded text-[10px] font-pixel text-accent-foreground">
                      BEST VALUE
                    </div>
                  )}

                  <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Coins className="w-6 h-6 text-accent" />
                  </div>

                  <div className="flex-1">
                    <p className="font-pixel text-sm text-foreground">{pack.name}</p>
                    <p className="text-xs text-accent">{pack.coins.toLocaleString()} coins</p>
                  </div>

                  <Button
                    onClick={() => handlePurchaseCoins(pack.productId, pack.coins)}
                    disabled={purchasing !== null}
                    className="game-button text-xs px-4"
                  >
                    {purchasing === pack.id ? '...' : pack.price}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {PREMIUM_SKINS.map((skin) => (
                <div
                  key={skin.id}
                  className="flex items-center gap-3 p-4 rounded-lg border bg-card/50 border-border hover:border-secondary/50 transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center">
                    <Star className="w-6 h-6 text-secondary" />
                  </div>

                  <div className="flex-1">
                    <p className="font-pixel text-sm text-foreground">{skin.name}</p>
                    <p className="text-xs text-muted-foreground">{skin.description}</p>
                  </div>

                  <Button
                    onClick={() => handlePurchaseSkin(skin.id, skin.productId)}
                    disabled={purchasing !== null}
                    variant="outline"
                    className="border-secondary/50 text-xs px-4"
                  >
                    {purchasing === skin.id ? '...' : skin.price}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Restore Purchases */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRestorePurchases}
          disabled={purchasing !== null}
          className="w-full text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-3 h-3 mr-2" />
          Restore Purchases
        </Button>

        {!purchaseManager.isNativePlatform() && (
          <p className="text-[10px] text-muted-foreground text-center">
            In-app purchases available in mobile app only
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
