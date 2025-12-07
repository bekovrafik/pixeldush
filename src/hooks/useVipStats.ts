import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VipStats {
  id: string;
  profile_id: string;
  ad_free_revives_used: number;
  total_bonus_coins_earned: number;
  months_subscribed: number;
  loyalty_tier: string;
  first_subscribed_at: string | null;
}

export const LOYALTY_TIERS = {
  bronze: { name: 'Bronze', monthsRequired: 0, bonusMultiplier: 1, icon: '🥉' },
  silver: { name: 'Silver', monthsRequired: 3, bonusMultiplier: 1.25, icon: '🥈' },
  gold: { name: 'Gold', monthsRequired: 6, bonusMultiplier: 1.5, icon: '🥇' },
  platinum: { name: 'Platinum', monthsRequired: 12, bonusMultiplier: 2, icon: '💎' },
  diamond: { name: 'Diamond', monthsRequired: 24, bonusMultiplier: 3, icon: '👑' },
};

export const AD_VALUE_PER_REVIVE = 0.5; // Estimated value per ad in dollars

export function useVipStats(profileId: string | null, isVip: boolean) {
  const [stats, setStats] = useState<VipStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!profileId) {
      setStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('vip_stats')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (!error && data) {
      setStats(data as VipStats);
    } else if (!data && isVip) {
      // Create initial stats for new VIP
      const { data: newStats, error: insertError } = await supabase
        .from('vip_stats')
        .insert({
          profile_id: profileId,
          first_subscribed_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (!insertError && newStats) {
        setStats(newStats as VipStats);
      }
    }
    
    setLoading(false);
  }, [profileId, isVip]);

  const incrementReviveUsed = useCallback(async () => {
    if (!profileId || !stats) return;

    const { error } = await supabase
      .from('vip_stats')
      .update({ ad_free_revives_used: stats.ad_free_revives_used + 1 })
      .eq('profile_id', profileId);

    if (!error) {
      setStats(prev => prev ? { ...prev, ad_free_revives_used: prev.ad_free_revives_used + 1 } : null);
    }
  }, [profileId, stats]);

  const addBonusCoinsEarned = useCallback(async (coins: number) => {
    if (!profileId || !stats) return;

    const { error } = await supabase
      .from('vip_stats')
      .update({ total_bonus_coins_earned: stats.total_bonus_coins_earned + coins })
      .eq('profile_id', profileId);

    if (!error) {
      setStats(prev => prev ? { ...prev, total_bonus_coins_earned: prev.total_bonus_coins_earned + coins } : null);
    }
  }, [profileId, stats]);

  const updateLoyaltyTier = useCallback(async (months: number) => {
    if (!profileId || !stats) return;

    let newTier = 'bronze';
    if (months >= 24) newTier = 'diamond';
    else if (months >= 12) newTier = 'platinum';
    else if (months >= 6) newTier = 'gold';
    else if (months >= 3) newTier = 'silver';

    const { error } = await supabase
      .from('vip_stats')
      .update({ 
        months_subscribed: months,
        loyalty_tier: newTier 
      })
      .eq('profile_id', profileId);

    if (!error) {
      setStats(prev => prev ? { ...prev, months_subscribed: months, loyalty_tier: newTier } : null);
    }
  }, [profileId, stats]);

  const getTotalSavings = useCallback(() => {
    if (!stats) return 0;
    return stats.ad_free_revives_used * AD_VALUE_PER_REVIVE;
  }, [stats]);

  const getCurrentTierInfo = useCallback(() => {
    const tier = stats?.loyalty_tier || 'bronze';
    return LOYALTY_TIERS[tier as keyof typeof LOYALTY_TIERS] || LOYALTY_TIERS.bronze;
  }, [stats]);

  const getNextTierInfo = useCallback(() => {
    const tier = stats?.loyalty_tier || 'bronze';
    const tiers = Object.entries(LOYALTY_TIERS);
    const currentIndex = tiers.findIndex(([key]) => key === tier);
    if (currentIndex < tiers.length - 1) {
      return tiers[currentIndex + 1][1];
    }
    return null;
  }, [stats]);

  const getMonthsUntilNextTier = useCallback(() => {
    const nextTier = getNextTierInfo();
    if (!nextTier || !stats) return null;
    return nextTier.monthsRequired - stats.months_subscribed;
  }, [stats, getNextTierInfo]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    incrementReviveUsed,
    addBonusCoinsEarned,
    updateLoyaltyTier,
    getTotalSavings,
    getCurrentTierInfo,
    getNextTierInfo,
    getMonthsUntilNextTier,
    refresh: fetchStats,
  };
}
