import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/game';

interface FriendWithProfile {
  id: string;
  friendId: string;
  username: string;
  high_score: number;
  status: 'pending' | 'accepted' | 'rejected';
  isRequester: boolean;
}

export function useFriends(profileId: string | null) {
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    if (!profileId) {
      setFriends([]);
      setPendingRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch friendships where user is requester
    const { data: asRequester } = await supabase
      .from('friendships')
      .select(`
        id,
        status,
        addressee_id,
        profiles!friendships_addressee_id_fkey (
          id,
          username,
          high_score
        )
      `)
      .eq('requester_id', profileId);

    // Fetch friendships where user is addressee
    const { data: asAddressee } = await supabase
      .from('friendships')
      .select(`
        id,
        status,
        requester_id,
        profiles!friendships_requester_id_fkey (
          id,
          username,
          high_score
        )
      `)
      .eq('addressee_id', profileId);

    const allFriends: FriendWithProfile[] = [];
    const pending: FriendWithProfile[] = [];

    // Process friendships where user is requester
    (asRequester || []).forEach((f: any) => {
      const friend: FriendWithProfile = {
        id: f.id,
        friendId: f.addressee_id,
        username: f.profiles?.username || 'Unknown',
        high_score: f.profiles?.high_score || 0,
        status: f.status,
        isRequester: true,
      };
      if (f.status === 'accepted') allFriends.push(friend);
      else if (f.status === 'pending') pending.push(friend);
    });

    // Process friendships where user is addressee
    (asAddressee || []).forEach((f: any) => {
      const friend: FriendWithProfile = {
        id: f.id,
        friendId: f.requester_id,
        username: f.profiles?.username || 'Unknown',
        high_score: f.profiles?.high_score || 0,
        status: f.status,
        isRequester: false,
      };
      if (f.status === 'accepted') allFriends.push(friend);
      else if (f.status === 'pending') pending.push(friend);
    });

    setFriends(allFriends);
    setPendingRequests(pending);
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const sendFriendRequest = useCallback(async (username: string) => {
    if (!profileId) return { error: new Error('Not logged in') };

    // Find profile by username
    const { data: targetProfile, error: findError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (findError || !targetProfile) {
      return { error: new Error('User not found') };
    }

    if (targetProfile.id === profileId) {
      return { error: new Error('Cannot add yourself') };
    }

    // Check if friendship already exists
    const { data: existing } = await supabase
      .from('friendships')
      .select('id')
      .or(`and(requester_id.eq.${profileId},addressee_id.eq.${targetProfile.id}),and(requester_id.eq.${targetProfile.id},addressee_id.eq.${profileId})`)
      .maybeSingle();

    if (existing) {
      return { error: new Error('Friend request already exists') };
    }

    const { error } = await supabase
      .from('friendships')
      .insert({
        requester_id: profileId,
        addressee_id: targetProfile.id,
      });

    if (!error) fetchFriends();
    return { error };
  }, [profileId, fetchFriends]);

  const acceptFriendRequest = useCallback(async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);

    if (!error) fetchFriends();
    return { error };
  }, [fetchFriends]);

  const rejectFriendRequest = useCallback(async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'rejected' })
      .eq('id', friendshipId);

    if (!error) fetchFriends();
    return { error };
  }, [fetchFriends]);

  const removeFriend = useCallback(async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (!error) fetchFriends();
    return { error };
  }, [fetchFriends]);

  return {
    friends,
    pendingRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    refreshFriends: fetchFriends,
  };
}
