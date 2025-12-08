import { AdMob, AdMobRewardItem, RewardAdOptions, RewardAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// Production and Test Ad Unit IDs
const PRODUCTION_REWARDED_AD_UNIT_ID = 'ca-app-pub-7841436065695087/1940442636';
const TEST_REWARDED_AD_UNIT_ID = 'ca-app-pub-3940256099942544/5224354917';

class AdMobManager {
  private initialized = false;
  private rewardedAdLoaded = false;
  private pendingReward: AdMobRewardItem | null = null;
  private rewardResolver: ((reward: AdMobRewardItem | null) => void) | null = null;

  private getAdUnitId(): string {
    const isDev = import.meta.env.DEV;
    const adUnitId = isDev ? TEST_REWARDED_AD_UNIT_ID : PRODUCTION_REWARDED_AD_UNIT_ID;
    console.log(`AdMob: Using ${isDev ? 'TEST' : 'PRODUCTION'} ad unit: ${adUnitId}`);
    return adUnitId;
  }

  async initialize(): Promise<void> {
    if (this.initialized || !Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await AdMob.initialize();
      this.setupListeners();
      this.initialized = true;
      console.log('AdMob initialized successfully');
      
      // Preload first ad immediately
      this.prepareRewardedAd();
    } catch (error) {
      console.error('AdMob initialization failed:', error);
    }
  }

  private setupListeners(): void {
    // Ad loaded successfully
    AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
      console.log('AdMob: Rewarded ad loaded');
      this.rewardedAdLoaded = true;
    });

    // Ad failed to load
    AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error) => {
      console.error('AdMob: Rewarded ad failed to load:', error);
      this.rewardedAdLoaded = false;
      
      // Retry loading after 30 seconds
      setTimeout(() => {
        console.log('AdMob: Retrying to load rewarded ad...');
        this.prepareRewardedAd();
      }, 30000);
    });

    // User earned reward (watched full ad)
    AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
      console.log('AdMob: User earned reward:', reward);
      this.pendingReward = reward;
    });

    // Ad dismissed
    AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
      console.log('AdMob: Rewarded ad dismissed');
      this.rewardedAdLoaded = false;
      
      // Resolve with pending reward if earned
      if (this.rewardResolver) {
        this.rewardResolver(this.pendingReward);
        this.rewardResolver = null;
        this.pendingReward = null;
      }
      
      // Preload next ad
      this.prepareRewardedAd();
    });

    // Ad failed to show
    AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error) => {
      console.error('AdMob: Rewarded ad failed to show:', error);
      this.rewardedAdLoaded = false;
      
      if (this.rewardResolver) {
        this.rewardResolver(null);
        this.rewardResolver = null;
      }
      
      // Try to load a new ad
      this.prepareRewardedAd();
    });
  }

  async prepareRewardedAd(): Promise<void> {
    if (!this.initialized || !Capacitor.isNativePlatform()) {
      return;
    }

    if (this.rewardedAdLoaded) {
      console.log('AdMob: Rewarded ad already loaded');
      return;
    }

    try {
      const options: RewardAdOptions = {
        adId: this.getAdUnitId(),
        isTesting: import.meta.env.DEV,
      };

      console.log('AdMob: Preparing rewarded ad...');
      await AdMob.prepareRewardVideoAd(options);
    } catch (error) {
      console.error('AdMob: Failed to prepare rewarded ad:', error);
    }
  }

  async showRewardedAd(): Promise<AdMobRewardItem | null> {
    if (!Capacitor.isNativePlatform()) {
      // Simulate reward for web/testing
      console.log('AdMob: Simulating reward for web platform');
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ type: 'coins', amount: 1 });
        }, 1500);
      });
    }

    if (!this.initialized) {
      console.log('AdMob: Not initialized');
      return null;
    }

    if (!this.rewardedAdLoaded) {
      console.log('AdMob: Rewarded ad not ready, attempting to load...');
      await this.prepareRewardedAd();
      return null;
    }

    try {
      console.log('AdMob: Showing rewarded ad...');
      this.pendingReward = null;
      
      // Create a promise that resolves when ad is dismissed
      const rewardPromise = new Promise<AdMobRewardItem | null>((resolve) => {
        this.rewardResolver = resolve;
      });
      
      await AdMob.showRewardVideoAd();
      
      // Wait for ad dismissal and get reward
      return rewardPromise;
    } catch (error) {
      console.error('AdMob: Failed to show rewarded ad:', error);
      this.rewardResolver = null;
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
