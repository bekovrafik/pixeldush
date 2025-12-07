import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BossRushScore {
  id: string;
  profile_id: string;
  completion_time_seconds: number;
  total_score: number;
  bosses_defeated: number;
  is_endless_mode: boolean;
  created_at: string;
  profiles: {
    username: string;
  };
}

export function useBossRushLeaderboard() {
  const [rushScores, setRushScores] = useState<BossRushScore[]>([]);
  const [endlessScores, setEndlessScores] = useState<BossRushScore[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    
    // Fetch rush mode scores (fastest times)
    const { data: rushData } = await supabase
      .from('boss_rush_scores')
      .select(`
        id,
        profile_id,
        completion_time_seconds,
        total_score,
        bosses_defeated,
        is_endless_mode,
        created_at,
        profiles (username)
      `)
      .eq('is_endless_mode', false)
      .order('completion_time_seconds', { ascending: true })
      .limit(50);

    // Fetch endless mode scores (most bosses defeated)
    const { data: endlessData } = await supabase
      .from('boss_rush_scores')
      .select(`
        id,
        profile_id,
        completion_time_seconds,
        total_score,
        bosses_defeated,
        is_endless_mode,
        created_at,
        profiles (username)
      `)
      .eq('is_endless_mode', true)
      .order('bosses_defeated', { ascending: false })
      .order('total_score', { ascending: false })
      .limit(50);

    if (rushData) setRushScores(rushData as unknown as BossRushScore[]);
    if (endlessData) setEndlessScores(endlessData as unknown as BossRushScore[]);
    
    setLoading(false);
  }, []);

  const submitScore = useCallback(async (
    profileId: string,
    completionTimeSeconds: number,
    totalScore: number,
    bossesDefeated: number,
    isEndlessMode: boolean
  ) => {
    const { data, error } = await supabase
      .from('boss_rush_scores')
      .insert({
        profile_id: profileId,
        completion_time_seconds: completionTimeSeconds,
        total_score: totalScore,
        bosses_defeated: bossesDefeated,
        is_endless_mode: isEndlessMode,
      })
      .select()
      .single();

    return { data, error };
  }, []);

  const getPersonalBest = useCallback(async (profileId: string, isEndless: boolean) => {
    const { data } = await supabase
      .from('boss_rush_scores')
      .select('*')
      .eq('profile_id', profileId)
      .eq('is_endless_mode', isEndless)
      .order(isEndless ? 'bosses_defeated' : 'completion_time_seconds', { ascending: !isEndless })
      .limit(1)
      .maybeSingle();
    
    return data;
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    rushScores,
    endlessScores,
    loading,
    fetchLeaderboard,
    submitScore,
    getPersonalBest,
  };
}
