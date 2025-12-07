import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DAILY_REWARDS } from '@/types/game';

export function useDailyRewards(profileId: string | null) {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [canClaim, setCanClaim] = useState(false);
  const [lastClaimDay, setLastClaimDay] = useState(0);
  const [loading, setLoading] = useState(true);

  const checkDailyReward = useCallback(async () => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('login_streak, last_daily_claim')
      .eq('id', profileId)
      .single();

    if (profile) {
      const today = new Date().toISOString().split('T')[0];
      const lastClaim = profile.last_daily_claim;
      
      if (!lastClaim || lastClaim !== today) {
        // Check if streak continues or resets
        if (lastClaim) {
          const lastDate = new Date(lastClaim);
          const todayDate = new Date(today);
          const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            // Continue streak
            setCurrentStreak(profile.login_streak);
            setLastClaimDay(profile.login_streak % 7);
          } else if (diffDays > 1) {
            // Reset streak
            setCurrentStreak(0);
            setLastClaimDay(0);
          }
        } else {
          setCurrentStreak(0);
          setLastClaimDay(0);
        }
        setCanClaim(true);
      } else {
        // Already claimed today
        setCurrentStreak(profile.login_streak);
        setLastClaimDay(profile.login_streak % 7);
        setCanClaim(false);
      }
    }
    
    setLoading(false);
  }, [profileId]);

  const claimReward = useCallback(async () => {
    if (!profileId || !canClaim) return { error: new Error('Cannot claim') };

    const today = new Date().toISOString().split('T')[0];
    const newStreak = currentStreak + 1;
    const dayIndex = Math.min(newStreak - 1, 6);
    const reward = DAILY_REWARDS[dayIndex];

    // Get current coins
    const { data: profile } = await supabase
      .from('profiles')
      .select('coins')
      .eq('id', profileId)
      .single();

    if (!profile) return { error: new Error('Profile not found') };

    // Update profile with new streak and coins
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        login_streak: newStreak,
        last_daily_claim: today,
        coins: profile.coins + reward.coins,
      })
      .eq('id', profileId);

    if (updateError) return { error: updateError };

    // Record the claim
    const { error: insertError } = await supabase
      .from('daily_rewards')
      .insert({
        profile_id: profileId,
        day_number: dayIndex + 1,
        coins_reward: reward.coins,
      });

    if (!insertError) {
      setCurrentStreak(newStreak);
      setLastClaimDay(dayIndex + 1);
      setCanClaim(false);
    }

    return { error: insertError, reward: reward.coins };
  }, [profileId, canClaim, currentStreak]);

  useEffect(() => {
    checkDailyReward();
  }, [checkDailyReward]);

  return {
    currentStreak,
    canClaim,
    lastClaimDay,
    loading,
    claimReward,
    checkDailyReward,
  };
}
