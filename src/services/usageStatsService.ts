import { NativeModules, Platform } from 'react-native';

interface UsageStatsData {
  packageName: string;
  appName: string;
  totalTimeInForeground: number;
  firstTimeStamp: number;
  lastTimeStamp: number;
}

interface UsageStatsModule {
  hasPermission(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
  getUsageStats(startTime: number, endTime: number): Promise<UsageStatsData[]>;
  getTodayUsageStats(): Promise<UsageStatsData[]>;
  getTypedExportedConstants(): {
    INTERVAL_DAILY: number;
    INTERVAL_WEEKLY: number;
    INTERVAL_MONTHLY: number;
    INTERVAL_YEARLY: number;
  };
}

class UsageStatsService {
  private module: UsageStatsModule | null = null;

  constructor() {
    if (Platform.OS === 'android') {
      this.module = NativeModules.UsageStats as UsageStatsModule;
    }
  }

  /**
   * Check if the app has usage stats permission
   */
  async hasPermission(): Promise<boolean> {
    if (!this.module) {
      console.warn('UsageStats is only available on Android');
      return false;
    }

    try {
      return await this.module.hasPermission();
    } catch (error) {
      console.error('Failed to check usage stats permission:', error);
      return false;
    }
  }

  /**
   * Request usage stats permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!this.module) {
      console.warn('UsageStats is only available on Android');
      return false;
    }

    try {
      return await this.module.requestPermission();
    } catch (error) {
      console.error('Failed to request usage stats permission:', error);
      return false;
    }
  }

  /**
   * Get usage statistics for a specific time range
   */
  async getUsageStats(startTime: number, endTime: number): Promise<UsageStatsData[]> {
    if (!this.module) {
      console.warn('UsageStats is only available on Android');
      return [];
    }

    try {
      return await this.module.getUsageStats(startTime, endTime);
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      return [];
    }
  }

  /**
   * Get today's usage statistics
   */
  async getTodayUsageStats(): Promise<UsageStatsData[]> {
    if (!this.module) {
      console.warn('UsageStats is only available on Android');
      return [];
    }

    try {
      return await this.module.getTodayUsageStats();
    } catch (error) {
      console.error("Failed to get today's usage stats:", error);
      return [];
    }
  }

  /**
   * Get constants for usage stats intervals
   */
  getConstants() {
    if (!this.module) {
      return {
        INTERVAL_DAILY: 0,
        INTERVAL_WEEKLY: 1,
        INTERVAL_MONTHLY: 2,
        INTERVAL_YEARLY: 3,
      };
    }

    return this.module.getTypedExportedConstants();
  }

  /**
   * Check if the service is available (Android only)
   */
  isAvailable(): boolean {
    return this.module !== null;
  }
}

export { UsageStatsService, type UsageStatsData };
export default new UsageStatsService();
