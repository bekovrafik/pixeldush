import { Crown, TrendingUp, Coins, Ban, Calendar, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { VipStats, LOYALTY_TIERS, AD_VALUE_PER_REVIVE } from '@/hooks/useVipStats';

interface VipStatsCardProps {
  stats: VipStats | null;
  currentTier: { name: string; icon: string; bonusMultiplier: number };
  nextTier: { name: string; monthsRequired: number; bonusMultiplier: number } | null;
  monthsUntilNextTier: number | null;
}

export function VipStatsCard({ stats, currentTier, nextTier, monthsUntilNextTier }: VipStatsCardProps) {
  if (!stats) return null;

  const totalSavings = stats.ad_free_revives_used * AD_VALUE_PER_REVIVE;
  const progress = nextTier && stats.months_subscribed > 0
    ? ((stats.months_subscribed / nextTier.monthsRequired) * 100)
    : 100;

  return (
    <div className="space-y-3">
      {/* Loyalty Tier Banner */}
      <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{currentTier.icon}</span>
            <div>
              <p className="font-pixel text-xs text-amber-400">{currentTier.name} VIP</p>
              <p className="text-[10px] text-muted-foreground">{stats.months_subscribed} month(s) subscribed</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Bonus</p>
            <p className="font-pixel text-sm text-amber-400">{currentTier.bonusMultiplier}x</p>
          </div>
        </div>

        {nextTier && monthsUntilNextTier !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Progress to {nextTier.name}</span>
              <span>{monthsUntilNextTier} month(s) left</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {!nextTier && (
          <p className="text-[10px] text-amber-400 text-center mt-1">
            ✨ Maximum tier reached!
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
          <div className="flex items-center gap-2 mb-1">
            <Ban className="w-3.5 h-3.5 text-green-400" />
            <span className="text-[10px] text-muted-foreground">Ad-Free Revives</span>
          </div>
          <p className="font-pixel text-sm text-foreground">{stats.ad_free_revives_used}</p>
          <p className="text-[9px] text-green-400">~${totalSavings.toFixed(2)} saved</p>
        </div>

        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-[10px] text-muted-foreground">Bonus Coins</span>
          </div>
          <p className="font-pixel text-sm text-foreground">{stats.total_bonus_coins_earned.toLocaleString()}</p>
          <p className="text-[9px] text-yellow-400">From VIP bonuses</p>
        </div>

        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] text-muted-foreground">Member Since</span>
          </div>
          <p className="font-pixel text-xs text-foreground">
            {stats.first_subscribed_at 
              ? new Date(stats.first_subscribed_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : 'N/A'}
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] text-muted-foreground">Total Value</span>
          </div>
          <p className="font-pixel text-xs text-foreground">
            ${(totalSavings + (stats.total_bonus_coins_earned * 0.01)).toFixed(2)}
          </p>
          <p className="text-[9px] text-purple-400">Lifetime benefits</p>
        </div>
      </div>

      {/* Loyalty Tier Roadmap */}
      <div className="p-2 rounded-lg bg-muted/20">
        <p className="text-[10px] text-muted-foreground mb-2">LOYALTY TIERS</p>
        <div className="flex justify-between items-center gap-1">
          {Object.entries(LOYALTY_TIERS).map(([key, tier]) => {
            const isActive = key === stats.loyalty_tier;
            const isPassed = Object.keys(LOYALTY_TIERS).indexOf(key) < Object.keys(LOYALTY_TIERS).indexOf(stats.loyalty_tier);
            return (
              <div
                key={key}
                className={`flex-1 text-center p-1.5 rounded ${
                  isActive ? 'bg-amber-500/30 border border-amber-400' :
                  isPassed ? 'bg-muted/50 opacity-70' : 'bg-muted/30'
                }`}
              >
                <span className="text-sm">{tier.icon}</span>
                <p className={`text-[8px] ${isActive ? 'text-amber-400' : 'text-muted-foreground'}`}>
                  {tier.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
