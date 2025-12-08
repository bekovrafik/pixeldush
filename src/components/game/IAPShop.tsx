import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Coins, Sparkles, Crown, RotateCcw, Flame, Zap, TrendingUp, Check } from 'lucide-react';
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
  ownedSkinIds?: string[];
}

const BadgeIcon = ({ badge }: { badge: string }) => {
  switch (badge) {
    case 'popular':
      return <Flame className="w-2.5 h-2.5" />;
    case 'best_value':
      return <TrendingUp className="w-2.5 h-2.5" />;
    case 'new':
      return <Zap className="w-2.5 h-2.5" />;
    default:
      return null;
  }
};

const getBadgeLabel = (badge: string) => {
  switch (badge) {
    case 'popular':
      return 'POPULAR';
    case 'best_value':
      return 'BEST VALUE';
    case 'new':
      return 'NEW';
    default:
      return '';
  }
};

const getBadgeColor = (badge: string) => {
  switch (badge) {
    case 'popular':
      return 'bg-orange-500';
    case 'best_value':
      return 'bg-emerald-500';
    case 'new':
      return 'bg-blue-500';
    default:
      return 'bg-primary';
  }
};

// Sparkle component for animated effects
const Sparkle = ({ delay, size, left, top }: { delay: number; size: number; left: string; top: string }) => (
  <div 
    className="absolute animate-pulse"
    style={{ 
      left, 
      top, 
      animationDelay: `${delay}ms`,
      animationDuration: '1.5s'
    }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-white/80">
      <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
    </svg>
  </div>
);

export function IAPShop({
  isOpen,
  onClose,
  isLoggedIn,
  profileId,
  currentCoins,
  onPurchaseComplete,
  onOpenAuth,
  ownedSkinIds = [],
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

  const isSkinOwned = (skinId: string) => ownedSkinIds.includes(skinId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md bg-card border-primary/30 p-4 sm:p-6 max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="font-pixel text-base sm:text-lg text-primary flex items-center gap-2">
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
            PREMIUM STORE
          </DialogTitle>
        </DialogHeader>

        {/* Tab Buttons */}
        <div className="flex gap-2 mb-3 sm:mb-4">
          <Button
            variant={activeTab === 'coins' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('coins')}
            className={`flex-1 text-[10px] sm:text-xs h-8 sm:h-9 ${activeTab === 'coins' ? 'game-button' : 'border-primary/50'}`}
          >
            <Coins className="w-3 h-3 mr-1 text-accent" />
            COINS
          </Button>
          <Button
            variant={activeTab === 'skins' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('skins')}
            className={`flex-1 text-[10px] sm:text-xs h-8 sm:h-9 ${activeTab === 'skins' ? 'game-button' : 'border-primary/50'}`}
          >
            <Sparkles className="w-3 h-3 mr-1 text-secondary" />
            SKINS
          </Button>
        </div>

        <ScrollArea className="h-[50vh] sm:h-[350px] pr-2 sm:pr-4">
          {activeTab === 'coins' ? (
            <div className="space-y-2 sm:space-y-3">
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center mb-2 sm:mb-4">
                Current balance: <span className="text-accent font-pixel">{currentCoins} 🪙</span>
              </p>

              {COIN_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className={`relative flex items-center gap-2 sm:gap-3 p-2 sm:p-4 rounded-lg border transition-all ${
                    pack.popular
                      ? 'bg-accent/10 border-accent/50 ring-1 ring-accent/30'
                      : 'bg-card/50 border-border hover:border-primary/50'
                  }`}
                >
                  {pack.popular && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 sm:px-2 py-0.5 bg-accent rounded text-[8px] sm:text-[10px] font-pixel text-accent-foreground">
                      BEST VALUE
                    </div>
                  )}

                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-pixel text-[10px] sm:text-sm text-foreground truncate">{pack.name}</p>
                    <p className="text-[10px] sm:text-xs text-accent">{pack.coins.toLocaleString()} coins</p>
                  </div>

                  <Button
                    onClick={() => handlePurchaseCoins(pack.productId, pack.coins)}
                    disabled={purchasing !== null}
                    className="game-button text-[10px] sm:text-xs px-2 sm:px-4 h-7 sm:h-9 flex-shrink-0"
                  >
                    {purchasing === pack.id ? '...' : pack.price}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {PREMIUM_SKINS.map((skin) => {
                const owned = isSkinOwned(skin.id);
                return (
                  <div
                    key={skin.id}
                    className={`relative flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border transition-all group ${
                      owned
                        ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/20'
                        : skin.badge
                        ? 'bg-secondary/5 border-secondary/40 ring-1 ring-secondary/20 hover:ring-secondary/40'
                        : 'bg-card/50 border-border hover:border-secondary/50'
                    }`}
                  >
                    {/* Badge - Show OWNED or promotional badge */}
                    {owned ? (
                      <div className="absolute -top-2 left-3 px-1.5 sm:px-2 py-0.5 bg-primary rounded text-[8px] sm:text-[10px] font-pixel text-primary-foreground flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" />
                        OWNED
                      </div>
                    ) : skin.badge && (
                      <div className={`absolute -top-2 left-3 px-1.5 sm:px-2 py-0.5 ${getBadgeColor(skin.badge)} rounded text-[8px] sm:text-[10px] font-pixel text-white flex items-center gap-1`}>
                        <BadgeIcon badge={skin.badge} />
                        {getBadgeLabel(skin.badge)}
                      </div>
                    )}

                    {/* Skin Preview with animated effects */}
                    <div 
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${skin.previewColors.join(', ')})`,
                        boxShadow: owned 
                          ? `0 0 15px ${skin.previewColors[0]}50, 0 0 30px ${skin.previewColors[0]}30`
                          : `0 0 10px ${skin.previewColors[0]}30`,
                      }}
                    >
                      {/* Animated glow ring */}
                      <div 
                        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: `conic-gradient(from 0deg, transparent, ${skin.previewColors[0]}, transparent, ${skin.previewColors[1]}, transparent)`,
                          animation: 'spin 3s linear infinite',
                        }}
                      />
                      <div className="absolute inset-[2px] rounded-lg" style={{ background: `linear-gradient(135deg, ${skin.previewColors.join(', ')})` }} />
                      
                      {/* Sparkle effects */}
                      <Sparkle delay={0} size={6} left="10%" top="15%" />
                      <Sparkle delay={300} size={4} left="75%" top="20%" />
                      <Sparkle delay={600} size={5} left="20%" top="70%" />
                      <Sparkle delay={900} size={4} left="80%" top="75%" />
                      
                      {/* Character silhouette */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-10 sm:w-10 sm:h-12 bg-black/20 rounded-t-full rounded-b-lg backdrop-blur-sm" />
                      </div>
                      
                      {/* Emoji overlay */}
                      <span className="text-xl sm:text-2xl relative z-10 drop-shadow-lg">{skin.iconEmoji}</span>
                      
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                      
                      {/* Moving shine animation */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                      />
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                      <p className="font-pixel text-[10px] sm:text-sm text-foreground truncate">{skin.name}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 mt-0.5">{skin.description}</p>
                      
                      {/* Color swatches with glow */}
                      <div className="flex gap-1.5 mt-1.5">
                        {skin.previewColors.map((color, idx) => (
                          <div 
                            key={idx}
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-white/30 transition-transform hover:scale-110"
                            style={{ 
                              backgroundColor: color,
                              boxShadow: `0 0 8px ${color}60`
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {owned ? (
                      <div className="flex items-center gap-1 px-2 sm:px-3 h-7 sm:h-9 rounded-md bg-primary/20 text-primary text-[10px] sm:text-xs font-pixel mt-1">
                        <Check className="w-3 h-3" />
                        OWNED
                      </div>
                    ) : (
                      <Button
                        onClick={() => handlePurchaseSkin(skin.id, skin.productId)}
                        disabled={purchasing !== null}
                        variant="outline"
                        className="border-secondary/50 text-[10px] sm:text-xs px-2 sm:px-4 h-7 sm:h-9 flex-shrink-0 mt-1 hover:bg-secondary/20 hover:border-secondary transition-colors"
                      >
                        {purchasing === skin.id ? '...' : skin.price}
                      </Button>
                    )}
                  </div>
                );
              })}
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
