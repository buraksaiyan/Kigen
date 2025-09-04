import { Platform } from 'react-native';

// Placeholder for Screen Time API (not publicly available).
export async function getIOSUsageSummary(): Promise<{ minutesUsed?: number }> {
  if (Platform.OS !== 'ios') return {};
  return { minutesUsed: undefined };
}