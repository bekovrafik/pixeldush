import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BossRushChallenge {
  id: string;
  title: string;
  description: string;
  challenge_type: 'daily' | 'weekly';
  requirement_type: 'complete_rush' | 'beat_time' | 'endless_waves' | 'total_score';
  requirement_value: number;
  reward_coins: number;
  reward_xp: number;
  icon: string;
}

export interface UserBossRushChallengeProgress {
  id: string;
  challenge_id: string;
  current_progress: number;
  is_completed: boolean;
  is_claimed: boolean;
  challenge: BossRushChallenge;
}

export function useBossRushChallenges(profileId: string | null) {
  const [challenges, setChallenges] = useState<BossRushChallenge[]>([]);
  const [progress, setProgress] = useState<UserBossRushChallengeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = useCallback(async () => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch all challenges
    const { data: challengeData } = await supabase
      .from('boss_rush_challenges')
      .select('*');

    if (challengeData) {
      setChallenges(challengeData as unknown as BossRushChallenge[]);
    }

    // Get today's date and start of week
    const today = new Date().toISOString().split('T')[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const weekStart = startOfWeek.toISOString().split('T')[0];

    // Fetch user progress
    const { data: progressData } = await supabase
      .from('user_boss_rush_challenges')
      .select(`
        id,
        challenge_id,
        current_progress,
        is_completed,
        is_claimed,
        challenge_date
      `)
      .eq('profile_id', profileId)
      .gte('challenge_date', weekStart);

    if (progressData && challengeData) {
      const mappedProgress = progressData.map(p => ({
        ...p,
        challenge: challengeData.find(c => c.id === p.challenge_id) as BossRushChallenge,
      })).filter(p => p.challenge);

      setProgress(mappedProgress as UserBossRushChallengeProgress[]);
    }

    setLoading(false);
  }, [profileId]);

  const updateProgress = useCallback(async (data: {
    rushCompleted?: boolean;
    completionTime?: number;
    endlessWaves?: number;
    totalScore?: number;
  }) => {
    if (!profileId) return;

    const today = new Date().toISOString().split('T')[0];

    for (const challenge of challenges) {
      let progressValue = 0;
      let shouldUpdate = false;

      switch (challenge.requirement_type) {
        case 'complete_rush':
          if (data.rushCompleted) {
            progressValue = 1;
            shouldUpdate = true;
          }
          break;
        case 'beat_time':
          if (data.completionTime && data.completionTime <= challenge.requirement_value) {
            progressValue = 1;
            shouldUpdate = true;
          }
          break;
        case 'endless_waves':
          if (data.endlessWaves) {
            progressValue = data.endlessWaves;
            shouldUpdate = true;
          }
          break;
        case 'total_score':
          if (data.totalScore) {
            progressValue = data.totalScore;
            shouldUpdate = true;
          }
          break;
      }

      if (shouldUpdate) {
        // Try to upsert progress
        const existing = progress.find(p => p.challenge_id === challenge.id);
        
        if (existing) {
          const newProgress = challenge.requirement_type === 'complete_rush' 
            ? existing.current_progress + progressValue
            : Math.max(existing.current_progress, progressValue);
          
          const isCompleted = newProgress >= challenge.requirement_value;

          await supabase
            .from('user_boss_rush_challenges')
            .update({ 
              current_progress: newProgress,
              is_completed: isCompleted,
            })
            .eq('id', existing.id);
        } else {
          const isCompleted = progressValue >= challenge.requirement_value;
          
          await supabase
            .from('user_boss_rush_challenges')
            .insert({
              profile_id: profileId,
              challenge_id: challenge.id,
              challenge_date: today,
              current_progress: progressValue,
              is_completed: isCompleted,
            });
        }
      }
    }

    fetchChallenges();
  }, [profileId, challenges, progress, fetchChallenges]);

  const claimReward = useCallback(async (progressId: string) => {
    if (!profileId) return { error: new Error('Not logged in') };

    const progressItem = progress.find(p => p.id === progressId);
    if (!progressItem || !progressItem.is_completed || progressItem.is_claimed) {
      return { error: new Error('Cannot claim') };
    }

    // Update claimed status
    const { error: updateError } = await supabase
      .from('user_boss_rush_challenges')
      .update({ is_claimed: true })
      .eq('id', progressId);

    if (updateError) return { error: updateError };

    // Get current coins and update
    const { data: profile } = await supabase
      .from('profiles')
      .select('coins')
      .eq('id', profileId)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({ coins: profile.coins + progressItem.challenge.reward_coins })
        .eq('id', profileId);
    }

    fetchChallenges();
    return { reward: progressItem.challenge };
  }, [profileId, progress, fetchChallenges]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  return {
    challenges,
    progress,
    loading,
    updateProgress,
    claimReward,
    refetch: fetchChallenges,
  };
}
