import * as IntentLauncher from 'expo-intent-launcher';
import { Platform, AppState, AppStateStatus, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import usageStatsService from './usageStatsService';
import { generateUniqueId } from '../utils/uniqueId';

export interface AppUsage {
  id: string;
  packageName: string;
  appName: string;
  icon?: string;
  timeInForeground: number;
  lastTimeUsed: number;
  launchCount: number;
}

export interface UsageStats {
  id?: string;
  totalScreenTime: number;
  pickups: number;
  notifications: number;
  apps: AppUsage[];
  lastUpdated: number;
}

class NativeUsageTracker {
  private permissionCheckInterval: ReturnType<typeof globalThis.setInterval> | null = null;
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
        const manualGrant = await AsyncStorage.getItem('usage_permission_manual_grant');

        // Consider permission granted if either automatic detection or manual grant is set
        return hasPermission === 'true' || manualGrant === 'true';
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
        'In the settings that just opened:\n\n1. Find "InZone" in the list\n2. Toggle the switch to enable usage access\n3. Return to this app\n\nWe\'ll automatically detect when you grant permission.',
        [
          { text: 'Got it' }
        ]
      );
      
    } catch (error) {
      console.error('Failed to open usage access settings:', error);
      
      // Provide manual instructions as fallback
      Alert.alert(
        'Manual Setup Required', 
        'Please manually go to:\n\nSettings > Apps > Special app access > Usage access\n\nThen find "InZone" and enable usage access.',
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
    this.permissionCheckInterval = globalThis.setInterval(async () => {
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

  // Manually set permission status (for when users grant permission manually)
  async setPermissionGranted(): Promise<void> {
    await AsyncStorage.setItem('usage_permission_manual_grant', 'true');
  }

  // Check if permission was manually granted
  async isPermissionManuallyGranted(): Promise<boolean> {
    const manualGrant = await AsyncStorage.getItem('usage_permission_manual_grant');
    return manualGrant === 'true';
  }

  private stopPermissionMonitoring(): void {
    if (this.appStateListener) {
      this.appStateListener?.remove();
      this.appStateListener = null;
    }
    if (this.permissionCheckInterval) {
      globalThis.clearInterval(this.permissionCheckInterval);
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
            id: generateUniqueId(),
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
        
        // Generate more realistic and varied mock data based on time of day
        const now = Date.now();
        const hour = new Date().getHours();
        const isWorkDay = new Date().getDay() !== 0 && new Date().getDay() !== 6; // Not weekend
        
        // Base screen time varies by time of day and day type
        let baseScreenTime = 2 * 60 * 60 * 1000; // 2 hours base
        if (hour >= 9 && hour <= 17 && isWorkDay) {
          baseScreenTime = 4 * 60 * 60 * 1000; // 4 hours during work hours
        } else if (hour >= 18 && hour <= 22) {
          baseScreenTime = 3 * 60 * 60 * 1000; // 3 hours evening
        }
        
        // Add some randomness
        const screenTimeVariation = (Math.random() - 0.5) * 0.5 * 60 * 60 * 1000; // ±30 min
        const totalScreenTime = Math.max(30 * 60 * 1000, baseScreenTime + screenTimeVariation); // At least 30 min
        
        return {
          totalScreenTime,
          pickups: Math.floor(Math.random() * 50) + 20, // 20-70 pickups
          notifications: Math.floor(Math.random() * 30) + 10, // 10-40 notifications
          apps: [
            {
              id: generateUniqueId(),
              packageName: 'com.android.chrome',
              appName: 'Chrome',
              timeInForeground: Math.floor(totalScreenTime * (0.3 + Math.random() * 0.2)), // 30-50% of screen time
              lastTimeUsed: now - Math.floor(Math.random() * 2 * 60 * 60 * 1000), // Within last 2 hours
              launchCount: Math.floor(Math.random() * 15) + 5 // 5-20 launches
            },
            {
              id: generateUniqueId(),
              packageName: 'com.instagram.android',
              appName: 'Instagram',
              timeInForeground: Math.floor(totalScreenTime * (0.15 + Math.random() * 0.1)), // 15-25% of screen time
              lastTimeUsed: now - Math.floor(Math.random() * 4 * 60 * 60 * 1000), // Within last 4 hours
              launchCount: Math.floor(Math.random() * 10) + 3 // 3-13 launches
            },
            {
              id: generateUniqueId(),
              packageName: 'com.google.android.apps.messaging',
              appName: 'Messages',
              timeInForeground: Math.floor(totalScreenTime * (0.1 + Math.random() * 0.05)), // 10-15% of screen time
              lastTimeUsed: now - Math.floor(Math.random() * 60 * 60 * 1000), // Within last hour
              launchCount: Math.floor(Math.random() * 8) + 2 // 2-10 launches
            },
            {
              id: generateUniqueId(),
              packageName: 'com.whatsapp',
              appName: 'WhatsApp',
              timeInForeground: Math.floor(totalScreenTime * (0.08 + Math.random() * 0.05)), // 8-13% of screen time
              lastTimeUsed: now - Math.floor(Math.random() * 3 * 60 * 60 * 1000), // Within last 3 hours
              launchCount: Math.floor(Math.random() * 6) + 1 // 1-7 launches
            },
            {
              id: generateUniqueId(),
              packageName: 'com.expo.client',
              appName: 'Expo Go',
              timeInForeground: Math.floor(totalScreenTime * (0.05 + Math.random() * 0.03)), // 5-8% of screen time
              lastTimeUsed: now - Math.floor(Math.random() * 30 * 60 * 1000), // Within last 30 min
              launchCount: Math.floor(Math.random() * 4) + 1 // 1-5 launches
            }
          ].sort((a, b) => b.timeInForeground - a.timeInForeground), // Sort by usage time
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
            id: generateUniqueId(),
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
