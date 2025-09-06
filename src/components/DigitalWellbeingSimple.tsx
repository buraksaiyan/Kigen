import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  AppState,
} from 'react-native';
import { UsageChart } from './UsageChart';
import UsageTracker from '../services/usageTracker';

interface DigitalWellbeingSimpleProps {
  theme: any;
}

const APP_COLORS = [
  '#1E88E5', // Blue (Expo Go)
  '#E53935', // Red (Instagram)  
  '#FFB300', // Orange (TikTok)
  '#43A047', // Green (Firefox)
  '#8E24AA', // Purple (WhatsApp)
  '#FB8C00', // Orange (YouTube)
];

const MOCK_USAGE_DATA = [
  { appName: 'Expo Go', time: 6720000, color: '#1E88E5' },
  { appName: 'Instagram', time: 4860000, color: '#E53935' },
  { appName: 'TikTok', time: 4740000, color: '#FFB300' },
  { appName: 'Firefox', time: 2880000, color: '#43A047' },
  { appName: 'WhatsApp', time: 2280000, color: '#8E24AA' },
  { appName: 'YouTube', time: 1200000, color: '#FB8C00' },
];

const DigitalWellbeingSimple: React.FC<DigitalWellbeingSimpleProps> = ({ theme }) => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [appState, setAppState] = useState(AppState.currentState);
  
  const usageTracker = UsageTracker.getInstance();

  useEffect(() => {
    checkPermission();
    
    // Listen for app state changes to detect when user returns from settings
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => subscription?.remove();
  }, []);

  const handleAppStateChange = (nextAppState: string) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      // User returned to app, check permission again
      setTimeout(checkPermission, 500);
    }
    setAppState(nextAppState);
  };

  const checkPermission = async () => {
    try {
      const permission = await usageTracker.hasUsageAccessPermission();
      setHasPermission(permission);
    } catch (error) {
      console.error('Error checking permission:', error);
    }
  };

  const requestPermission = async () => {
    try {
      Alert.alert(
        'Usage Access Required',
        'To view your screen time data:\n\n1. Tap "Open Settings"\n2. Find "Kigen" in the list\n3. Toggle "Allow usage access" ON\n4. Return to this app\n\nThe app will automatically detect when you grant permission.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: async () => {
              await usageTracker.requestUsageAccessPermission();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  const grantDemoPermission = async () => {
    // For development only - simulate granting permission
    try {
      await usageTracker.setUsagePermission(true);
      setHasPermission(true);
    } catch (error) {
      console.error('Error setting demo permission:', error);
    }
  };

  const resetPermission = async () => {
    try {
      await usageTracker.resetPermissionStatus();
      setHasPermission(false);
      Alert.alert('Reset Complete', 'Permission has been reset. You can try again.');
    } catch (error) {
      console.error('Error resetting permission:', error);
    }
  };

  const totalTime = MOCK_USAGE_DATA.reduce((sum, app) => sum + app.time, 0);
  
  const chartData = MOCK_USAGE_DATA.map(app => ({
    app: app.appName,
    timeInForeground: app.time,
    color: app.color,
  }));

  const formatTime = (ms: number): string => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (!hasPermission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.headerContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Digital Wellbeing</Text>
        </View>
        
        <View style={[styles.permissionCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.permissionIcon, { color: theme.textSecondary }]}>📱</Text>
          <Text style={[styles.permissionTitle, { color: theme.text }]}>
            Enable Usage Access
          </Text>
          <Text style={[styles.permissionDescription, { color: theme.textSecondary }]}>
            Grant usage access to see your screen time and app usage data
          </Text>

          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Open Settings</Text>
          </TouchableOpacity>

          {__DEV__ && (
            <>
              <TouchableOpacity
                style={[styles.demoButton, { backgroundColor: '#10B981' }]}
                onPress={grantDemoPermission}
              >
                <Text style={styles.permissionButtonText}>Demo: Grant Permission</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetPermission}
              >
                <Text style={[styles.resetButtonText, { color: theme.textSecondary }]}>
                  Reset Permission
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Digital Wellbeing</Text>
      </View>
      
      <ScrollView 
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={checkPermission} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Chart Card */}
        <View style={[styles.mainCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Your Digital Wellbeing tools
          </Text>
          
          {/* Circular Chart */}
          <View style={styles.chartContainer}>
            <UsageChart 
              data={chartData}
              totalTime={totalTime}
              size={180}
            />
          </View>

          {/* Stats Row - Unlocks and Notifications */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.text }]}>96</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Unlocks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.text }]}>90</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Notifications</Text>
            </View>
          </View>
        </View>

        {/* App List - Compact */}
        <View style={[styles.appListCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.appListTitle, { color: theme.text }]}>App activity</Text>
          
          {MOCK_USAGE_DATA.map((app, index) => {
            const percentage = totalTime > 0 ? Math.round((app.time / totalTime) * 100) : 0;
            
            return (
              <View key={app.appName} style={styles.appRow}>
                <View style={styles.appInfo}>
                  <View style={[styles.appIcon, { backgroundColor: app.color }]}>
                    <Text style={styles.appIconText}>
                      {app.appName.substring(0, 1)}
                    </Text>
                  </View>
                  <Text style={[styles.appName, { color: theme.text }]}>
                    {app.appName}
                  </Text>
                </View>
                <Text style={[styles.appTime, { color: theme.textSecondary }]}>
                  {formatTime(app.time)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  headerContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  
  // Permission Card
  permissionCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  permissionIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    minWidth: 200,
  },
  demoButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    minWidth: 200,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  resetButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  resetButtonText: {
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Main Cards
  mainCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 12, // Reduced from 16
  },
  appListCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16, // Reduced from 20
  },
  appListTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12, // Reduced from 16
  },
  
  // Chart
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16, // Reduced from 24
  },
  
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8, // Reduced spacing
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28, // Slightly smaller
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  
  // App List - Compact
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10, // Reduced from 12
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  appInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIcon: {
    width: 32, // Smaller icon
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appIconText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  appName: {
    fontSize: 16,
    fontWeight: '500',
  },
  appTime: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default DigitalWellbeingSimple;
