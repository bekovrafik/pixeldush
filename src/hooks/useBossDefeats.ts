import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BossDefeat {
  id: string;
  boss_type: string;
  kill_time_seconds: number | null;
  defeated_at: string;
  distance_at_defeat: number | null;
}

export function useBossDefeats(profileId: string | null) {
  const [defeats, setDefeats] = useState<BossDefeat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDefeats = useCallback(async () => {
    if (!profileId) {
      setDefeats([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('boss_defeats')
      .select('*')
      .eq('profile_id', profileId)
      .order('defeated_at', { ascending: false });

    if (!error && data) {
      setDefeats(data);
    }
    setLoading(false);
  }, [profileId]);

  const recordDefeat = useCallback(async (
    bossType: string, 
    killTimeSeconds?: number,
    distanceAtDefeat?: number
  ) => {
    if (!profileId) return { error: new Error('Not logged in') };

    const { data, error } = await supabase
      .from('boss_defeats')
      .insert({
        profile_id: profileId,
        boss_type: bossType,
        kill_time_seconds: killTimeSeconds || null,
        distance_at_defeat: distanceAtDefeat || null,
      })
      .select()
      .single();

    if (!error && data) {
      setDefeats(prev => [data, ...prev]);
    }

    return { data, error };
  }, [profileId]);

  const getDefeatsByBossType = useCallback((bossType: string) => {
    return defeats.filter(d => d.boss_type === bossType);
  }, [defeats]);

  const getFastestKill = useCallback((bossType: string) => {
    const bossDefeats = getDefeatsByBossType(bossType);
    const withTimes = bossDefeats.filter(d => d.kill_time_seconds !== null);
    if (withTimes.length === 0) return null;
    return Math.min(...withTimes.map(d => d.kill_time_seconds!));
  }, [getDefeatsByBossType]);

  const getTotalDefeats = useCallback((bossType: string) => {
    return getDefeatsByBossType(bossType).length;
  }, [getDefeatsByBossType]);

  useEffect(() => {
    fetchDefeats();
  }, [fetchDefeats]);

  return {
    defeats,
    loading,
    recordDefeat,
    getDefeatsByBossType,
    getFastestKill,
    getTotalDefeats,
    refetch: fetchDefeats,
  };
}
