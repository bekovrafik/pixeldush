import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Achievement } from '@/types/game';

export function useAchievements(profileId: string | null) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = useCallback(async () => {
    setLoading(true);
    
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*')
      .order('requirement_value', { ascending: true });

    if (allAchievements) {
      setAchievements(allAchievements as Achievement[]);
    }

    if (profileId) {
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('profile_id', profileId);

      if (userAchievements) {
        setUnlockedIds(userAchievements.map(ua => ua.achievement_id));
      }
    }
    
    setLoading(false);
  }, [profileId]);

  const checkAndUnlockAchievements = useCallback(async (stats: {
    score: number;
    distance: number;
    coins: number;
    runs: number;
    streak: number;
  }) => {
    if (!profileId) return [];

    const newUnlocks: Achievement[] = [];
    
    for (const achievement of achievements) {
      if (unlockedIds.includes(achievement.id)) continue;

      let shouldUnlock = false;
      switch (achievement.requirement_type) {
        case 'score':
          shouldUnlock = stats.score >= achievement.requirement_value;
          break;
        case 'distance':
          shouldUnlock = stats.distance >= achievement.requirement_value;
          break;
        case 'coins':
          shouldUnlock = stats.coins >= achievement.requirement_value;
          break;
        case 'runs':
          shouldUnlock = stats.runs >= achievement.requirement_value;
          break;
        case 'streak':
          shouldUnlock = stats.streak >= achievement.requirement_value;
          break;
      }

      if (shouldUnlock) {
        const { error } = await supabase
          .from('user_achievements')
          .insert({ profile_id: profileId, achievement_id: achievement.id });

        if (!error) {
          newUnlocks.push(achievement);
          setUnlockedIds(prev => [...prev, achievement.id]);
        }
      }
    }

    return newUnlocks;
  }, [profileId, achievements, unlockedIds]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  return {
    achievements,
    unlockedIds,
    loading,
    fetchAchievements,
    checkAndUnlockAchievements,
  };
}
