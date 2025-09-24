import { Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as IntentLauncher from 'expo-intent-launcher';

export interface AppUsage {
  id: string;
  packageName: string;
  appName: string;
  timeInForeground: number; // milliseconds
  lastTimeUsed: number; // timestamp
  percentage: number;
  color: string;
}

export interface UsageStats {
  totalScreenTime: number;
  apps: AppUsage[];
  date: string;
}

class UsageTracker {
  private static instance: UsageTracker;

  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  // Check if usage access permission is granted
  async hasUsageAccessPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false; // iOS doesn't have public Screen Time API
    }

    try {
      // In a real app, this would call a native module to check UsageStatsManager permission
      // For now, we check if the permission was manually granted
      const hasPermission = await AsyncStorage.getItem('hasUsagePermission');
      return hasPermission === 'true';
    } catch (error) {
      console.error('Error checking usage permission:', error);
      return false;
    }
  }

  // Request usage access permission
  async requestUsageAccessPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      Alert.alert(
        'Not Available',
        'Screen time tracking is not available on iOS due to platform restrictions.',
        [{ text: 'OK' }]
      );
      return false;
    }

    try {
      Alert.alert(
        'Usage Access Required',
        'To track your screen time and app usage, please grant "Usage Access" permission in the next screen.\n\n1. Find "inzone" in the list\n2. Toggle "Allow usage access" ON\n3. Return to the app',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: async () => {
              try {
                // Open Android Usage Access Settings directly
                await IntentLauncher.startActivityAsync(
                  IntentLauncher.ActivityAction.USAGE_ACCESS_SETTINGS
                );
              } catch (error) {
                console.error('Error opening usage settings:', error);
                // Fallback to general settings
                Linking.openSettings();
              }
            }
          }
        ]
      );
      return false; // User needs to manually grant permission
    } catch (error) {
      console.error('Error requesting usage permission:', error);
      return false;
    }
  }

  // Get usage stats - this would call native module in real implementation
  async getUsageStats(days: number = 1): Promise<UsageStats[]> {
    try {
      const hasPermission = await this.hasUsageAccessPermission();
      
      if (!hasPermission) {
        return [];
      }

      // In a real implementation, this would call a native module
      // that queries UsageStatsManager for actual app usage data
      // For now, return empty array since we don't have real data
      return [];
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return [];
    }
  }

  // Check permissions and refresh status
  async checkPermissions(): Promise<boolean> {
    try {
      if (Platform.OS !== 'android') {
        return false;
      }

      // Check if permission was granted in settings
      const hasPermission = await this.hasUsageAccessPermission();
      return hasPermission;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  // Reset permission status (to allow retrying)
  async resetPermissionStatus(): Promise<void> {
    try {
      await AsyncStorage.removeItem('hasUsagePermission');
    } catch (error) {
      console.error('Error resetting permission status:', error);
    }
  }

  // Format time string
  formatTime(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    
    return `${minutes}m`;
  }
}

export default UsageTracker;
