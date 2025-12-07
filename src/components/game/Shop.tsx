import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingBag, Check, Lock, Sparkles, Zap, Coins as CoinsIcon, ArrowUp, Shield, Eye, ChevronRight, Star } from 'lucide-react';
import { CharacterSkin } from '@/types/game';
import { toast } from 'sonner';
import { SkinPreview } from './SkinPreview';
import { useState } from 'react';

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

const SKIN_BENEFITS: Record<string, string[]> = {
  default: ['Free starter skin', 'No special abilities'],
  cat: ['Agile and quick', 'Perfect for beginners', 'Cute appearance'],
  robot: ['Enhanced durability', 'Tech-powered jumps', 'Metallic shine'],
  ninja: ['Stealthy movements', 'Quick reflexes', 'Shadow effects'],
  zombie: ['Undead resilience', 'Creepy style', 'Unique animations'],
  astronaut: ['Space-grade protection', 'Zero-gravity jumps', 'Cosmic trails'],
  wizard: ['Magical enhancements', 'Mystical aura', 'Spell effects'],
  golden: ['Premium collector item', 'Maximum coin bonus', 'Shimmering effects'],
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
  const [expandedSkin, setExpandedSkin] = useState<string | null>(null);

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

  const toggleExpand = (skinId: string) => {
    setExpandedSkin(expandedSkin === skinId ? null : skinId);
  };

  const renderAbilityBar = (label: string, value: number, maxValue: number, color: string, icon: React.ReactNode) => {
    const percentage = Math.min((value / maxValue) * 100, 100);
    return (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 flex items-center justify-center" style={{ color }}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-[9px] mb-0.5">
            <span className="text-muted-foreground">{label}</span>
            <span style={{ color }}>{value > 0 ? `+${value}%` : value > 1 ? `${value}x` : '—'}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${percentage}%`, backgroundColor: color }}
            />
          </div>
        </div>
      </div>
    );
  };

  // Calculate collection progress
  const totalSkins = allSkins.length;
  const ownedCount = ownedSkinIds.length;
  const progressPercent = totalSkins > 0 ? Math.round((ownedCount / totalSkins) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg bg-card border-primary/30 p-4 sm:p-6 max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-pixel text-base sm:text-lg text-primary flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              CHARACTER SHOP
            </div>
            {isLoggedIn && (
              <span className="text-[10px] sm:text-xs text-accent font-pixel flex items-center gap-1">
                <CoinsIcon className="w-3 h-3" />
                {currentCoins}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Collection Progress */}
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
            {progressPercent === 100 ? '🎉 Collection Complete!' : `Collect all skins for bonus rewards!`}
          </p>
        </div>

        <ScrollArea className="h-[50vh] sm:h-[400px] pr-2 sm:pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="font-pixel text-xs text-muted-foreground animate-pulse">
                LOADING...
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {allSkins.map((skin) => {
                const isOwned = ownedSkinIds.includes(skin.id);
                const isSelected = selectedSkin === skin.id;
                const isExpanded = expandedSkin === skin.id;
                const canAfford = currentCoins >= skin.price;
                const colors = SKIN_COLORS[skin.id] || SKIN_COLORS.default;
                const benefits = SKIN_BENEFITS[skin.id] || ['Unique character skin'];

                return (
                  <div
                    key={skin.id}
                    className={`rounded-lg border transition-all overflow-hidden ${
                      isSelected 
                        ? 'border-primary bg-primary/10' 
                        : isOwned 
                          ? 'border-border bg-card/50 hover:bg-card' 
                          : 'border-border/50 bg-muted/30 hover:border-border'
                    }`}
                  >
                    {/* Main row - always visible */}
                    <div 
                      className="flex items-center gap-3 p-3 cursor-pointer"
                      onClick={() => toggleExpand(skin.id)}
                    >
                      {/* Large character preview */}
                      <div className="relative">
                        <SkinPreview 
                          skin={skin} 
                          colors={colors} 
                          isSelected={isSelected} 
                        />
                        {skin.is_premium && (
                          <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                            <Star className="w-2.5 h-2.5 text-accent-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="font-pixel text-[11px] sm:text-xs text-foreground truncate">
                            {skin.name}
                          </p>
                          {isOwned && (
                            <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">
                          {skin.description}
                        </p>
                        
                        {/* Quick stats */}
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {skin.speed_bonus > 0 && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 flex items-center gap-0.5">
                              <Zap className="w-2 h-2" /> +{skin.speed_bonus}%
                            </span>
                          )}
                          {skin.coin_multiplier > 1 && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-accent/20 text-accent flex items-center gap-0.5">
                              <CoinsIcon className="w-2 h-2" /> {skin.coin_multiplier}x
                            </span>
                          )}
                          {skin.jump_power_bonus > 0 && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 flex items-center gap-0.5">
                              <ArrowUp className="w-2 h-2" /> +{skin.jump_power_bonus}%
                            </span>
                          )}
                          {skin.shield_duration_bonus > 0 && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 flex items-center gap-0.5">
                              <Shield className="w-2 h-2" /> +{skin.shield_duration_bonus}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price / Action */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isOwned ? (
                          isSelected ? (
                            <span className="text-[9px] px-2 py-1 rounded bg-primary/20 text-primary font-pixel">
                              EQUIPPED
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); handleSelect(skin.id); }}
                              className="font-pixel text-[9px] h-7 px-3"
                            >
                              EQUIP
                            </Button>
                          )
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className={`font-pixel text-xs ${canAfford ? 'text-accent' : 'text-muted-foreground'}`}>
                              {skin.price}
                            </span>
                            <CoinsIcon className={`w-3 h-3 ${canAfford ? 'text-accent' : 'text-muted-foreground'}`} />
                          </div>
                        )}
                        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0 border-t border-border/30 animate-fade-in">
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          {/* Why buy section */}
                          <div>
                            <h4 className="font-pixel text-[9px] text-muted-foreground mb-2 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> WHY GET THIS SKIN?
                            </h4>
                            <ul className="space-y-1">
                              {benefits.map((benefit, i) => (
                                <li key={i} className="text-[10px] text-foreground flex items-start gap-1">
                                  <span className="text-primary mt-0.5">•</span>
                                  {benefit}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Stats */}
                          <div>
                            <h4 className="font-pixel text-[9px] text-muted-foreground mb-2 flex items-center gap-1">
                              <Eye className="w-3 h-3" /> ABILITIES
                            </h4>
                            <div className="space-y-2">
                              {renderAbilityBar('Speed', skin.speed_bonus, 30, '#FBBF24', <Zap className="w-3 h-3" />)}
                              {renderAbilityBar('Coins', (skin.coin_multiplier - 1) * 50, 100, '#FFD700', <CoinsIcon className="w-3 h-3" />)}
                              {renderAbilityBar('Jump', skin.jump_power_bonus, 30, '#4ADE80', <ArrowUp className="w-3 h-3" />)}
                              {renderAbilityBar('Shield', skin.shield_duration_bonus, 50, '#60A5FA', <Shield className="w-3 h-3" />)}
                            </div>
                          </div>
                        </div>

                        {/* Purchase button for non-owned skins */}
                        {!isOwned && (
                          <div className="mt-3 pt-3 border-t border-border/30">
                            <Button
                              onClick={(e) => { e.stopPropagation(); handlePurchase(skin); }}
                              className={`w-full font-pixel text-[10px] gap-2 ${!canAfford ? 'opacity-60' : ''}`}
                              disabled={!canAfford && !isLoggedIn}
                            >
                              {!isLoggedIn ? (
                                <>Sign in to Purchase</>
                              ) : !canAfford ? (
                                <>Need {skin.price - currentCoins} more coins</>
                              ) : (
                                <>
                                  <Lock className="w-3 h-3" />
                                  UNLOCK FOR {skin.price} COINS
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {!isLoggedIn && (
          <div className="mt-3 p-3 rounded-lg bg-muted/50 text-center border border-border/30">
            <p className="text-[10px] text-muted-foreground mb-2">
              Sign in to save purchases and earn coins!
            </p>
            <Button size="sm" onClick={onOpenAuth} className="font-pixel text-[9px] h-7">
              SIGN IN
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
