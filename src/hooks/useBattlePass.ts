import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BattlePassTier {
  id: string;
  tier_number: number;
  xp_required: number;
  free_reward_type: string;
  free_reward_value: string | null;
  premium_reward_type: string;
  premium_reward_value: string | null;
}

interface BattlePassSeason {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface UserBattlePass {
  id: string;
  profile_id: string;
  season_id: string;
  current_xp: number;
  current_tier: number;
  is_premium: boolean;
  claimed_free_tiers: number[];
  claimed_premium_tiers: number[];
}

export function useBattlePass(profileId: string | null) {
  const [season, setSeason] = useState<BattlePassSeason | null>(null);
  const [tiers, setTiers] = useState<BattlePassTier[]>([]);
  const [userProgress, setUserProgress] = useState<UserBattlePass | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBattlePass = useCallback(async () => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch active season
      const { data: seasonData, error: seasonError } = await supabase
        .from('battle_pass_seasons')
        .select('*')
        .eq('is_active', true)
        .single();

      if (seasonError || !seasonData) {
        setLoading(false);
        return;
      }

      setSeason(seasonData);

      // Fetch tiers for this season
      const { data: tiersData, error: tiersError } = await supabase
        .from('battle_pass_tiers')
        .select('*')
        .eq('season_id', seasonData.id)
        .order('tier_number', { ascending: true });

      if (!tiersError && tiersData) {
        setTiers(tiersData);
      }

      // Fetch or create user progress
      let { data: progressData, error: progressError } = await supabase
        .from('user_battle_pass')
        .select('*')
        .eq('profile_id', profileId)
        .eq('season_id', seasonData.id)
        .single();

      if (progressError && progressError.code === 'PGRST116') {
        // Create new progress record
        const { data: newProgress, error: createError } = await supabase
          .from('user_battle_pass')
          .insert({
            profile_id: profileId,
            season_id: seasonData.id,
            current_xp: 0,
            current_tier: 0,
            is_premium: false,
            claimed_free_tiers: [],
            claimed_premium_tiers: [],
          })
          .select()
          .single();

        if (!createError && newProgress) {
          progressData = newProgress;
        }
      }

      if (progressData) {
        setUserProgress(progressData as UserBattlePass);
      }
    } catch (error) {
      console.error('Error fetching battle pass:', error);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchBattlePass();
  }, [fetchBattlePass]);

  const addXP = useCallback(async (xp: number) => {
    if (!profileId || !userProgress || !season) return;

    const newXP = userProgress.current_xp + xp;
    
    // Calculate new tier
    let newTier = userProgress.current_tier;
    for (const tier of tiers) {
      if (newXP >= tier.xp_required && tier.tier_number > newTier) {
        newTier = tier.tier_number;
      }
    }

    const { error } = await supabase
      .from('user_battle_pass')
      .update({
        current_xp: newXP,
        current_tier: newTier,
      })
      .eq('id', userProgress.id);

    if (!error) {
      setUserProgress(prev => prev ? { ...prev, current_xp: newXP, current_tier: newTier } : null);
      if (newTier > userProgress.current_tier) {
        toast.success(`Battle Pass Level Up! Tier ${newTier}`);
      }
    }
  }, [profileId, userProgress, season, tiers]);

  const claimReward = useCallback(async (tierNumber: number, isPremium: boolean): Promise<{ success: boolean; reward?: { type: string; value: string } }> => {
    if (!profileId || !userProgress) return { success: false };

    const tier = tiers.find(t => t.tier_number === tierNumber);
    if (!tier) return { success: false };

    // Check if already claimed
    const claimedList = isPremium ? userProgress.claimed_premium_tiers : userProgress.claimed_free_tiers;
    if (claimedList.includes(tierNumber)) {
      toast.error('Already claimed!');
      return { success: false };
    }

    // Check if tier is unlocked
    if (tierNumber > userProgress.current_tier) {
      toast.error('Tier not unlocked yet!');
      return { success: false };
    }

    // Check premium access for premium rewards
    if (isPremium && !userProgress.is_premium) {
      toast.error('Premium pass required!');
      return { success: false };
    }

    const rewardType = isPremium ? tier.premium_reward_type : tier.free_reward_type;
    const rewardValue = isPremium ? tier.premium_reward_value : tier.free_reward_value;

    if (rewardType === 'none' || !rewardValue) {
      return { success: false };
    }

    // Apply reward
    if (rewardType === 'coins') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', profileId)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ coins: profile.coins + parseInt(rewardValue) })
          .eq('id', profileId);
      }
    } else if (rewardType === 'skin') {
      // Add skin to owned skins
      await supabase
        .from('owned_skins')
        .insert({
          profile_id: profileId,
          skin_id: rewardValue,
        });
    }

    // Update claimed list
    const newClaimedList = [...claimedList, tierNumber];
    const updateField = isPremium ? 'claimed_premium_tiers' : 'claimed_free_tiers';

    const { error } = await supabase
      .from('user_battle_pass')
      .update({ [updateField]: newClaimedList })
      .eq('id', userProgress.id);

    if (!error) {
      setUserProgress(prev => {
        if (!prev) return null;
        return {
          ...prev,
          [isPremium ? 'claimed_premium_tiers' : 'claimed_free_tiers']: newClaimedList,
        };
      });
      return { success: true, reward: { type: rewardType, value: rewardValue } };
    }

    return { success: false };
  }, [profileId, userProgress, tiers]);

  const upgradeToPremium = useCallback(async (coinCost: number): Promise<boolean> => {
    if (!profileId || !userProgress) return false;

    // Check coins
    const { data: profile } = await supabase
      .from('profiles')
      .select('coins')
      .eq('id', profileId)
      .single();

    if (!profile || profile.coins < coinCost) {
      toast.error('Not enough coins!');
      return false;
    }

    // Deduct coins and upgrade
    const { error: coinsError } = await supabase
      .from('profiles')
      .update({ coins: profile.coins - coinCost })
      .eq('id', profileId);

    if (coinsError) return false;

    const { error } = await supabase
      .from('user_battle_pass')
      .update({ is_premium: true })
      .eq('id', userProgress.id);

    if (!error) {
      setUserProgress(prev => prev ? { ...prev, is_premium: true } : null);
      toast.success('Premium Battle Pass Unlocked!');
      return true;
    }

    return false;
  }, [profileId, userProgress]);

  const getSeasonTimeRemaining = useCallback((): { days: number; hours: number } => {
    if (!season) return { days: 0, hours: 0 };
    const endDate = new Date(season.end_date);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { days: Math.max(0, days), hours: Math.max(0, hours) };
  }, [season]);

  return {
    season,
    tiers,
    userProgress,
    loading,
    addXP,
    claimReward,
    upgradeToPremium,
    getSeasonTimeRemaining,
    refetch: fetchBattlePass,
  };
}
