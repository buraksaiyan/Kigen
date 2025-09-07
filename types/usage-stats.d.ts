declare module 'react-native' {
  interface NativeModulesStatic {
    UsageStats: {
      hasPermission(): Promise<boolean>;
      requestPermission(): Promise<boolean>;
      getUsageStats(startTime: number, endTime: number): Promise<Array<{
        packageName: string;
        appName: string;
        totalTimeInForeground: number;
        firstTimeStamp: number;
        lastTimeStamp: number;
      }>>;
      getTodayUsageStats(): Promise<Array<{
        packageName: string;
        appName: string;
        totalTimeInForeground: number;
        firstTimeStamp: number;
        lastTimeStamp: number;
      }>>;
      getTypedExportedConstants(): {
        INTERVAL_DAILY: number;
        INTERVAL_WEEKLY: number;
        INTERVAL_MONTHLY: number;
        INTERVAL_YEARLY: number;
      };
    };
  }
}

export {};
