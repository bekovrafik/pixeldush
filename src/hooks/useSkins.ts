import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CharacterSkin } from '@/types/game';

export function useSkins(profileId: string | null) {
  const [allSkins, setAllSkins] = useState<CharacterSkin[]>([]);
  const [ownedSkinIds, setOwnedSkinIds] = useState<string[]>(['default']);
  const [selectedSkin, setSelectedSkin] = useState('default');
  const [loading, setLoading] = useState(true);

  const fetchSkins = useCallback(async () => {
    setLoading(true);
    
    // Fetch all available skins
    const { data: skins } = await supabase
      .from('character_skins')
      .select('*')
      .order('price', { ascending: true });

    if (skins) {
      setAllSkins(skins as CharacterSkin[]);
    }

    // Fetch owned skins if user is logged in
    if (profileId) {
      const { data: owned } = await supabase
        .from('owned_skins')
        .select('skin_id')
        .eq('profile_id', profileId);

      if (owned) {
        const ownedIds = owned.map(o => o.skin_id);
        setOwnedSkinIds(['default', ...ownedIds]);
      }
    }
    
    setLoading(false);
  }, [profileId]);

  const purchaseSkin = useCallback(async (skinId: string) => {
    if (!profileId) return { error: new Error('Must be logged in to purchase') };

    const { data, error } = await supabase
      .from('owned_skins')
      .insert({
        profile_id: profileId,
        skin_id: skinId,
      })
      .select()
      .single();

    if (!error) {
      setOwnedSkinIds(prev => [...prev, skinId]);
    }

    return { data, error };
  }, [profileId]);

  const selectSkin = useCallback((skinId: string) => {
    if (ownedSkinIds.includes(skinId)) {
      setSelectedSkin(skinId);
      localStorage.setItem('selectedSkin', skinId);
    }
  }, [ownedSkinIds]);

  useEffect(() => {
    fetchSkins();
    const saved = localStorage.getItem('selectedSkin');
    if (saved) setSelectedSkin(saved);
  }, [fetchSkins]);

  return {
    allSkins,
    ownedSkinIds,
    selectedSkin,
    loading,
    purchaseSkin,
    selectSkin,
  };
}
