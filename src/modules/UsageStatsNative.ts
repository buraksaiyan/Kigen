// This file is deprecated. Please use src/services/usageStatsService.ts instead.
// This wrapper is kept for backwards compatibility.

import usageStatsService from '../services/usageStatsService';
import { generateUniqueId } from '../utils/uniqueId';

interface LegacyUsageStats {
  totalScreenTime: number;
  pickups: number;
  notifications: number;
  apps: Array<{
    id: string;
    packageName: string;
    appName: string;
    timeInForeground: number;
    lastTimeUsed: number;
    launchCount: number;
  }>;
}

/**
 * @deprecated Use usageStatsService from '../services/usageStatsService' instead
 */
const UsageStatsNative = {
  async hasUsageStatsPermission(): Promise<boolean> {
    console.warn('UsageStatsNative is deprecated. Use usageStatsService instead.');
    return usageStatsService.hasPermission();
  },

  async requestUsageStatsPermission(): Promise<void> {
    console.warn('UsageStatsNative is deprecated. Use usageStatsService instead.');
    await usageStatsService.requestPermission();
  },

  async getTodaysUsageStats(): Promise<LegacyUsageStats> {
    console.warn('UsageStatsNative is deprecated. Use usageStatsService instead.');
    const stats = await usageStatsService.getTodayUsageStats();
    
    return {
      totalScreenTime: stats.reduce((total, app) => total + app.totalTimeInForeground, 0),
      pickups: 0, // Not available in new service
      notifications: 0, // Not available in new service
      apps: stats.map(app => ({
        id: generateUniqueId(),
        packageName: app.packageName,
        appName: app.appName,
        timeInForeground: app.totalTimeInForeground,
        lastTimeUsed: app.lastTimeStamp,
        launchCount: 0, // Not available in new service
      }))
    };
  },

  async getUsageStats(startTime: number, endTime: number): Promise<LegacyUsageStats> {
    console.warn('UsageStatsNative is deprecated. Use usageStatsService instead.');
    const stats = await usageStatsService.getUsageStats(startTime, endTime);
    
    return {
      totalScreenTime: stats.reduce((total, app) => total + app.totalTimeInForeground, 0),
      pickups: 0, // Not available in new service
      notifications: 0, // Not available in new service
      apps: stats.map(app => ({
        id: generateUniqueId(),
        packageName: app.packageName,
        appName: app.appName,
        timeInForeground: app.totalTimeInForeground,
        lastTimeUsed: app.lastTimeStamp,
        launchCount: 0, // Not available in new service
      }))
    };
  },

  async getAppIcons(): Promise<{ [packageName: string]: string }> {
    console.warn('UsageStatsNative is deprecated. App icons not available in new service.');
    return {};
  }
};

export default UsageStatsNative;
