import { Purchases, LOG_LEVEL, PurchasesPackage, CustomerInfo } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

export interface CoinPack {
  id: string;
  name: string;
  coins: number;
  price: string;
  productId: string;
  popular?: boolean;
}

export interface PremiumSkin {
  id: string;
  name: string;
  description: string;
  productId: string;
  price: string;
}

// Define your product IDs (must match RevenueCat/App Store/Play Store)
export const COIN_PACKS: CoinPack[] = [
  { id: 'coins_100', name: 'Starter Pack', coins: 100, price: '$0.99', productId: 'coins_100' },
  { id: 'coins_500', name: 'Value Pack', coins: 500, price: '$3.99', productId: 'coins_500', popular: true },
  { id: 'coins_1000', name: 'Mega Pack', coins: 1000, price: '$6.99', productId: 'coins_1000' },
  { id: 'coins_5000', name: 'Ultimate Pack', coins: 5000, price: '$24.99', productId: 'coins_5000' },
];

export const PREMIUM_SKINS: PremiumSkin[] = [
  { id: 'skin_golden', name: 'Golden Runner', description: 'Shimmering gold character', productId: 'skin_golden', price: '$2.99' },
  { id: 'skin_neon', name: 'Neon Blaze', description: 'Glowing neon effects', productId: 'skin_neon', price: '$2.99' },
  { id: 'skin_robot', name: 'Mech Warrior', description: 'Futuristic robot skin', productId: 'skin_robot', price: '$4.99' },
  { id: 'skin_dragon', name: 'Dragon Spirit', description: 'Legendary dragon form', productId: 'skin_dragon', price: '$4.99' },
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

// RevenueCat Offering ID
const REVENUECAT_OFFERING_ID = 'ofrngec986c853f';

class PurchaseManager {
  private initialized = false;
  private packages: PurchasesPackage[] = [];
  private customerInfo: CustomerInfo | null = null;

  async initialize(): Promise<void> {
    if (this.initialized || !Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      
      const apiKey = import.meta.env.VITE_REVENUECAT_API_KEY;
      if (!apiKey) {
        console.error('RevenueCat API key not configured');
        return;
      }

      await Purchases.configure({
        apiKey,
      });

      this.initialized = true;
      console.log('RevenueCat initialized successfully');

      // Fetch offerings
      await this.fetchOfferings();
    } catch (error) {
      console.error('RevenueCat initialization failed:', error);
    }
  }

  async fetchOfferings(): Promise<void> {
    if (!this.initialized || !Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const offerings = await Purchases.getOfferings();
      
      // Use the specific offering ID, fallback to current offering
      const targetOffering = offerings.all[REVENUECAT_OFFERING_ID] || offerings.current;
      
      if (targetOffering?.availablePackages) {
        this.packages = targetOffering.availablePackages;
        console.log('Loaded packages from offering:', REVENUECAT_OFFERING_ID, this.packages.length);
      }
    } catch (error) {
      console.error('Failed to fetch offerings:', error);
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

  async purchaseProduct(productId: string): Promise<{ success: boolean; error?: string }> {
    if (!Capacitor.isNativePlatform()) {
      // Simulate purchase for web/testing
      console.log('Simulating purchase for:', productId);
      return { success: true };
    }

    if (!this.initialized) {
      return { success: false, error: 'Store not initialized' };
    }

    try {
      const result = await Purchases.purchaseStoreProduct({
        product: { identifier: productId } as any,
      });

      if (result.customerInfo) {
        this.customerInfo = result.customerInfo;
        return { success: true };
      }

      return { success: false, error: 'Purchase failed' };
    } catch (error: any) {
      if (error.userCancelled) {
        return { success: false, error: 'Purchase cancelled' };
      }
      console.error('Purchase error:', error);
      return { success: false, error: error.message || 'Purchase failed' };
    }
  }

  async purchasePackage(packageId: string): Promise<{ success: boolean; error?: string }> {
    if (!Capacitor.isNativePlatform()) {
      // Simulate purchase for web/testing
      console.log('Simulating package purchase for:', packageId);
      return { success: true };
    }

    const pkg = this.packages.find(p => p.identifier === packageId);
    if (!pkg) {
      return { success: false, error: 'Package not found' };
    }

    try {
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
      console.error('Purchase error:', error);
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

  // Purchase subscription
  async purchaseSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Simulating subscription purchase for:', subscriptionId);
      return { success: true };
    }

    return this.purchaseProduct(subscriptionId);
  }
}

export const purchaseManager = new PurchaseManager();
