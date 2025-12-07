import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LeaderboardEntry } from '@/types/game';

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select(`
        id,
        profile_id,
        score,
        distance,
        character_skin,
        created_at,
        profiles (
          username
        )
      `)
      .order('score', { ascending: false })
      .limit(100);

    if (!error && data) {
      setEntries(data as unknown as LeaderboardEntry[]);
    }
    
    setLoading(false);
  }, []);

  const submitScore = useCallback(async (
    profileId: string,
    score: number,
    distance: number,
    characterSkin: string
  ) => {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .insert({
        profile_id: profileId,
        score,
        distance: Math.floor(distance),
        character_skin: characterSkin,
      })
      .select()
      .single();

    return { data, error };
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    entries,
    loading,
    fetchLeaderboard,
    submitScore,
  };
}
