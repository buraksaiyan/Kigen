import { Platform, Alert } from 'react-native';
import { nativeUsageTracker } from './nativeUsageTracker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DigitalWellbeingStats {
  totalScreenTime: number;
  pickups: number;
  notifications: number;
  apps: Array<{
    packageName: string;
    appName: string;
    timeInForeground: number;
    lastTimeUsed: number;
    launchCount: number;
    icon?: string;
  }>;
  lastUpdated: number;
}

class DigitalWellbeingService {
  private static instance: DigitalWellbeingService;

  static getInstance(): DigitalWellbeingService {
    if (!DigitalWellbeingService.instance) {
      DigitalWellbeingService.instance = new DigitalWellbeingService();
    }
    return DigitalWellbeingService.instance;
  }

  /**
   * Check if we can access usage statistics
   * This checks for proper usage access permission
   */
  async canAccessUsageStats(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    return await nativeUsageTracker.hasUsageAccessPermission();
  }

  /**
   * Request usage access permission following Android guidelines
   * This follows the proper special permission workflow
   */
  async requestUsageAccess(): Promise<void> {
    if (Platform.OS !== 'android') {
      throw new Error('Usage access is only available on Android');
    }

    // Show rationale first (Android best practice)
    return new Promise((resolve, reject) => {
      Alert.alert(
        'Enable Usage Access',
        'Kigen needs access to your app usage data to help you understand and manage your digital wellbeing.\n\nThis permission allows us to:\n• Show your daily screen time\n• Track app usage patterns\n• Help you set healthy digital habits\n\nYou can revoke this permission at any time in Settings.',
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => reject(new Error('User declined permission'))
          },
          {
            text: 'Enable Access',
            onPress: async () => {
              try {
                await nativeUsageTracker.requestUsageAccessPermission();
                resolve();
              } catch (error) {
                reject(error);
              }
            }
          }
        ]
      );
    });
  }

  /**
   * Get today's usage statistics
   */
  async getTodaysStats(): Promise<DigitalWellbeingStats | null> {
    try {
      const canAccess = await this.canAccessUsageStats();
      if (!canAccess) {
        return null;
      }

      const stats = await nativeUsageTracker.getUsageStats();
      if (!stats) return null;

      // Get app icons for better UI
      const icons = await nativeUsageTracker.getAppIcons();
      
      // Add icons to app data
      const appsWithIcons = stats.apps.map(app => ({
        ...app,
        icon: icons[app.packageName]
      }));

      return {
        ...stats,
        apps: appsWithIcons
      };
    } catch (error) {
      console.error('Error getting today\'s stats:', error);
      return null;
    }
  }

  /**
   * Get usage statistics for a specific date range
   */
  async getStatsForRange(startTime: number, endTime: number): Promise<DigitalWellbeingStats | null> {
    try {
      const canAccess = await this.canAccessUsageStats();
      if (!canAccess) {
        return null;
      }

      const stats = await nativeUsageTracker.getUsageStatsForRange(startTime, endTime);
      if (!stats) return null;

      // Get app icons
      const icons = await nativeUsageTracker.getAppIcons();
      
      const appsWithIcons = stats.apps.map(app => ({
        ...app,
        icon: icons[app.packageName]
      }));

      return {
        ...stats,
        apps: appsWithIcons
      };
    } catch (error) {
      console.error('Error getting stats for range:', error);
      return null;
    }
  }

  /**
   * Check for Digital Wellbeing app integration
   * This tries to use system Digital Wellbeing APIs when available
   */
  async hasDigitalWellbeingIntegration(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    
    try {
      // Check if the device has Digital Wellbeing
      // This would be implemented in native code to check for
      // com.google.android.apps.wellbeing package
      return false; // Placeholder - would need native implementation
    } catch (error) {
      return false;
    }
  }

  /**
   * Try to fetch data from Digital Wellbeing if available
   * This would use Content Provider or Intent-based communication
   */
  async fetchFromDigitalWellbeing(): Promise<DigitalWellbeingStats | null> {
    if (Platform.OS !== 'android') return null;

    try {
      const hasIntegration = await this.hasDigitalWellbeingIntegration();
      if (!hasIntegration) return null;

      // This would be implemented in native code to:
      // 1. Query Digital Wellbeing's content provider (if public)
      // 2. Use intent-based communication
      // 3. Parse Digital Wellbeing's data format
      
      return null; // Placeholder - would need native implementation
    } catch (error) {
      console.error('Error fetching from Digital Wellbeing:', error);
      return null;
    }
  }

  /**
   * Get comprehensive usage data from all available sources
   */
  async getComprehensiveStats(): Promise<DigitalWellbeingStats | null> {
    try {
      // Try Digital Wellbeing first (if available)
      let stats = await this.fetchFromDigitalWellbeing();
      
      if (!stats) {
        // Fallback to our native implementation
        stats = await this.getTodaysStats();
      }

      return stats;
    } catch (error) {
      console.error('Error getting comprehensive stats:', error);
      return null;
    }
  }

  /**
   * Format time for display
   */
  formatTime(milliseconds: number): string {
    const totalMinutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Calculate percentage of total screen time
   */
  calculatePercentage(appTime: number, totalTime: number): number {
    if (totalTime === 0) return 0;
    return Math.round((appTime / totalTime) * 100);
  }

  /**
   * Get usage trends (compare with previous periods)
   */
  async getUsageTrends(): Promise<{
    todayVsYesterday: number;
    thisWeekVsLastWeek: number;
    screenTimeGoal?: number;
  } | null> {
    try {
      const canAccess = await this.canAccessUsageStats();
      if (!canAccess) return null;

      const now = Date.now();
      const todayStart = new Date(now).setHours(0, 0, 0, 0);
      const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
      const yesterdayEnd = todayStart - 1;

      const todayStats = await this.getStatsForRange(todayStart, now);
      const yesterdayStats = await this.getStatsForRange(yesterdayStart, yesterdayEnd);

      if (!todayStats || !yesterdayStats) return null;

      const todayVsYesterday = todayStats.totalScreenTime - yesterdayStats.totalScreenTime;

      // Get user's screen time goal from storage
      const goalString = await AsyncStorage.getItem('screen_time_goal');
      const screenTimeGoal = goalString ? parseInt(goalString, 10) : undefined;

      return {
        todayVsYesterday,
        thisWeekVsLastWeek: 0, // Would need week-over-week calculation
        screenTimeGoal
      };
    } catch (error) {
      console.error('Error getting usage trends:', error);
      return null;
    }
  }

  /**
   * Set screen time goal
   */
  async setScreenTimeGoal(goalMinutes: number): Promise<void> {
    try {
      await AsyncStorage.setItem('screen_time_goal', goalMinutes.toString());
    } catch (error) {
      console.error('Error setting screen time goal:', error);
    }
  }
}

export const digitalWellbeingService = DigitalWellbeingService.getInstance();
