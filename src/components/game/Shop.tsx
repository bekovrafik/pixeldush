import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingBag, Check, Lock, Sparkles } from 'lucide-react';
import { CharacterSkin } from '@/types/game';
import { toast } from 'sonner';

interface ShopProps {
  isOpen: boolean;
  onClose: () => void;
  allSkins: CharacterSkin[];
  ownedSkinIds: string[];
  selectedSkin: string;
  loading: boolean;
  isLoggedIn: boolean;
  onPurchase: (skinId: string) => Promise<{ error: Error | null }>;
  onSelect: (skinId: string) => void;
  onOpenAuth: () => void;
}

const SKIN_COLORS: Record<string, { body: string; accent: string }> = {
  default: { body: '#4ECDC4', accent: '#2C3E50' },
  cat: { body: '#FF9F43', accent: '#2C3E50' },
  robot: { body: '#A8A8A8', accent: '#3498DB' },
  ninja: { body: '#2C3E50', accent: '#E74C3C' },
  zombie: { body: '#7CB342', accent: '#558B2F' },
  astronaut: { body: '#ECF0F1', accent: '#3498DB' },
};

export function Shop({ 
  isOpen, 
  onClose, 
  allSkins, 
  ownedSkinIds, 
  selectedSkin,
  loading,
  isLoggedIn,
  onPurchase, 
  onSelect,
  onOpenAuth,
}: ShopProps) {
  const handlePurchase = async (skin: CharacterSkin) => {
    if (!isLoggedIn) {
      toast.error('Please sign in to purchase skins');
      onOpenAuth();
      return;
    }

    // Simulate ad for premium skins, or direct purchase
    toast.info('Processing purchase...');
    
    const { error } = await onPurchase(skin.id);
    
    if (error) {
      toast.error('Failed to purchase skin');
    } else {
      toast.success(`Unlocked ${skin.name}!`);
    }
  };

  const handleSelect = (skinId: string) => {
    if (ownedSkinIds.includes(skinId)) {
      onSelect(skinId);
      toast.success('Skin selected!');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-pixel text-lg text-primary flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            CHARACTER SHOP
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
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
                const colors = SKIN_COLORS[skin.id] || SKIN_COLORS.default;

                return (
                  <div
                    key={skin.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/10' 
                        : isOwned 
                          ? 'border-border bg-card/50 hover:bg-card' 
                          : 'border-border/50 bg-muted/30'
                    }`}
                  >
                    {/* Character preview */}
                    <div 
                      className="w-12 h-14 rounded flex-shrink-0 relative"
                      style={{
                        backgroundColor: colors.body,
                        boxShadow: isSelected ? `0 0 20px ${colors.body}40` : undefined,
                      }}
                    >
                      <div 
                        className="absolute top-1 left-1 right-1 h-4 rounded-t"
                        style={{ backgroundColor: colors.body }}
                      />
                      <div 
                        className="absolute top-2 right-2 w-3 h-2"
                        style={{ backgroundColor: colors.accent }}
                      />
                      <div 
                        className="absolute bottom-0 left-1 w-3 h-3"
                        style={{ backgroundColor: colors.accent }}
                      />
                      <div 
                        className="absolute bottom-0 right-1 w-3 h-3"
                        style={{ backgroundColor: colors.accent }}
                      />
                      {skin.is_premium && (
                        <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-accent" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-pixel text-xs text-foreground truncate">
                          {skin.name}
                        </p>
                        {skin.is_premium && (
                          <span className="text-[10px] px-1 py-0.5 rounded bg-accent/20 text-accent font-pixel">
                            PREMIUM
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {skin.description}
                      </p>
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0">
                      {isOwned ? (
                        isSelected ? (
                          <div className="flex items-center gap-1 text-primary">
                            <Check className="w-4 h-4" />
                            <span className="font-pixel text-[10px]">EQUIPPED</span>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelect(skin.id)}
                            className="font-pixel text-[10px]"
                          >
                            EQUIP
                          </Button>
                        )
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handlePurchase(skin)}
                          className="font-pixel text-[10px] gap-1"
                          disabled={skin.price === 0}
                        >
                          {skin.price === 0 ? (
                            'FREE'
                          ) : (
                            <>
                              <Lock className="w-3 h-3" />
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
          <div className="mt-4 p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground mb-2">
              Sign in to save your purchases
            </p>
            <Button size="sm" onClick={onOpenAuth} className="font-pixel text-[10px]">
              SIGN IN
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
