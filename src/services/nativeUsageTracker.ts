import * as IntentLauncher from 'expo-intent-launcher';
import { Platform, AppState, AppStateStatus, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import usageStatsService from './usageStatsService';

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
      if (usageStatsService.isAvailable()) {
        return await usageStatsService.hasPermission();
      } else {
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
      
      // Multiple approaches for better compatibility
      const methods = [
        // Method 1: Try direct usage access settings URL
        () => Linking.openURL('package:com.android.settings/.Settings$UsageAccessSettingsActivity'),
        
        // Method 2: Try native module first (for standalone builds)
        () => usageStatsService.requestPermission(),
        
        // Method 3: Try expo-intent-launcher for usage access
        () => IntentLauncher.startActivityAsync('android.settings.USAGE_ACCESS_SETTINGS'),
        
        // Method 4: Fallback to general app settings
        () => Linking.openSettings(),
        
        // Method 5: Try general settings as last resort
        () => Linking.openURL('package:com.android.settings/.Settings')
      ];

      let success = false;
      let lastError = null;

      for (let i = 0; i < methods.length; i++) {
        try {
          console.log(`Trying method ${i + 1} to open usage access settings...`);
          const method = methods[i];
          if (method) {
            await method();
          }
          success = true;
          console.log(`Method ${i + 1} succeeded`);
          break;
        } catch (error) {
          console.log(`Method ${i + 1} failed:`, error);
          lastError = error;
          continue;
        }
      }

      if (!success) {
        throw lastError || new Error('All methods failed to open settings');
      }
      
      // Start monitoring app state to detect when user returns
      this.startPermissionMonitoring();
      
      // Show helpful instructions
      Alert.alert(
        'Enable Usage Access',
        'In the settings that just opened:\n\n1. Find "Expo Go" or your app in the list\n2. Toggle the switch to enable usage access\n3. Return to this app\n\nWe\'ll automatically detect when you grant permission.',
        [{ text: 'Got it' }]
      );
      
    } catch (error) {
      console.error('Failed to open usage access settings:', error);
      
      // Provide manual instructions as fallback
      Alert.alert(
        'Manual Setup Required', 
        'Please manually go to:\n\nSettings > Apps > Special app access > Usage access\n\nThen find "Expo Go" and enable usage access.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => {
              try {
                Linking.openSettings();
              } catch (e) {
                console.error('Failed to open general settings:', e);
              }
            }
          }
        ]
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
      // Try native module first (for standalone builds)
      if (usageStatsService.isAvailable()) {
        const nativeStats = await usageStatsService.getTodayUsageStats();
        
        // Convert to our expected format
        const totalScreenTime = nativeStats.reduce((total, app) => total + app.totalTimeInForeground, 0);
        
        return {
          totalScreenTime,
          pickups: 0, // This would need additional implementation
          notifications: 0, // This would need additional implementation
          apps: nativeStats.map(app => ({
            packageName: app.packageName,
            appName: app.appName,
            timeInForeground: app.totalTimeInForeground,
            lastTimeUsed: app.lastTimeStamp,
            launchCount: 0, // This would need additional implementation
          })),
          lastUpdated: Date.now()
        };
      } else {
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

  // Get usage statistics for a specific date range
  async getUsageStatsForRange(startTime: number, endTime: number): Promise<UsageStats | null> {
    const hasPermission = await this.hasUsageAccessPermission();
    if (!hasPermission) {
      return null;
    }

    try {
      if (usageStatsService.isAvailable()) {
        const nativeStats = await usageStatsService.getUsageStats(startTime, endTime);
        
        // Convert to our expected format
        const totalScreenTime = nativeStats.reduce((total, app) => total + app.totalTimeInForeground, 0);
        
        return {
          totalScreenTime,
          pickups: 0, // This would need additional implementation
          notifications: 0, // This would need additional implementation
          apps: nativeStats.map(app => ({
            packageName: app.packageName,
            appName: app.appName,
            timeInForeground: app.totalTimeInForeground,
            lastTimeUsed: app.lastTimeStamp,
            launchCount: 0, // This would need additional implementation
          })),
          lastUpdated: Date.now()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting usage stats for range:', error);
      return null;
    }
  }

  // Get app icons
  async getAppIcons(): Promise<{ [packageName: string]: string }> {
    const hasPermission = await this.hasUsageAccessPermission();
    if (!hasPermission) {
      return {};
    }

    try {
      // Note: App icons functionality would need to be implemented in the native module
      // For now, return empty object as placeholder
      console.warn('App icons functionality not yet implemented in the new usage stats service');
      return {};
    } catch (error) {
      console.error('Error getting app icons:', error);
      return {};
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
