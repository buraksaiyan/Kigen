import { Platform } from 'react-native';
import UsageTracker from '../usageTracker';

// Android usage stats retrieval using our UsageTracker
export async function getAndroidUsageSummary(): Promise<{ minutesUsed?: number }> {
  if (Platform.OS !== 'android') return {};
  
  try {
    const usageTracker = UsageTracker.getInstance();
    const stats = await usageTracker.getUsageStats(1);
    
    if (stats.length > 0) {
      const todayStats = stats[0];
      if (todayStats) {
        const minutesUsed = Math.floor(todayStats.totalScreenTime / 60000);
        return { minutesUsed };
      }
    }
    
    return { minutesUsed: undefined };
  } catch (error) {
    console.error('Error getting Android usage stats:', error);
    return { minutesUsed: undefined };
  }
}