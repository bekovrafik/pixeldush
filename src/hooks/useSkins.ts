import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CharacterSkin } from '@/types/game';

export function useSkins(profileId: string | null, isVip: boolean = false) {
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

  // Compute effective owned skins (including VIP auto-unlocks)
  const effectiveOwnedSkinIds = useCallback(() => {
    if (!isVip) return ownedSkinIds;
    
    // VIP users get all premium/VIP skins automatically
    const vipSkinIds = allSkins
      .filter(skin => skin.is_premium)
      .map(skin => skin.id);
    
    return [...new Set([...ownedSkinIds, ...vipSkinIds])];
  }, [isVip, ownedSkinIds, allSkins]);

  const purchaseSkin = useCallback(async (skinId: string, currentCoins: number) => {
    if (!profileId) return { error: new Error('Must be logged in to purchase') };

    // Find the skin to get its price
    const skin = allSkins.find(s => s.id === skinId);
    if (!skin) return { error: new Error('Skin not found') };

    // VIP users can use premium skins for free (no purchase needed)
    if (isVip && skin.is_premium) {
      return { data: { skin_id: skinId }, error: null };
    }

    // Check if user has enough coins
    if (currentCoins < skin.price) {
      return { error: new Error('Not enough coins') };
    }

    // Deduct coins from profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ coins: currentCoins - skin.price })
      .eq('id', profileId);

    if (updateError) {
      return { error: new Error('Failed to deduct coins') };
    }

    // Add skin to owned_skins
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
    } else {
      // Refund coins if skin purchase failed
      await supabase
        .from('profiles')
        .update({ coins: currentCoins })
        .eq('id', profileId);
    }

    return { data, error };
  }, [profileId, allSkins, isVip]);

  const selectSkin = useCallback((skinId: string) => {
    const effectiveOwned = effectiveOwnedSkinIds();
    if (effectiveOwned.includes(skinId)) {
      setSelectedSkin(skinId);
      localStorage.setItem('selectedSkin', skinId);
    }
  }, [effectiveOwnedSkinIds]);

  const getSelectedSkinData = useCallback(() => {
    return allSkins.find(s => s.id === selectedSkin) || null;
  }, [allSkins, selectedSkin]);

  useEffect(() => {
    fetchSkins();
    const saved = localStorage.getItem('selectedSkin');
    if (saved) setSelectedSkin(saved);
  }, [fetchSkins]);

  return {
    allSkins,
    ownedSkinIds: effectiveOwnedSkinIds(),
    selectedSkin,
    loading,
    purchaseSkin,
    selectSkin,
    getSelectedSkinData,
    refetchSkins: fetchSkins,
  };
}
