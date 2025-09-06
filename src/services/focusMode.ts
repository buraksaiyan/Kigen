import { Platform, AppState, NativeModules } from 'react-native';

export interface UsageData {
  unlocks: number;
  appUsageMinutes: number;
  sessionStartTime: string;
  sessionEndTime: string;
}

export interface FocusMode {
  isActive: boolean;
  sessionId: string;
  startTime: Date;
  unlocks: number;
  appUsageMinutes: number;
  onUsageUpdate?: (data: UsageData) => void;
}

class FocusModeService {
  private focusMode: FocusMode | null = null;
  private appStateSubscription: any = null;
  private usageTrackingInterval: NodeJS.Timeout | null = null;

  async startFocusMode(sessionId: string, onUsageUpdate?: (data: UsageData) => void): Promise<boolean> {
    try {
      // Stop any existing session
      if (this.focusMode?.isActive) {
        await this.stopFocusMode();
      }

      // Initialize focus mode
      this.focusMode = {
        isActive: true,
        sessionId,
        startTime: new Date(),
        unlocks: 0,
        appUsageMinutes: 0,
        onUsageUpdate,
      };

      // Set up app state monitoring for unlocks
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

      // Start usage tracking interval (every 30 seconds)
      this.usageTrackingInterval = setInterval(() => {
        this.trackUsage();
      }, 30000);

      // Enable Do Not Disturb mode (platform specific)
      await this.enableDoNotDisturb();

      console.log('Focus mode started:', sessionId);
      return true;
    } catch (error) {
      console.error('Error starting focus mode:', error);
      return false;
    }
  }

  async stopFocusMode(): Promise<UsageData | null> {
    if (!this.focusMode || !this.focusMode.isActive) {
      return null;
    }

    try {
      const sessionData: UsageData = {
        unlocks: this.focusMode.unlocks,
        appUsageMinutes: this.focusMode.appUsageMinutes,
        sessionStartTime: this.focusMode.startTime.toISOString(),
        sessionEndTime: new Date().toISOString(),
      };

      // Clean up
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
        this.appStateSubscription = null;
      }

      if (this.usageTrackingInterval) {
        clearInterval(this.usageTrackingInterval);
        this.usageTrackingInterval = null;
      }

      // Disable Do Not Disturb mode
      await this.disableDoNotDisturb();

      // Mark as inactive
      this.focusMode.isActive = false;
      this.focusMode = null;

      console.log('Focus mode stopped with data:', sessionData);
      return sessionData;
    } catch (error) {
      console.error('Error stopping focus mode:', error);
      return null;
    }
  }

  private handleAppStateChange = (nextAppState: string) => {
    if (!this.focusMode || !this.focusMode.isActive) return;

    if (nextAppState === 'active') {
      // App became active (phone was unlocked)
      this.focusMode.unlocks++;
      
      // Notify about unlock
      if (this.focusMode.onUsageUpdate) {
        this.focusMode.onUsageUpdate({
          unlocks: this.focusMode.unlocks,
          appUsageMinutes: this.focusMode.appUsageMinutes,
          sessionStartTime: this.focusMode.startTime.toISOString(),
          sessionEndTime: new Date().toISOString(),
        });
      }

      console.log('Phone unlocked during focus session. Total unlocks:', this.focusMode.unlocks);
    }
  };

  private async trackUsage() {
    if (!this.focusMode || !this.focusMode.isActive) return;

    try {
      // Get usage data from device (platform specific)
      const usageMinutes = await this.getDeviceUsage();
      this.focusMode.appUsageMinutes = usageMinutes;

      // Notify about usage update
      if (this.focusMode.onUsageUpdate) {
        this.focusMode.onUsageUpdate({
          unlocks: this.focusMode.unlocks,
          appUsageMinutes: this.focusMode.appUsageMinutes,
          sessionStartTime: this.focusMode.startTime.toISOString(),
          sessionEndTime: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  }

  private async getDeviceUsage(): Promise<number> {
    if (!this.focusMode) return 0;

    try {
      if (Platform.OS === 'android') {
        // In a real implementation, this would use a native module
        // For now, estimate based on app state changes and time
        const sessionDurationMinutes = (Date.now() - this.focusMode.startTime.getTime()) / (1000 * 60);
        const estimatedUsage = Math.min(sessionDurationMinutes * 0.1, sessionDurationMinutes); // 10% usage assumption
        return Math.round(estimatedUsage);
      } else if (Platform.OS === 'ios') {
        // In a real implementation, this would use Screen Time APIs
        const sessionDurationMinutes = (Date.now() - this.focusMode.startTime.getTime()) / (1000 * 60);
        const estimatedUsage = Math.min(sessionDurationMinutes * 0.08, sessionDurationMinutes); // 8% usage assumption
        return Math.round(estimatedUsage);
      }
    } catch (error) {
      console.error('Error getting device usage:', error);
    }

    return 0;
  }

  private async enableDoNotDisturb(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        // In a real implementation, this would use native modules to enable DND
        // For now, we'll just log the intent
        console.log('Would enable Do Not Disturb on Android');
        
        // Potential implementation with native module:
        // await NativeModules.FocusMode?.enableDoNotDisturb();
      } else if (Platform.OS === 'ios') {
        // In a real implementation, this would use Focus modes API
        console.log('Would enable Focus mode on iOS');
        
        // Potential implementation:
        // await NativeModules.FocusMode?.enableFocusMode();
      }
    } catch (error) {
      console.error('Error enabling Do Not Disturb:', error);
    }
  }

  private async disableDoNotDisturb(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        // In a real implementation, this would use native modules to disable DND
        console.log('Would disable Do Not Disturb on Android');
        
        // Potential implementation:
        // await NativeModules.FocusMode?.disableDoNotDisturb();
      } else if (Platform.OS === 'ios') {
        // In a real implementation, this would disable Focus mode
        console.log('Would disable Focus mode on iOS');
        
        // Potential implementation:
        // await NativeModules.FocusMode?.disableFocusMode();
      }
    } catch (error) {
      console.error('Error disabling Do Not Disturb:', error);
    }
  }

  getCurrentSession(): FocusMode | null {
    return this.focusMode;
  }

  isActive(): boolean {
    return this.focusMode?.isActive || false;
  }
}

// Export singleton instance
export const focusModeService = new FocusModeService();

// Helper functions for easy usage
export const startFocusSession = (sessionId: string, onUsageUpdate?: (data: UsageData) => void) => {
  return focusModeService.startFocusMode(sessionId, onUsageUpdate);
};

export const stopFocusSession = () => {
  return focusModeService.stopFocusMode();
};

export const getFocusSessionStatus = () => {
  return {
    isActive: focusModeService.isActive(),
    currentSession: focusModeService.getCurrentSession(),
  };
};
