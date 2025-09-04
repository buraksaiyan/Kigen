import { Platform } from 'react-native';

// Placeholder for Android usage stats retrieval.
export async function getAndroidUsageSummary(): Promise<{ minutesUsed?: number }> {
  if (Platform.OS !== 'android') return {};
  // Integrate with UsageStatsManager or custom native module later.
  return { minutesUsed: undefined };
}