import { NativeModules } from 'react-native';

interface UsageStatsModule {
  hasUsageStatsPermission(): Promise<boolean>;
  requestUsageStatsPermission(): Promise<void>;
  getTodaysUsageStats(): Promise<{
    totalScreenTime: number;
    pickups: number;
    notifications: number;
    apps: Array<{
      packageName: string;
      appName: string;
      timeInForeground: number;
      lastTimeUsed: number;
      launchCount: number;
    }>;
  }>;
  getUsageStats(startTime: number, endTime: number): Promise<{
    totalScreenTime: number;
    pickups: number;
    notifications: number;
    apps: Array<{
      packageName: string;
      appName: string;
      timeInForeground: number;
      lastTimeUsed: number;
      launchCount: number;
    }>;
  }>;
  getAppIcons(): Promise<{ [packageName: string]: string }>;
}

// Real native module for standalone builds
const UsageStatsNative: UsageStatsModule = NativeModules.UsageStatsModule || {
  // Fallback for Expo Go
  hasUsageStatsPermission: () => Promise.resolve(false),
  requestUsageStatsPermission: () => Promise.reject(new Error('Native module not available in Expo Go')),
  getTodaysUsageStats: () => Promise.resolve({
    totalScreenTime: 0,
    pickups: 0,
    notifications: 0,
    apps: []
  }),
  getUsageStats: () => Promise.resolve({
    totalScreenTime: 0,
    pickups: 0,
    notifications: 0,
    apps: []
  }),
  getAppIcons: () => Promise.resolve({})
};

export default UsageStatsNative;
