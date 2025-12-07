import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DailyChallenge {
  id: string;
  challenge_type: string;
  title: string;
  description: string;
  target_value: number;
  reward_coins: number;
  icon: string;
}

interface UserChallengeProgress {
  id: string;
  challenge_id: string;
  current_progress: number;
  is_completed: boolean;
  is_claimed: boolean;
  challenge: DailyChallenge;
}

export function useDailyChallenges(profileId: string | null) {
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [userProgress, setUserProgress] = useState<UserChallengeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);

    // Fetch all challenges
    const { data: allChallenges } = await supabase
      .from('daily_challenges')
      .select('*');

    if (allChallenges) {
      setChallenges(allChallenges);
    }

    // Fetch user progress if logged in
    if (profileId) {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: progress } = await supabase
        .from('user_daily_challenges')
        .select('*, challenge:daily_challenges(*)')
        .eq('profile_id', profileId)
        .eq('challenge_date', today);

      if (progress) {
        setUserProgress(progress.map(p => ({
          ...p,
          challenge: p.challenge as unknown as DailyChallenge
        })));
      }

      // Initialize today's challenges if not exists
      if (allChallenges && (!progress || progress.length === 0)) {
        // Select 3 random challenges for today
        const shuffled = [...allChallenges].sort(() => 0.5 - Math.random());
        const todaysChallenges = shuffled.slice(0, 3);

        for (const challenge of todaysChallenges) {
          await supabase.from('user_daily_challenges').insert({
            profile_id: profileId,
            challenge_id: challenge.id,
            challenge_date: today,
            current_progress: 0,
            is_completed: false,
            is_claimed: false,
          });
        }

        // Refetch progress
        const { data: newProgress } = await supabase
          .from('user_daily_challenges')
          .select('*, challenge:daily_challenges(*)')
          .eq('profile_id', profileId)
          .eq('challenge_date', today);

        if (newProgress) {
          setUserProgress(newProgress.map(p => ({
            ...p,
            challenge: p.challenge as unknown as DailyChallenge
          })));
        }
      }
    }

    setLoading(false);
  }, [profileId]);

  const updateProgress = useCallback(async (gameStats: {
    score: number;
    distance: number;
    coins: number;
    powerupsCollected: number;
  }) => {
    if (!profileId || userProgress.length === 0) return;

    const today = new Date().toISOString().split('T')[0];

    for (const progress of userProgress) {
      if (progress.is_completed || progress.is_claimed) continue;

      let newProgress = progress.current_progress;
      const challenge = progress.challenge;

      switch (challenge.challenge_type) {
        case 'score':
          newProgress = Math.max(newProgress, gameStats.score);
          break;
        case 'distance':
          newProgress = Math.max(newProgress, Math.floor(gameStats.distance));
          break;
        case 'coins':
          newProgress = Math.max(newProgress, gameStats.coins);
          break;
        case 'powerups':
          newProgress = Math.max(newProgress, gameStats.powerupsCollected);
          break;
        case 'runs':
          newProgress += 1;
          break;
      }

      const isCompleted = newProgress >= challenge.target_value;

      if (newProgress !== progress.current_progress || isCompleted !== progress.is_completed) {
        await supabase
          .from('user_daily_challenges')
          .update({
            current_progress: newProgress,
            is_completed: isCompleted,
          })
          .eq('id', progress.id);
      }
    }

    // Refetch progress
    const { data: newProgress } = await supabase
      .from('user_daily_challenges')
      .select('*, challenge:daily_challenges(*)')
      .eq('profile_id', profileId)
      .eq('challenge_date', today);

    if (newProgress) {
      setUserProgress(newProgress.map(p => ({
        ...p,
        challenge: p.challenge as unknown as DailyChallenge
      })));
    }
  }, [profileId, userProgress]);

  const claimReward = useCallback(async (challengeProgressId: string) => {
    if (!profileId) return { error: new Error('Must be logged in') };

    const progress = userProgress.find(p => p.id === challengeProgressId);
    if (!progress || !progress.is_completed || progress.is_claimed) {
      return { error: new Error('Cannot claim this reward') };
    }

    // Mark as claimed
    const { error: updateError } = await supabase
      .from('user_daily_challenges')
      .update({ is_claimed: true })
      .eq('id', challengeProgressId);

    if (updateError) {
      return { error: updateError };
    }

    // Add coins to profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('coins')
      .eq('id', profileId)
      .single();

    if (profileData) {
      await supabase
        .from('profiles')
        .update({ coins: profileData.coins + progress.challenge.reward_coins })
        .eq('id', profileId);
    }

    // Update local state
    setUserProgress(prev => prev.map(p => 
      p.id === challengeProgressId ? { ...p, is_claimed: true } : p
    ));

    return { error: null, reward: progress.challenge.reward_coins };
  }, [profileId, userProgress]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  return {
    challenges,
    userProgress,
    loading,
    updateProgress,
    claimReward,
    refetch: fetchChallenges,
  };
}
