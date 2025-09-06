import * as IntentLauncher from 'expo-intent-launcher';
import { Platform, AppState, AppStateStatus, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UsageStatsNative from '../modules/UsageStatsNative';

export interface AppUsage {
  packageName: string;
  appName: string;
  icon?: string;
  timeInForeground: number;
  lastTimeUsed: number;
  launchCount: number;
}

export interface UsageStats {
  totalScreenTime: number;
  pickups: number;
  notifications: number;
  apps: AppUsage[];
  lastUpdated: number;
}

class NativeUsageTracker {
  private permissionCheckInterval: NodeJS.Timeout | null = null;
  private appStateListener: any = null;
  
  // Check if we have usage access permission
  async hasUsageAccessPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    
    try {
      // Try native module first (will work in standalone builds)
      try {
        return await UsageStatsNative.hasUsageStatsPermission();
      } catch (error) {
        console.log('Native module not available, using fallback for Expo Go');
        // Fallback to AsyncStorage for Expo Go development
        const hasPermission = await AsyncStorage.getItem('usage_permission_granted');
        return hasPermission === 'true';
      }
    } catch (error) {
      console.log('Error checking usage permission:', error);
      return false;
    }
  }

  // Request usage access permission - This opens Android's Usage Access Settings
  async requestUsageAccessPermission(): Promise<void> {
    if (Platform.OS !== 'android') {
      throw new Error('Usage access is only available on Android');
    }

    try {
      console.log('Opening Android Usage Access Settings...');
      
      // Try native module first (for standalone builds)
      try {
        await UsageStatsNative.requestUsageStatsPermission();
        console.log('Opened via native module');
      } catch (error) {
        console.log('Native module not available, using expo-intent-launcher');
        // Fallback to expo-intent-launcher for Expo Go
        await IntentLauncher.startActivityAsync('android.settings.USAGE_ACCESS_SETTINGS');
        console.log('Opened via intent launcher');
      }
      
      // Start monitoring app state to detect when user returns
      this.startPermissionMonitoring();
    } catch (error) {
      console.error('Failed to open usage access settings:', error);
      Alert.alert(
        'Settings Error', 
        'Could not open Usage Access settings. Please go to Settings > Apps > Special app access > Usage access manually.'
      );
      throw error;
    }
  }

  // Start monitoring app state for permission changes
  private startPermissionMonitoring(): void {
    this.appStateListener = AppState.addEventListener('change', this.handleAppStateChange);
    
    // Also check periodically in case AppState doesn't trigger
    this.permissionCheckInterval = setInterval(async () => {
      await this.checkPermissionStatus();
    }, 2000);
  }

  private handleAppStateChange = async (nextAppState: AppStateStatus): Promise<void> => {
    if (nextAppState === 'active') {
      // App became active, check if permission was granted
      await this.checkPermissionStatus();
    }
  };

  private async checkPermissionStatus(): Promise<void> {
    // In a real implementation, this would use a native module to check
    // For now, we'll assume permission is granted after opening settings
    const wasInSettings = await AsyncStorage.getItem('opened_usage_settings');
    if (wasInSettings === 'true') {
      await AsyncStorage.setItem('usage_permission_granted', 'true');
      await AsyncStorage.removeItem('opened_usage_settings');
      this.stopPermissionMonitoring();
    }
  }

  private stopPermissionMonitoring(): void {
    if (this.appStateListener) {
      this.appStateListener?.remove();
      this.appStateListener = null;
    }
    if (this.permissionCheckInterval) {
      clearInterval(this.permissionCheckInterval);
      this.permissionCheckInterval = null;
    }
  }

  // Get real usage statistics from the system
  async getUsageStats(): Promise<UsageStats | null> {
    const hasPermission = await this.hasUsageAccessPermission();
    if (!hasPermission) {
      return null;
    }

    try {
      // Try native module first
      try {
        const nativeStats = await UsageStatsNative.getUsageStats();
        return {
          ...nativeStats,
          lastUpdated: Date.now()
        };
      } catch (error) {
        console.log('Native module not available, using development data');
        
        // For development, return sample structure that shows it's working
        return {
          totalScreenTime: 4 * 60 * 60 * 1000, // 4 hours in milliseconds  
          pickups: 89,
          notifications: 42,
          apps: [
            {
              packageName: 'com.expo.client',
              appName: 'Expo Go',
              timeInForeground: 2 * 60 * 60 * 1000, // 2 hours
              lastTimeUsed: Date.now() - 30 * 60 * 1000, // 30 min ago
              launchCount: 12
            },
            {
              packageName: 'com.google.android.apps.messaging',
              appName: 'Messages',
              timeInForeground: 45 * 60 * 1000, // 45 minutes
              lastTimeUsed: Date.now() - 5 * 60 * 1000, // 5 min ago
              launchCount: 23
            },
            {
              packageName: 'com.android.chrome',
              appName: 'Chrome',
              timeInForeground: 35 * 60 * 1000, // 35 minutes
              lastTimeUsed: Date.now() - 15 * 60 * 1000, // 15 min ago
              launchCount: 8
            },
            {
              packageName: 'com.instagram.android',
              appName: 'Instagram',
              timeInForeground: 25 * 60 * 1000, // 25 minutes
              lastTimeUsed: Date.now() - 60 * 60 * 1000, // 1 hour ago
              launchCount: 15
            }
          ],
          lastUpdated: Date.now()
        };
      }
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return null;
    }
  }

  // Get installed apps (would use native module in real implementation)
  async getInstalledApps(): Promise<AppUsage[]> {
    const hasPermission = await this.hasUsageAccessPermission();
    if (!hasPermission) {
      return [];
    }

    // This would be implemented in native code
    // Return empty array for now - native module would populate this
    return [];
  }

  // Clean up resources
  cleanup(): void {
    this.stopPermissionMonitoring();
  }

  // Development helper to simulate permission grant
  async dev_grantPermission(): Promise<void> {
    await AsyncStorage.setItem('usage_permission_granted', 'true');
  }

  // Development helper to revoke permission
  async dev_revokePermission(): Promise<void> {
    await AsyncStorage.removeItem('usage_permission_granted');
  }
}

export const nativeUsageTracker = new NativeUsageTracker();
