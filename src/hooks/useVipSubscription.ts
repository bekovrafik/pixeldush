import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VipStatus {
  isVip: boolean;
  subscriptionEnd: string | null;
  stripeCustomerId: string | null;
}

export function useVipSubscription(userId: string | null) {
  const [vipStatus, setVipStatus] = useState<VipStatus>({
    isVip: false,
    subscriptionEnd: null,
    stripeCustomerId: null,
  });
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!userId) {
      setVipStatus({ isVip: false, subscriptionEnd: null, stripeCustomerId: null });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-vip-subscription');
      
      if (!error && data) {
        setVipStatus({
          isVip: data.isVip || false,
          subscriptionEnd: data.subscriptionEnd || null,
          stripeCustomerId: data.stripeCustomerId || null,
        });
      }
    } catch (err) {
      console.error('Error checking VIP subscription:', err);
    }
    setLoading(false);
  }, [userId]);

  const startCheckout = useCallback(async () => {
    if (!userId) return { error: new Error('Not logged in') };

    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-vip-checkout');
      
      if (error) {
        setCheckoutLoading(false);
        return { error };
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
      
      setCheckoutLoading(false);
      return { data, error: null };
    } catch (err) {
      setCheckoutLoading(false);
      return { error: err as Error };
    }
  }, [userId]);

  const openCustomerPortal = useCallback(async () => {
    if (!userId) return { error: new Error('Not logged in') };

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        return { error };
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
      
      return { data, error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, [userId]);

  // Check subscription on mount and periodically
  useEffect(() => {
    checkSubscription();
    
    // Refresh every minute
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  // Check for success/cancel URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('vip_success') === 'true') {
      // Refresh subscription status after successful checkout
      setTimeout(checkSubscription, 2000);
    }
  }, [checkSubscription]);

  return {
    isVip: vipStatus.isVip,
    subscriptionEnd: vipStatus.subscriptionEnd,
    loading,
    checkoutLoading,
    startCheckout,
    openCustomerPortal,
    refreshStatus: checkSubscription,
  };
}
