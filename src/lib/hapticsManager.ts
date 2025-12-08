import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

class HapticsManager {
  private isNative: boolean = false;

  constructor() {
    // Check if we're running in a native Capacitor environment
    this.isNative = typeof (window as any).Capacitor !== 'undefined';
  }

  async lightImpact() {
    if (!this.isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }

  async mediumImpact() {
    if (!this.isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }

  async heavyImpact() {
    if (!this.isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }

  async successNotification() {
    if (!this.isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }

  async warningNotification() {
    if (!this.isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }

  async errorNotification() {
    if (!this.isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }

  async vibrate(duration: number = 100) {
    if (!this.isNative) return;
    try {
      await Haptics.vibrate({ duration });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }
}

export const hapticsManager = new HapticsManager();
