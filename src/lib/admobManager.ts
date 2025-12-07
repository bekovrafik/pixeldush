import { AdMob, AdMobRewardItem, RewardAdOptions, RewardAdPluginEvents, AdOptions, AdLoadInfo } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

class AdMobManager {
  private initialized = false;
  private rewardedAdLoaded = false;

  async initialize(): Promise<void> {
    if (this.initialized || !Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await AdMob.initialize();

      this.setupListeners();
      this.initialized = true;
      console.log('AdMob initialized successfully');
    } catch (error) {
      console.error('AdMob initialization failed:', error);
    }
  }

  private setupListeners(): void {
    AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
      console.log('Rewarded ad loaded');
      this.rewardedAdLoaded = true;
    });

    AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error) => {
      console.error('Rewarded ad failed to load:', error);
      this.rewardedAdLoaded = false;
    });

    AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
      console.log('Rewarded ad dismissed');
      this.rewardedAdLoaded = false;
      // Preload next ad
      this.prepareRewardedAd();
    });
  }

  async prepareRewardedAd(): Promise<void> {
    if (!this.initialized || !Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const options: RewardAdOptions = {
        adId: import.meta.env.VITE_ADMOB_REWARDED_AD_UNIT_ID || 'ca-app-pub-3940256099942544/5224354917', // Test ad unit
        isTesting: import.meta.env.DEV,
      };

      await AdMob.prepareRewardVideoAd(options);
    } catch (error) {
      console.error('Failed to prepare rewarded ad:', error);
    }
  }

  async showRewardedAd(): Promise<AdMobRewardItem | null> {
    if (!Capacitor.isNativePlatform()) {
      // Simulate reward for web/testing
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ type: 'coins', amount: 1 });
        }, 1500);
      });
    }

    if (!this.initialized || !this.rewardedAdLoaded) {
      console.log('Rewarded ad not ready');
      return null;
    }

    try {
      const result = await AdMob.showRewardVideoAd();
      return result;
    } catch (error) {
      console.error('Failed to show rewarded ad:', error);
      return null;
    }
  }

  isReady(): boolean {
    if (!Capacitor.isNativePlatform()) {
      return true; // Always ready for web simulation
    }
    return this.initialized && this.rewardedAdLoaded;
  }
}

export const admobManager = new AdMobManager();
