import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ScrollView,
  AppState,
  AppStateStatus
} from 'react-native';
import Constants from 'expo-constants';
import { nativeUsageTracker, UsageStats } from '../services/nativeUsageTracker';

interface DigitalWellbeingProps {
  theme: {
    colors: {
      primary: string;
      secondary: string;
      success: string;
      danger: string;
      warning: string;
      background: string;
      surface: string;
      surfaceSecondary: string;
      border: string;
      text: {
        primary: string;
        secondary: string;
        tertiary: string;
        disabled: string;
      };
    };
  };
}

export const DigitalWellbeing: React.FC<DigitalWellbeingProps> = ({ theme }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Check if running in Expo Go
  const isExpoGo = Constants.appOwnership === 'expo';

  // Check permission status
  const checkPermissionStatus = useCallback(async () => {
    try {
      const permission = await nativeUsageTracker.hasUsageAccessPermission();
      setHasPermission(permission);
      
      if (permission) {
        await loadUsageData();
      }
    } catch (error) {
      console.error('Error checking permission:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load usage data from native system
  const loadUsageData = useCallback(async () => {
    try {
      const stats = await nativeUsageTracker.getUsageStats();
      setUsageStats(stats);
    } catch (error) {
      console.error('Error loading usage data:', error);
    }
  }, []);

  // Request usage access permission
  const requestPermission = async () => {
    setIsRequestingPermission(true);
    try {
      await nativeUsageTracker.requestUsageAccessPermission();
      Alert.alert(
        'Usage Access Required',
        'Please find and enable usage access for this app in the settings that just opened. Return here when done.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error requesting permission:', error);
      Alert.alert('Error', 'Failed to open usage access settings');
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Handle app state changes to detect permission grants
  const handleAppStateChange = useCallback(
    async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && !hasPermission) {
        // User returned to app, check if permission was granted
        await checkPermissionStatus();
      }
    },
    [hasPermission, checkPermissionStatus]
  );

  // Refresh data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkPermissionStatus();
    setRefreshing(false);
  }, [checkPermissionStatus]);

  // Setup listeners and initial load
  useEffect(() => {
    checkPermissionStatus();

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
      nativeUsageTracker.cleanup();
    };
  }, [checkPermissionStatus, handleAppStateChange]);

  // Auto-refresh every 30 seconds when app is active
  useEffect(() => {
    if (!hasPermission) return;

    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        loadUsageData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [hasPermission, loadUsageData]);

  const formatTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text.primary }]}>
          Loading usage data...
        </Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          <View style={styles.permissionContainer}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              {isExpoGo ? 'Usage Access - Expo Go Limitation' : 'Usage Access Required'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
              {isExpoGo 
                ? 'Real usage access requires a standalone app build. Expo Go cannot access system usage statistics because your app runs in a container.'
                : 'To display your screen time and app usage, please grant usage access permission.'
              }
            </Text>
            
            {isExpoGo && (
              <Text style={[styles.limitationText, { color: theme.colors.warning }]}>
                📱 For real usage access:
                {'\n'}1. expo build:android (or expo run:android)
                {'\n'}2. Install the APK on your device
                {'\n'}3. Grant usage access in system settings
                {'\n'}
                {'\n'}🔧 For now, use demo mode below
              </Text>
            )}

            <TouchableOpacity
              style={[styles.devButton, { backgroundColor: theme.colors.success }]}
              onPress={async () => {
                await nativeUsageTracker.dev_grantPermission();
                await checkPermissionStatus();
              }}
            >
              <Text style={[styles.permissionButtonText, { color: theme.colors.background }]}>
                {isExpoGo ? 'Enable Demo Mode' : 'Enable Development Mode'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.permissionButton, { backgroundColor: theme.colors.primary }]}
              onPress={requestPermission}
              disabled={isRequestingPermission}
            >
              <Text style={[styles.permissionButtonText, { color: theme.colors.background }]}>
                {isRequestingPermission ? 'Opening Settings...' : (isExpoGo ? 'Try Settings (Limited)' : 'Grant Usage Access')}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.helpText, { color: theme.colors.text.secondary }]}>
              {isExpoGo 
                ? 'Demo mode shows sample data • Pull down to refresh'
                : 'Pull down to check if permission was granted'
              }
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Digital Wellbeing
        </Text>

        {usageStats ? (
          <View style={styles.statsContainer}>
            <View style={styles.statsHeader}>
              <Text style={[styles.todayText, { color: theme.colors.text.primary }]}>
                TODAY
              </Text>
              <Text style={[styles.lastUpdated, { color: theme.colors.text.secondary }]}>
                Last updated: {new Date(usageStats.lastUpdated).toLocaleTimeString()}
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.colors.text.primary }]}>
                  {formatTime(usageStats.totalScreenTime)}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                  Screen time
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.colors.text.primary }]}>
                  {usageStats.pickups}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                  Pickups
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.colors.text.primary }]}>
                  {usageStats.notifications}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                  Notifications
                </Text>
              </View>
            </View>

            {usageStats.apps.length === 0 ? (
              <View style={styles.noDataContainer}>
                <Text style={[styles.noDataText, { color: theme.colors.text.secondary }]}>
                  No app usage data available yet.
                  {'\n'}Native module integration needed for real data.
                </Text>
                <TouchableOpacity
                  style={[styles.refreshButton, { borderColor: theme.colors.primary }]}
                  onPress={onRefresh}
                >
                  <Text style={[styles.refreshButtonText, { color: theme.colors.primary }]}>
                    Refresh Data
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.appsList}>
                <Text style={[styles.appsHeader, { color: theme.colors.text.primary }]}>
                  Most used apps
                </Text>
                {usageStats.apps.map((app, index) => (
                  <View key={app.packageName} style={styles.appItem}>
                    <View style={[styles.appIcon, { backgroundColor: theme.colors.primary }]}>
                      <Text style={[styles.appIconText, { color: theme.colors.background }]}>
                        {app.appName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.appInfo}>
                      <Text style={[styles.appName, { color: theme.colors.text.primary }]}>
                        {app.appName}
                      </Text>
                      <Text style={[styles.appUsage, { color: theme.colors.text.secondary }]}>
                        {formatTime(app.timeInForeground)}
                      </Text>
                    </View>
                    <Text style={[styles.appLaunches, { color: theme.colors.text.secondary }]}>
                      {app.launchCount} launches
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={[styles.noDataText, { color: theme.colors.text.secondary }]}>
              Failed to load usage data.
            </Text>
            <TouchableOpacity
              style={[styles.refreshButton, { borderColor: theme.colors.primary }]}
              onPress={onRefresh}
            >
              <Text style={[styles.refreshButtonText, { color: theme.colors.primary }]}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 100,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  devButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  limitationText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    lineHeight: 20,
  },
  statsContainer: {
    marginTop: 8,
  },
  statsHeader: {
    marginBottom: 24,
  },
  todayText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  appsHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  appsList: {
    marginTop: 16,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appIconText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  appUsage: {
    fontSize: 14,
  },
  appLaunches: {
    fontSize: 12,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  refreshButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 2,
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
