import { Platform } from 'react-native';
import UsageTracker from '../usageTracker';

// iOS usage stats (Screen Time API is not publicly available, so using our mock data)
export async function getIOSUsageSummary(): Promise<{ minutesUsed?: number }> {
  if (Platform.OS !== 'ios') return {};
  
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
    console.error('Error getting iOS usage stats:', error);
    return { minutesUsed: undefined };
  }
}