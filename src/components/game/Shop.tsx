import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingBag, Check, Lock, Sparkles, Zap, Coins as CoinsIcon, ArrowUp, Shield } from 'lucide-react';
import { CharacterSkin } from '@/types/game';
import { toast } from 'sonner';
import { SkinPreview } from './SkinPreview';

interface ShopProps {
  isOpen: boolean;
  onClose: () => void;
  allSkins: CharacterSkin[];
  ownedSkinIds: string[];
  selectedSkin: string;
  loading: boolean;
  isLoggedIn: boolean;
  currentCoins: number;
  onPurchase: (skinId: string, currentCoins: number) => Promise<{ error: Error | null }>;
  onSelect: (skinId: string) => void;
  onOpenAuth: () => void;
  onPurchaseComplete: () => void;
}

const SKIN_COLORS: Record<string, { body: string; accent: string }> = {
  default: { body: '#4ECDC4', accent: '#2C3E50' },
  cat: { body: '#FF9F43', accent: '#2C3E50' },
  robot: { body: '#A8A8A8', accent: '#3498DB' },
  ninja: { body: '#2C3E50', accent: '#E74C3C' },
  zombie: { body: '#7CB342', accent: '#558B2F' },
  astronaut: { body: '#ECF0F1', accent: '#3498DB' },
  wizard: { body: '#9B59B6', accent: '#F1C40F' },
  golden: { body: '#F1C40F', accent: '#E67E22' },
};

export function Shop({ 
  isOpen, 
  onClose, 
  allSkins, 
  ownedSkinIds, 
  selectedSkin,
  loading,
  isLoggedIn,
  currentCoins,
  onPurchase, 
  onSelect,
  onOpenAuth,
  onPurchaseComplete,
}: ShopProps) {
  const handlePurchase = async (skin: CharacterSkin) => {
    if (!isLoggedIn) {
      toast.error('Please sign in to purchase skins');
      onOpenAuth();
      return;
    }

    if (currentCoins < skin.price) {
      toast.error(`Not enough coins! You need ${skin.price - currentCoins} more coins.`);
      return;
    }

    toast.info('Processing purchase...');
    
    const { error } = await onPurchase(skin.id, currentCoins);
    
    if (error) {
      toast.error(error.message || 'Failed to purchase skin');
    } else {
      toast.success(`Unlocked ${skin.name}!`);
      onPurchaseComplete();
    }
  };

  const handleSelect = (skinId: string) => {
    if (ownedSkinIds.includes(skinId)) {
      onSelect(skinId);
      toast.success('Skin selected!');
    }
  };

  const renderAbilities = (skin: CharacterSkin) => {
    const abilities = [];
    if (skin.speed_bonus > 0) abilities.push({ icon: Zap, label: `+${skin.speed_bonus}% Speed`, color: 'text-yellow-400' });
    if (skin.coin_multiplier > 1) abilities.push({ icon: CoinsIcon, label: `${skin.coin_multiplier}x Coins`, color: 'text-accent' });
    if (skin.jump_power_bonus > 0) abilities.push({ icon: ArrowUp, label: `+${skin.jump_power_bonus}% Jump`, color: 'text-green-400' });
    if (skin.shield_duration_bonus > 0) abilities.push({ icon: Shield, label: `+${skin.shield_duration_bonus}% Shield`, color: 'text-blue-400' });
    
    if (abilities.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {abilities.map((ability, index) => (
          <div key={index} className={`flex items-center gap-0.5 text-[8px] sm:text-[9px] ${ability.color}`}>
            <ability.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span>{ability.label}</span>
          </div>
        ))}
      </div>
    );
  };

  // Calculate collection progress
  const totalSkins = allSkins.length;
  const ownedCount = ownedSkinIds.length;
  const progressPercent = totalSkins > 0 ? Math.round((ownedCount / totalSkins) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md bg-card border-primary/30 p-4 sm:p-6 max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="font-pixel text-base sm:text-lg text-primary flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              CHARACTER SHOP
            </div>
            {isLoggedIn && (
              <span className="text-[10px] sm:text-xs text-accent font-pixel">
                {currentCoins} 🪙
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Collection Progress Tracker */}
        <div className="mb-3 p-2 sm:p-3 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-pixel text-[9px] sm:text-[10px] text-muted-foreground">COLLECTION</span>
            <span className="font-pixel text-[10px] sm:text-xs text-primary">{ownedCount}/{totalSkins}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[8px] sm:text-[9px] text-muted-foreground mt-1 text-center">
            {progressPercent === 100 ? '🎉 Collection Complete!' : `${progressPercent}% Complete`}
          </p>
        </div>

        <ScrollArea className="h-[45vh] sm:h-[350px] pr-2 sm:pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="font-pixel text-xs text-muted-foreground animate-pulse">
                LOADING...
              </div>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {allSkins.map((skin) => {
                const isOwned = ownedSkinIds.includes(skin.id);
                const isSelected = selectedSkin === skin.id;
                const canAfford = currentCoins >= skin.price;
                const colors = SKIN_COLORS[skin.id] || SKIN_COLORS.default;

                return (
                  <div
                    key={skin.id}
                    className={`flex items-center gap-2 sm:gap-4 p-2 sm:p-4 rounded-lg border transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/10' 
                        : isOwned 
                          ? 'border-border bg-card/50 hover:bg-card' 
                          : 'border-border/50 bg-muted/30'
                    }`}
                  >
                    {/* Character preview with animation */}
                    <SkinPreview 
                      skin={skin} 
                      colors={colors} 
                      isSelected={isSelected} 
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <p className="font-pixel text-[10px] sm:text-xs text-foreground truncate">
                          {skin.name}
                        </p>
                        {skin.is_premium && (
                          <span className="text-[8px] sm:text-[10px] px-1 py-0.5 rounded bg-accent/20 text-accent font-pixel">
                            PREMIUM
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {skin.description}
                      </p>
                      {renderAbilities(skin)}
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0">
                      {isOwned ? (
                        isSelected ? (
                          <div className="flex items-center gap-1 text-primary">
                            <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="font-pixel text-[8px] sm:text-[10px]">EQUIPPED</span>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelect(skin.id)}
                            className="font-pixel text-[9px] sm:text-[10px] h-7 sm:h-8 px-2 sm:px-3"
                          >
                            EQUIP
                          </Button>
                        )
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handlePurchase(skin)}
                          className={`font-pixel text-[9px] sm:text-[10px] gap-1 h-7 sm:h-8 px-2 sm:px-3 ${
                            !canAfford && skin.price > 0 ? 'opacity-50' : ''
                          }`}
                          disabled={skin.price === 0}
                        >
                          {skin.price === 0 ? (
                            'FREE'
                          ) : (
                            <>
                              <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              {skin.price}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {!isLoggedIn && (
          <div className="mt-3 sm:mt-4 p-2 sm:p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-2">
              Sign in to save your purchases
            </p>
            <Button size="sm" onClick={onOpenAuth} className="font-pixel text-[9px] sm:text-[10px] h-7 sm:h-8">
              SIGN IN
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
