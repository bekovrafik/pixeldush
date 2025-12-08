import { Purchases, LOG_LEVEL, PurchasesPackage, CustomerInfo, PACKAGE_TYPE } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

export interface CoinPack {
  id: string;
  name: string;
  coins: number;
  price: string;
  productId: string;
  popular?: boolean;
}

export interface PremiumSkin {
  id: string;           // RevenueCat product ID
  skinId: string;       // Database character_skins ID
  name: string;
  description: string;
  productId: string;
  price: string;
  badge?: 'popular' | 'best_value' | 'new';
}

// Define your product IDs (must match RevenueCat/App Store/Play Store)
export const COIN_PACKS: CoinPack[] = [
  { id: 'coins_100', name: 'Starter Pack', coins: 100, price: '$0.99', productId: 'coins_100' },
  { id: 'coins_500', name: 'Value Pack', coins: 500, price: '$3.99', productId: 'coins_500', popular: true },
  { id: 'coins_1000', name: 'Mega Pack', coins: 1000, price: '$6.99', productId: 'coins_1000' },
  { id: 'coins_5000', name: 'Ultimate Pack', coins: 5000, price: '$24.99', productId: 'coins_5000' },
];

// Premium skins - skinId must match character_skins table in database
export const PREMIUM_SKINS: PremiumSkin[] = [
  { 
    id: 'skin_cosmic_guardian', 
    skinId: 'cosmic_guardian',
    name: 'Cosmic Guardian', 
    description: 'Stellar power from distant galaxies', 
    productId: 'skin_cosmic_guardian', 
    price: '$4.99',
    badge: 'popular',
  },
  { 
    id: 'skin_frost_queen', 
    skinId: 'frost_queen',
    name: 'Frost Queen', 
    description: 'Command the power of ice', 
    productId: 'skin_frost_queen', 
    price: '$3.99',
    badge: 'new',
  },
  { 
    id: 'skin_thunder_lord', 
    skinId: 'thunder_lord',
    name: 'Thunder Lord', 
    description: 'Harness the storm\'s fury', 
    productId: 'skin_thunder_lord', 
    price: '$5.99',
  },
  { 
    id: 'skin_phoenix', 
    skinId: 'phoenix',
    name: 'Phoenix Flame', 
    description: 'Rise from the ashes', 
    productId: 'skin_phoenix', 
    price: '$7.99',
    badge: 'best_value',
  },
];

export interface Subscription {
  id: string;
  name: string;
  description: string;
  productId: string;
  price: string;
  period: 'monthly' | 'yearly';
  benefits: string[];
}

// VIP Subscription products (must match RevenueCat/App Store/Play Store)
export const SUBSCRIPTIONS: Subscription[] = [
  { 
    id: 'vip_monthly', 
    name: 'VIP Monthly', 
    description: 'All VIP benefits, billed monthly',
    productId: 'vip_monthly', 
    price: '$4.99/mo',
    period: 'monthly',
    benefits: [
      'Ad-free gameplay',
      '2x coin earnings',
      'Exclusive VIP skins',
      'Free daily revives',
      'Early access to new features',
    ],
  },
  { 
    id: 'vip_yearly', 
    name: 'VIP Yearly', 
    description: 'All VIP benefits, save 40%',
    productId: 'vip_yearly', 
    price: '$29.99/yr',
    period: 'yearly',
    benefits: [
      'All monthly benefits',
      '40% savings vs monthly',
      'Bonus 5000 coins',
      'Exclusive yearly badge',
    ],
  },
];

// RevenueCat Offering ID - this is your specific offering
const REVENUECAT_OFFERING_ID = 'ofrngec986c853f';

class PurchaseManager {
  private initialized = false;
  private packages: PurchasesPackage[] = [];
  private customerInfo: CustomerInfo | null = null;
  private productPrices: Map<string, string> = new Map();

  async initialize(): Promise<void> {
    if (this.initialized || !Capacitor.isNativePlatform()) {
      console.log('[PurchaseManager] Skipping init - already initialized or not native platform');
      return;
    }

    try {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      
      const apiKey = import.meta.env.VITE_REVENUECAT_API_KEY;
      if (!apiKey) {
        console.error('[PurchaseManager] RevenueCat API key not configured');
        return;
      }

      await Purchases.configure({
        apiKey,
      });

      this.initialized = true;
      console.log('[PurchaseManager] RevenueCat initialized successfully');

      // Fetch offerings and update product prices
      await this.fetchOfferings();
    } catch (error) {
      console.error('[PurchaseManager] RevenueCat initialization failed:', error);
    }
  }

  async fetchOfferings(): Promise<void> {
    if (!this.initialized || !Capacitor.isNativePlatform()) {
      console.log('[PurchaseManager] Skipping fetchOfferings - not initialized or not native');
      return;
    }

    try {
      const offerings = await Purchases.getOfferings();
      console.log('[PurchaseManager] All offerings:', Object.keys(offerings.all));
      
      // Try to get the specific offering by ID, fallback to current
      const targetOffering = offerings.all[REVENUECAT_OFFERING_ID] || offerings.current;
      
      if (targetOffering) {
        console.log('[PurchaseManager] Using offering:', targetOffering.identifier);
        console.log('[PurchaseManager] Available packages:', targetOffering.availablePackages.length);
        
        this.packages = targetOffering.availablePackages;
        
        // Log each package for debugging
        this.packages.forEach((pkg, index) => {
          console.log(`[PurchaseManager] Package ${index}:`, {
            identifier: pkg.identifier,
            packageType: pkg.packageType,
            productId: pkg.product?.identifier,
            price: pkg.product?.priceString,
          });
          
          // Store the price for each product
          if (pkg.product) {
            this.productPrices.set(pkg.product.identifier, pkg.product.priceString);
          }
        });
      } else {
        console.warn('[PurchaseManager] No offering found with ID:', REVENUECAT_OFFERING_ID);
      }
    } catch (error) {
      console.error('[PurchaseManager] Failed to fetch offerings:', error);
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    try {
      const info = await Purchases.getCustomerInfo();
      this.customerInfo = info.customerInfo;
      return info.customerInfo;
    } catch (error) {
      console.error('Failed to get customer info:', error);
      return null;
    }
  }

  // Purchase product - routes to RevenueCat (native) or Stripe (web)
  async purchaseProduct(productId: string): Promise<{ success: boolean; error?: string; url?: string }> {
    // Web: Use Stripe checkout
    if (!Capacitor.isNativePlatform()) {
      console.log('[PurchaseManager] Using Stripe checkout for web:', productId);
      return this.startStripeCheckout(productId);
    }

    // Native: Use RevenueCat
    if (!this.initialized) {
      return { success: false, error: 'Store not initialized' };
    }

    try {
      // First try to find the package with this product ID
      const pkg = this.packages.find(p => p.product?.identifier === productId);
      
      if (pkg) {
        console.log('[PurchaseManager] Found package for product:', productId);
        const result = await Purchases.purchasePackage({ aPackage: pkg });
        if (result.customerInfo) {
          this.customerInfo = result.customerInfo;
          return { success: true };
        }
      } else {
        console.log('[PurchaseManager] No package found, trying direct product purchase:', productId);
        // Fallback to direct product purchase
        const result = await Purchases.purchaseStoreProduct({
          product: { identifier: productId } as any,
        });

        if (result.customerInfo) {
          this.customerInfo = result.customerInfo;
          return { success: true };
        }
      }

      return { success: false, error: 'Purchase failed' };
    } catch (error: any) {
      if (error.userCancelled) {
        return { success: false, error: 'Purchase cancelled' };
      }
      console.error('[PurchaseManager] Purchase error:', error);
      return { success: false, error: error.message || 'Purchase failed' };
    }
  }

  // Stripe checkout for web
  private async startStripeCheckout(productId: string): Promise<{ success: boolean; error?: string; url?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { productId },
      });

      if (error) {
        console.error('[PurchaseManager] Stripe checkout error:', error);
        return { success: false, error: error.message || 'Failed to create checkout' };
      }

      if (data?.url) {
        // Open checkout in new tab
        window.open(data.url, '_blank');
        return { success: true, url: data.url };
      }

      return { success: false, error: 'No checkout URL returned' };
    } catch (err) {
      console.error('[PurchaseManager] Stripe exception:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  async purchasePackage(packageId: string): Promise<{ success: boolean; error?: string }> {
    if (!Capacitor.isNativePlatform()) {
      console.log('[PurchaseManager] Using Stripe for package:', packageId);
      return this.startStripeCheckout(packageId);
    }

    const pkg = this.packages.find(p => p.identifier === packageId || p.product?.identifier === packageId);
    if (!pkg) {
      console.error('[PurchaseManager] Package not found:', packageId);
      console.log('[PurchaseManager] Available packages:', this.packages.map(p => p.identifier));
      return { success: false, error: 'Package not found' };
    }

    try {
      console.log('[PurchaseManager] Purchasing package:', pkg.identifier);
      const result = await Purchases.purchasePackage({ aPackage: pkg });

      if (result.customerInfo) {
        this.customerInfo = result.customerInfo;
        return { success: true };
      }

      return { success: false, error: 'Purchase failed' };
    } catch (error: any) {
      if (error.userCancelled) {
        return { success: false, error: 'Purchase cancelled' };
      }
      console.error('[PurchaseManager] Purchase error:', error);
      return { success: false, error: error.message || 'Purchase failed' };
    }
  }

  async restorePurchases(): Promise<{ success: boolean; error?: string }> {
    if (!Capacitor.isNativePlatform()) {
      return { success: true };
    }

    try {
      const result = await Purchases.restorePurchases();
      this.customerInfo = result.customerInfo;
      return { success: true };
    } catch (error: any) {
      console.error('Restore error:', error);
      return { success: false, error: error.message || 'Restore failed' };
    }
  }

  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  getPackages(): PurchasesPackage[] {
    return this.packages;
  }

  async setUserId(userId: string): Promise<void> {
    if (!this.initialized || !Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await Purchases.logIn({ appUserID: userId });
    } catch (error) {
      console.error('Failed to set user ID:', error);
    }
  }

  // Check if user has active VIP subscription
  async checkVipSubscription(): Promise<{ isVip: boolean; expiresAt: string | null; willRenew: boolean }> {
    if (!Capacitor.isNativePlatform()) {
      return { isVip: false, expiresAt: null, willRenew: false };
    }

    try {
      const info = await this.getCustomerInfo();
      if (!info) return { isVip: false, expiresAt: null, willRenew: false };

      const vipEntitlement = info.entitlements.active['vip'];
      if (vipEntitlement) {
        return {
          isVip: true,
          expiresAt: vipEntitlement.expirationDate || null,
          willRenew: vipEntitlement.willRenew,
        };
      }

      return { isVip: false, expiresAt: null, willRenew: false };
    } catch (error) {
      console.error('Failed to check VIP subscription:', error);
      return { isVip: false, expiresAt: null, willRenew: false };
    }
  }

  // Check if subscription is paused (Google Play feature)
  async checkSubscriptionPauseStatus(): Promise<{ isPaused: boolean; resumeDate: string | null }> {
    if (!Capacitor.isNativePlatform()) {
      return { isPaused: false, resumeDate: null };
    }

    try {
      const info = await this.getCustomerInfo();
      if (!info) return { isPaused: false, resumeDate: null };

      // RevenueCat handles pause states through entitlement status
      const vipEntitlement = info.entitlements.active['vip'];
      if (vipEntitlement) {
        // If willRenew is false but subscription is still active, it may be paused or cancelled
        const isPaused = !vipEntitlement.willRenew && vipEntitlement.isActive;
        return {
          isPaused,
          resumeDate: isPaused ? vipEntitlement.expirationDate || null : null,
        };
      }

      return { isPaused: false, resumeDate: null };
    } catch (error) {
      console.error('Failed to check pause status:', error);
      return { isPaused: false, resumeDate: null };
    }
  }

  // Purchase subscription - routes to RevenueCat (native) or Stripe (web)
  async purchaseSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    if (!Capacitor.isNativePlatform()) {
      console.log('[PurchaseManager] Using Stripe for subscription:', subscriptionId);
      return this.startStripeCheckout(subscriptionId);
    }

    return this.purchaseProduct(subscriptionId);
  }
}

export const purchaseManager = new PurchaseManager();
