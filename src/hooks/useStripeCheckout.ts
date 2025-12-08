import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';

interface StripeCheckoutResult {
  success: boolean;
  error?: string;
  url?: string;
}

// Map product IDs to Stripe product IDs
const STRIPE_PRODUCT_MAP: Record<string, string> = {
  // Coins
  coins_100: 'coins_100',
  coins_500: 'coins_500',
  coins_1000: 'coins_1000',
  coins_5000: 'coins_5000',
  // Skins
  skin_cosmic_guardian: 'skin_cosmic_guardian',
  skin_frost_queen: 'skin_frost_queen',
  skin_thunder_lord: 'skin_thunder_lord',
  skin_phoenix: 'skin_phoenix',
  // VIP
  vip_monthly: 'vip_monthly',
  vip_yearly: 'vip_yearly',
};

export function useStripeCheckout() {
  const [loading, setLoading] = useState(false);

  const startCheckout = useCallback(async (productId: string): Promise<StripeCheckoutResult> => {
    // Only use Stripe on web platforms
    if (Capacitor.isNativePlatform()) {
      return { success: false, error: 'Use RevenueCat on native platforms' };
    }

    const stripeProductId = STRIPE_PRODUCT_MAP[productId];
    if (!stripeProductId) {
      return { success: false, error: `Unknown product: ${productId}` };
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { productId: stripeProductId },
      });

      if (error) {
        console.error('[StripeCheckout] Error:', error);
        return { success: false, error: error.message || 'Failed to create checkout' };
      }

      if (data?.url) {
        // Open checkout in new tab
        window.open(data.url, '_blank');
        return { success: true, url: data.url };
      }

      return { success: false, error: 'No checkout URL returned' };
    } catch (err) {
      console.error('[StripeCheckout] Exception:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    } finally {
      setLoading(false);
    }
  }, []);

  const fulfillPurchase = useCallback(async (params: {
    productId?: string;
    coins?: string;
    skinId?: string;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('fulfill-purchase', {
        body: params,
      });

      if (error) {
        console.error('[StripeCheckout] Fulfill error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      console.error('[StripeCheckout] Fulfill exception:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, []);

  return {
    startCheckout,
    fulfillPurchase,
    loading,
    isWebPlatform: !Capacitor.isNativePlatform(),
  };
}

// Hook to handle payment success URL params
export function usePaymentSuccess(onSuccess?: (type: string, data: any) => void) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentSuccess = params.get('payment_success');
    
    if (paymentSuccess === 'true') {
      const productId = params.get('product');
      const coins = params.get('coins');
      const skinId = params.get('skinId');
      
      console.log('[PaymentSuccess] Detected payment success:', { productId, coins, skinId });
      
      // Clear URL params
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      
      // Trigger fulfillment
      if (onSuccess) {
        if (coins) {
          onSuccess('coins', { productId, coins: parseInt(coins) });
        } else if (skinId) {
          onSuccess('skin', { productId, skinId });
        } else if (productId?.startsWith('vip_')) {
          onSuccess('vip', { productId });
        }
      }
    }
  }, [onSuccess]);
}
