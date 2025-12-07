import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const VIP_DAILY_BONUS_COINS = [100, 150, 200, 250, 300, 400, 500]; // 7-day cycle

export function useVipDailyBonus(profileId: string | null, isVip: boolean) {
  const [canClaim, setCanClaim] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [loading, setLoading] = useState(true);

  const checkClaimStatus = useCallback(async () => {
    if (!profileId || !isVip) {
      setCanClaim(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Get the most recent VIP bonus claim
    const { data } = await supabase
      .from('vip_daily_bonuses')
      .select('*')
      .eq('profile_id', profileId)
      .order('claimed_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const lastClaim = new Date(data[0].claimed_at);
      const today = new Date();
      const lastClaimDate = lastClaim.toDateString();
      const todayDate = today.toDateString();
      
      // Check if already claimed today
      if (lastClaimDate === todayDate) {
        setCanClaim(false);
        setCurrentDay(data[0].bonus_day);
      } else {
        // Check if it's been more than 1 day (reset streak)
        const diffDays = Math.floor((today.getTime() - lastClaim.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) {
          setCurrentDay(1);
        } else {
          setCurrentDay((data[0].bonus_day % 7) + 1);
        }
        setCanClaim(true);
      }
    } else {
      // First time claiming
      setCanClaim(true);
      setCurrentDay(1);
    }
    
    setLoading(false);
  }, [profileId, isVip]);

  const claimBonus = useCallback(async () => {
    if (!profileId || !isVip || !canClaim) {
      return { error: new Error('Cannot claim bonus'), coins: 0 };
    }

    const bonusCoins = VIP_DAILY_BONUS_COINS[(currentDay - 1) % 7];

    // Insert claim record
    const { error: claimError } = await supabase
      .from('vip_daily_bonuses')
      .insert({
        profile_id: profileId,
        bonus_coins: bonusCoins,
        bonus_day: currentDay,
      });

    if (claimError) {
      return { error: claimError, coins: 0 };
    }

    // Update profile coins
    const { data: profile } = await supabase
      .from('profiles')
      .select('coins')
      .eq('id', profileId)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({ coins: profile.coins + bonusCoins })
        .eq('id', profileId);
    }

    setCanClaim(false);
    
    return { error: null, coins: bonusCoins };
  }, [profileId, isVip, canClaim, currentDay]);

  useEffect(() => {
    checkClaimStatus();
  }, [checkClaimStatus]);

  return {
    canClaim,
    currentDay,
    loading,
    bonusCoins: VIP_DAILY_BONUS_COINS[(currentDay - 1) % 7],
    allBonuses: VIP_DAILY_BONUS_COINS,
    claimBonus,
    refreshStatus: checkClaimStatus,
  };
}