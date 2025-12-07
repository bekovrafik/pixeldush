import { Crown, Check, Lock, Sparkles } from 'lucide-react';
import { CharacterSkin } from '@/types/game';
import { Button } from '@/components/ui/button';

interface VipSkinsSectionProps {
  vipSkins: CharacterSkin[];
  ownedSkinIds: string[];
  selectedSkin: string;
  isVip: boolean;
  onSelectSkin: (skinId: string) => void;
  onOpenShop: () => void;
}

const VIP_SKIN_EFFECTS: Record<string, { effect: string; color: string }> = {
  diamond: { effect: '✨ Sparkling Aura', color: 'from-cyan-400 to-blue-400' },
  phoenix: { effect: '🔥 Fire Trail', color: 'from-orange-400 to-red-400' },
  shadow_king: { effect: '👤 Shadow Clones', color: 'from-purple-400 to-indigo-400' },
};

export function VipSkinsSection({ 
  vipSkins, 
  ownedSkinIds, 
  selectedSkin, 
  isVip,
  onSelectSkin,
  onOpenShop
}: VipSkinsSectionProps) {
  const vipExclusiveSkins = vipSkins.filter(skin => 
    ['diamond', 'phoenix', 'shadow_king'].includes(skin.id)
  );

  return (
    <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <span className="font-pixel text-xs text-purple-400">VIP EXCLUSIVE SKINS</span>
      </div>

      <div className="space-y-2">
        {vipExclusiveSkins.map(skin => {
          const isOwned = ownedSkinIds.includes(skin.id);
          const isSelected = selectedSkin === skin.id;
          const effect = VIP_SKIN_EFFECTS[skin.id];

          return (
            <div
              key={skin.id}
              className={`p-2.5 rounded-lg border transition-all ${
                isSelected 
                  ? 'bg-purple-500/20 border-purple-400 ring-2 ring-purple-400/50' 
                  : 'bg-muted/30 border-border/30 hover:border-purple-400/50'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Skin Icon */}
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${effect?.color || 'from-gray-400 to-gray-500'} flex items-center justify-center relative overflow-hidden`}>
                  <Crown className="w-5 h-5 text-white" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                {/* Skin Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-pixel text-xs text-foreground">{skin.name}</p>
                    {isSelected && <Check className="w-3 h-3 text-green-400" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{effect?.effect || 'Special Effect'}</p>
                  <div className="flex gap-2 mt-1 text-[9px]">
                    {skin.speed_bonus > 0 && (
                      <span className="text-blue-400">+{skin.speed_bonus}% SPD</span>
                    )}
                    {skin.coin_multiplier > 1 && (
                      <span className="text-yellow-400">{skin.coin_multiplier}x COINS</span>
                    )}
                    {skin.jump_power_bonus > 0 && (
                      <span className="text-green-400">+{skin.jump_power_bonus}% JUMP</span>
                    )}
                  </div>
                </div>

                {/* Action */}
                {isVip && isOwned ? (
                  <Button
                    size="sm"
                    variant={isSelected ? 'default' : 'outline'}
                    className="font-pixel text-[10px] h-7"
                    onClick={() => onSelectSkin(skin.id)}
                  >
                    {isSelected ? 'EQUIPPED' : 'EQUIP'}
                  </Button>
                ) : !isVip ? (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    <span>VIP Only</span>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-pixel text-[10px] h-7"
                    onClick={() => onSelectSkin(skin.id)}
                  >
                    EQUIP
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isVip && (
        <p className="text-[10px] text-center text-muted-foreground mt-3">
          Subscribe to VIP to unlock these exclusive skins with special visual effects!
        </p>
      )}
    </div>
  );
}
