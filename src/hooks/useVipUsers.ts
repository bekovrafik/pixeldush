import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useVipUsers() {
  const [vipProfileIds, setVipProfileIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVipUsers = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('vip_subscriptions')
      .select('profile_id')
      .eq('status', 'active')
      .gt('current_period_end', new Date().toISOString());

    if (!error && data) {
      setVipProfileIds(data.map(sub => sub.profile_id));
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVipUsers();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchVipUsers, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchVipUsers]);

  return {
    vipProfileIds,
    loading,
    refresh: fetchVipUsers,
  };
}
