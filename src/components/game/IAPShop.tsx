import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Coins, Sparkles, Crown, RotateCcw, Flame, Zap, TrendingUp, Check, Eye, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { COIN_PACKS, PREMIUM_SKINS, purchaseManager, PremiumSkin, CoinPack } from '@/lib/purchaseManager';
import { supabase } from '@/integrations/supabase/client';
import { audioManager } from '@/lib/audioManager';
import { PixelCharacter, SKIN_COLORS } from './PixelCharacter';

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

// Confirmation Modal Component - rendered via Portal
interface ConfirmPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  price: string;
  isLoading: boolean;
}

function ConfirmPurchaseModal({ isOpen, onClose, onConfirm, title, description, price, isLoading }: ConfirmPurchaseModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-fade-in pointer-events-auto" onClick={handleBackdropClick}>
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative z-10 bg-card border border-primary/30 rounded-xl p-6 max-w-sm w-[90%] mx-4 animate-scale-in pointer-events-auto" onClick={handleContentClick}>
        <h3 className="font-pixel text-lg text-primary mb-4">Confirm Purchase</h3>
        <div className="space-y-3 mb-6">
          <p className="font-pixel text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="flex items-center gap-2 text-accent font-bold">
            <Coins className="w-5 h-5" />
            <span>{price}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1 border-muted"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            className="flex-1 game-button"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Confirm'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Skin Preview Modal - rendered via Portal with actual PixelCharacter
interface SkinPreviewModalProps {
  skin: PremiumSkin | null;
  onClose: () => void;
  onPurchase: () => void;
  isLoading: boolean;
  isOwned: boolean;
}

function SkinPreviewModal({ skin, onClose, onPurchase, isLoading, isOwned }: SkinPreviewModalProps) {
  if (!skin) return null;

  const skinColors = SKIN_COLORS[skin.skinId] || SKIN_COLORS.default;

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-fade-in pointer-events-auto" onClick={handleBackdropClick}>
      <div className="absolute inset-0 bg-black/90" />
      <div className="relative z-10 bg-gradient-to-b from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-[90%] mx-4 animate-scale-in pointer-events-auto" onClick={handleContentClick}>
        {/* Close Button */}
        <button 
          onClick={() => { audioManager.playClick(); onClose(); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <h3 className="font-pixel text-lg text-primary">TRY ON PREVIEW</h3>
          {skin.badge && (
            <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-pixel text-white ${getBadgeColor(skin.badge)}`}>
              {getBadgeLabel(skin.badge)}
            </span>
          )}
        </div>

        {/* Character Preview - Actual PixelCharacter */}
        <div 
          className="relative mx-auto w-40 h-40 rounded-xl mb-4 flex items-center justify-center overflow-hidden"
          style={{ 
            background: `radial-gradient(circle at center, ${skinColors.body}30 0%, transparent 70%)`,
            boxShadow: `0 0 40px ${skinColors.body}40`
          }}
        >
          {/* Animated Background */}
          <div className="absolute inset-0 opacity-30">
            <div 
              className="absolute inset-0 animate-pulse"
              style={{ background: `linear-gradient(135deg, ${skinColors.body}20, transparent, ${skinColors.accent}20)` }}
            />
          </div>
          
          {/* Running Character */}
          <PixelCharacter
            skinId={skin.skinId}
            animation="running"
            size={80}
            showGlow={true}
            showTrail={true}
          />
        </div>

        {/* Skin Name & Description */}
        <div className="text-center mb-4">
          <h4 className="font-pixel text-foreground">{skin.name}</h4>
          <p className="text-sm text-muted-foreground mt-1">{skin.description}</p>
        </div>

        {/* Color Palette */}
        <div className="flex justify-center gap-2 mb-4">
          <div 
            className="w-6 h-6 rounded-full border-2 border-white/30"
            style={{ backgroundColor: skinColors.body, boxShadow: `0 0 12px ${skinColors.body}80` }}
          />
          <div 
            className="w-6 h-6 rounded-full border-2 border-white/30"
            style={{ backgroundColor: skinColors.accent, boxShadow: `0 0 12px ${skinColors.accent}80` }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => { audioManager.playClick(); onClose(); }}
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Close
          </Button>
          {isOwned ? (
            <div className="flex-1 flex items-center justify-center gap-1 px-3 h-10 rounded-md bg-primary/20 text-primary text-xs font-pixel">
              <Check className="w-4 h-4" />
              OWNED
            </div>
          ) : (
            <Button 
              onClick={onPurchase}
              disabled={isLoading}
              className="flex-1 game-button"
            >
              {isLoading ? 'Processing...' : `Buy ${skin.price}`}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

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
  const [previewSkin, setPreviewSkin] = useState<PremiumSkin | null>(null);
  const [confirmPurchase, setConfirmPurchase] = useState<{ type: 'coin' | 'skin'; item: CoinPack | PremiumSkin } | null>(null);

  const handleHover = useCallback(() => {
    audioManager.playHover();
  }, []);

  // Coin purchase - show confirmation first
  const handlePurchaseCoins = (pack: CoinPack) => {
    audioManager.playClick();
    
    if (!isLoggedIn || !profileId) {
      onOpenAuth();
      return;
    }

    setConfirmPurchase({ type: 'coin', item: pack });
  };

  const handleConfirmCoinPurchase = async () => {
    if (!confirmPurchase || confirmPurchase.type !== 'coin' || !profileId) return;
    
    const pack = confirmPurchase.item as CoinPack;
    setPurchasing(pack.id);
    setConfirmPurchase(null);

    try {
      const result = await purchaseManager.purchaseProduct(pack.productId);

      if (result.success) {
        const { error } = await supabase
          .from('profiles')
          .update({ coins: currentCoins + pack.coins })
          .eq('id', profileId);

        if (!error) {
          audioManager.playPurchase();
          toast.success(`🎉 You received ${pack.coins.toLocaleString()} coins!`);
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

  // Skin purchase - show confirmation first
  const handlePurchaseSkin = (skin: PremiumSkin) => {
    audioManager.playClick();
    
    if (!isLoggedIn || !profileId) {
      onOpenAuth();
      return;
    }

    setConfirmPurchase({ type: 'skin', item: skin });
  };

  const handleConfirmSkinPurchase = async () => {
    if (!confirmPurchase || confirmPurchase.type !== 'skin' || !profileId) return;
    
    const skin = confirmPurchase.item as PremiumSkin;
    setPurchasing(skin.id);
    setConfirmPurchase(null);
    setPreviewSkin(null);

    try {
      const result = await purchaseManager.purchaseProduct(skin.productId);

      if (result.success) {
        // Use the skinId (database ID) not the RevenueCat product ID
        const { error } = await supabase
          .from('owned_skins')
          .insert({ profile_id: profileId, skin_id: skin.skinId });

        if (!error) {
          audioManager.playPurchase();
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
    audioManager.playClick();
    setPurchasing('restore');
    const result = await purchaseManager.restorePurchases();
    setPurchasing(null);

    if (result.success) {
      audioManager.playPurchase();
      toast.success('Purchases restored!');
      onPurchaseComplete();
    } else {
      toast.error(result.error || 'Failed to restore purchases');
    }
  };

  const handleTryOn = (skin: PremiumSkin) => {
    audioManager.playSelect();
    setPreviewSkin(skin);
  };

  const handlePreviewPurchase = () => {
    if (previewSkin) {
      handlePurchaseSkin(previewSkin);
    }
  };

  const isSkinOwned = (skinId: string) => ownedSkinIds.includes(skinId);

  return (
    <>
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
                    onMouseEnter={handleHover}
                    className={`relative flex items-center gap-2 sm:gap-3 p-2 sm:p-4 rounded-lg border transition-all cursor-pointer ${
                      pack.popular
                        ? 'bg-accent/10 border-accent/50 ring-1 ring-accent/30 hover:ring-accent/50'
                        : 'bg-card/50 border-border hover:border-primary/50 hover:bg-card/80'
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
                      onClick={() => handlePurchaseCoins(pack)}
                      onMouseEnter={handleHover}
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
                  const owned = isSkinOwned(skin.skinId);
                  const skinColors = SKIN_COLORS[skin.skinId] || SKIN_COLORS.default;
                  
                  return (
                    <div
                      key={skin.id}
                      onMouseEnter={handleHover}
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

                      {/* Skin Preview - Actual PixelCharacter */}
                      <button 
                        onClick={() => handleTryOn(skin)}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform duration-300"
                        style={{
                          background: `linear-gradient(135deg, ${skinColors.body}40, ${skinColors.accent}40)`,
                          boxShadow: owned 
                            ? `0 0 15px ${skinColors.body}50, 0 0 30px ${skinColors.body}30`
                            : `0 0 10px ${skinColors.body}30`,
                        }}
                      >
                        {/* Try On overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity z-20 rounded-lg">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                        
                        {/* Actual Character */}
                        <PixelCharacter
                          skinId={skin.skinId}
                          animation="running"
                          size={40}
                          showGlow={false}
                        />
                      </button>

                      <div className="flex-1 min-w-0 pt-1">
                        <p className="font-pixel text-[10px] sm:text-sm text-foreground truncate">{skin.name}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 mt-0.5">{skin.description}</p>
                        
                        {/* Color swatches */}
                        <div className="flex gap-1.5 mt-1.5">
                          <div 
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-white/30"
                            style={{ backgroundColor: skinColors.body, boxShadow: `0 0 8px ${skinColors.body}60` }}
                          />
                          <div 
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-white/30"
                            style={{ backgroundColor: skinColors.accent, boxShadow: `0 0 8px ${skinColors.accent}60` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 mt-1">
                        {owned ? (
                          <div className="flex items-center gap-1 px-2 sm:px-3 h-7 sm:h-9 rounded-md bg-primary/20 text-primary text-[10px] sm:text-xs font-pixel">
                            <Check className="w-3 h-3" />
                            OWNED
                          </div>
                        ) : (
                          <>
                            <Button
                              onClick={() => handleTryOn(skin)}
                              onMouseEnter={handleHover}
                              variant="ghost"
                              size="sm"
                              className="text-[9px] sm:text-[10px] h-6 px-2 text-muted-foreground hover:text-foreground"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              TRY ON
                            </Button>
                            <Button
                              onClick={() => handlePurchaseSkin(skin)}
                              onMouseEnter={handleHover}
                              disabled={purchasing !== null}
                              variant="outline"
                              className="border-secondary/50 text-[10px] sm:text-xs px-2 sm:px-4 h-7 sm:h-9 hover:bg-secondary/20 hover:border-secondary transition-colors"
                            >
                              {purchasing === skin.id ? '...' : skin.price}
                            </Button>
                          </>
                        )}
                      </div>
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
            onMouseEnter={handleHover}
            disabled={purchasing !== null}
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-3 h-3 mr-2" />
            Restore Purchases
          </Button>

          {!purchaseManager.isNativePlatform() && (
            <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
              <AlertCircle className="w-3 h-3" />
              In-app purchases available in mobile app only
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Skin Preview Modal - rendered via Portal */}
      <SkinPreviewModal 
        skin={previewSkin} 
        onClose={() => setPreviewSkin(null)}
        onPurchase={handlePreviewPurchase}
        isLoading={purchasing === previewSkin?.id}
        isOwned={previewSkin ? isSkinOwned(previewSkin.skinId) : false}
      />

      {/* Confirmation Modal - rendered via Portal */}
      <ConfirmPurchaseModal
        isOpen={!!confirmPurchase}
        onClose={() => setConfirmPurchase(null)}
        onConfirm={confirmPurchase?.type === 'coin' ? handleConfirmCoinPurchase : handleConfirmSkinPurchase}
        title={confirmPurchase?.item?.name || ''}
        description={
          confirmPurchase?.type === 'coin'
            ? `Purchase ${(confirmPurchase.item as CoinPack).coins.toLocaleString()} coins`
            : (confirmPurchase?.item as PremiumSkin)?.description || ''
        }
        price={confirmPurchase?.item?.price || ''}
        isLoading={purchasing !== null}
      />
    </>
  );
}
