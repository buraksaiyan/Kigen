// Expo Go compatible usage stats module (no native modules)
interface UsageStatsModule {
  hasUsageStatsPermission(): Promise<boolean>;
  requestUsageStatsPermission(): Promise<void>;
  getUsageStats(): Promise<{
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
}

// Fallback implementation for Expo Go
const UsageStatsNative: UsageStatsModule = {
  hasUsageStatsPermission: () => Promise.resolve(false),
  requestUsageStatsPermission: () => Promise.reject(new Error('Native module not available in Expo Go')),
  getUsageStats: () => Promise.resolve({
    totalScreenTime: 0,
    pickups: 0,
    notifications: 0,
    apps: []
  })
};

export default UsageStatsNative;
