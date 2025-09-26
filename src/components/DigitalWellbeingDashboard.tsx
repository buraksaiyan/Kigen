import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { UsageChart } from './UsageChart';
import UsageTracker, { UsageStats } from '../services/usageTracker';

interface DigitalWellbeingDashboardProps {
  theme: any;
}

const APP_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#FFB6C1', '#87CEEB', '#F0E68C', '#FF7F50',
  '#98FB98', '#FFE4E1', '#E6E6FA', '#FFF8DC', '#F5DEB3'
];

const DigitalWellbeingDashboard: React.FC<DigitalWellbeingDashboardProps> = ({ theme }) => {
  const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const usageTracker = UsageTracker.getInstance();

  useEffect(() => {
    checkPermissionAndLoadData();
    
    // Check permissions periodically
  const interval = globalThis.setInterval(checkPermissionAndLoadData, 3000);
    
  return () => globalThis.clearInterval(interval);
  }, []);

  const checkPermissionAndLoadData = async () => {
    setIsLoading(true);
    try {
      const permission = await usageTracker.hasUsageAccessPermission();
      setHasPermission(permission);
      
      if (permission) {
        const stats = await usageTracker.getUsageStats(1);
        setUsageStats(stats);
      } else {
        setUsageStats([]);
      }
    } catch (error) {
      console.error('Error checking permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = async () => {
    try {
      await usageTracker.requestUsageAccessPermission();
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  const resetAndTryAgain = async () => {
    try {
      await usageTracker.resetPermissionStatus();
      setHasPermission(false);
      setUsageStats([]);
      Alert.alert(
        'Reset Complete',
        'You can now try requesting permission again.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error resetting permission:', error);
    }
  };

  const onRefresh = async () => {
    await checkPermissionAndLoadData();
  };

  const renderNoPermission = () => (
    <View style={[styles.permissionContainer, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.iconContainer}>
  <Text style={styles.iconText}>Device</Text>
      </View>
      
      <Text style={[styles.permissionTitle, { color: theme.text }]}>
        Digital Wellbeing
      </Text>
      
      <Text style={[styles.permissionDescription, { color: theme.textSecondary }]}>
        Track your app usage and screen time to understand your digital habits and build better discipline.
      </Text>

      <View style={styles.requirementsContainer}>
        <Text style={[styles.requirementsTitle, { color: theme.text }]}>
          To enable screen time tracking:
        </Text>
        <View style={styles.requirementStep}>
          <Text style={[styles.stepNumber, { color: theme.accent, backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>1</Text>
          <Text style={[styles.stepText, { color: theme.textSecondary }]}>
            Tap &quot;Grant Permission&quot; below
          </Text>
        </View>
        <View style={styles.requirementStep}>
          <Text style={[styles.stepNumber, { color: theme.accent, backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>2</Text>
          <Text style={[styles.stepText, { color: theme.textSecondary }]}>
            Find &quot;Kigen&quot; in the Usage Access list
          </Text>
        </View>
        <View style={styles.requirementStep}>
          <Text style={[styles.stepNumber, { color: theme.accent, backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>3</Text>
          <Text style={[styles.stepText, { color: theme.textSecondary }]}>
            Toggle &quot;Allow usage access&quot; ON
          </Text>
        </View>
        <View style={styles.requirementStep}>
          <Text style={[styles.stepNumber, { color: theme.accent, backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>4</Text>
          <Text style={[styles.stepText, { color: theme.textSecondary }]}>
            Return to this app
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.permissionButton, { backgroundColor: theme.accent }]}
        onPress={requestPermission}
      >
        <Text style={[styles.permissionButtonText, { color: theme.colors.text.primary }]}>Grant Permission</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.resetButton, { borderColor: theme.textSecondary }]}
        onPress={resetAndTryAgain}
      >
        <Text style={[styles.resetButtonText, { color: theme.textSecondary }]}>
          Reset & Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderNoData = () => (
    <View style={[styles.noDataContainer, { backgroundColor: theme.cardBackground }]}>
  <Text style={[styles.noDataIcon, { color: theme.textSecondary }]}>Stats</Text>
      <Text style={[styles.noDataTitle, { color: theme.text }]}>
        No Usage Data Available
      </Text>
      <Text style={[styles.noDataText, { color: theme.textSecondary }]}>
        Permission is granted, but no usage data could be retrieved. This might be because:
      </Text>
      <Text style={[styles.noDataReason, { color: theme.textSecondary }]}>
        • You haven&apos;t used other apps today
      </Text>
      <Text style={[styles.noDataReason, { color: theme.textSecondary }]}>
        • The system needs time to collect data
      </Text>
      <Text style={[styles.noDataReason, { color: theme.textSecondary }]}>
        • A native module is required for real data access
      </Text>
    </View>
  );

  const renderUsageData = () => {
    if (!usageStats.length) {
      return renderNoData();
    }

    const todayStats = usageStats[0];
    if (!todayStats || !todayStats.apps.length) {
      return renderNoData();
    }

    // Prepare chart data with colors and percentages
    const chartData = todayStats.apps.slice(0, 10).map((app, index) => ({
      app: app.appName,
      timeInForeground: app.timeInForeground,
      color: APP_COLORS[index % APP_COLORS.length] || '#FF6B6B',
    }));

    // Add percentages to apps
    const appsWithPercentages = todayStats.apps.map((app, index) => ({
      ...app,
      percentage: todayStats.totalScreenTime > 0 
        ? Math.round((app.timeInForeground / todayStats.totalScreenTime) * 100) 
        : 0,
      color: APP_COLORS[index % APP_COLORS.length],
    }));

    return (
      <ScrollView 
        style={styles.usageContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={theme.accent} />
        }
      >
        {/* Chart Section */}
        <View style={[styles.chartSection, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>Today&apos;s Screen Time</Text>
          <UsageChart 
            data={chartData}
            totalTime={todayStats.totalScreenTime}
          />
          <Text style={[styles.totalTimeText, { color: theme.textSecondary }]}>
            Total: {usageTracker.formatTime(todayStats.totalScreenTime)}
          </Text>
        </View>

        {/* Apps List */}
        <View style={[styles.appsSection, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.appsTitle, { color: theme.text }]}>App Usage</Text>
          
          {appsWithPercentages.map((app, _index) => (
            <View key={app.packageName} style={[styles.appItem, { borderBottomColor: 'rgba(255, 255, 255, 0.1)' }]}>
              <View style={styles.appInfo}>
                <View style={[styles.appColorDot, { backgroundColor: app.color }]} />
                <View style={styles.appDetails}>
                  <Text style={[styles.appName, { color: theme.text }]} numberOfLines={1}>
                    {app.appName}
                  </Text>
                  <Text style={[styles.packageName, { color: theme.textSecondary }]} numberOfLines={1}>
                    {app.packageName}
                  </Text>
                </View>
              </View>
              
              <View style={styles.appUsage}>
                <Text style={[styles.usageTime, { color: theme.text }]}>
                  {usageTracker.formatTime(app.timeInForeground)}
                </Text>
                <Text style={[styles.usagePercentage, { color: theme.textSecondary }]}>
                  {app.percentage}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Digital Wellbeing</Text>
      </View>
      
      {!hasPermission ? renderNoPermission() : renderUsageData()}
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
  
  // Permission Request Styles
  permissionContainer: {
    alignItems: 'center',
    borderRadius: 16,
    padding: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconText: {
    fontSize: 48,
  },
  permissionDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  requirementsContainer: {
    marginBottom: 24,
    width: '100%',
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  requirementStep: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  stepNumber: {
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 'bold',
    height: 24,
    lineHeight: 24,
    marginRight: 12,
    textAlign: 'center',
    width: 24,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  permissionButton: {
    borderRadius: 12,
    marginBottom: 12,
    minWidth: 200,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  resetButton: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  resetButtonText: {
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Usage Data Styles
  usageContainer: {
    flex: 1,
  },
  chartSection: {
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  totalTimeText: {
    fontSize: 14,
    marginTop: 12,
  },
  appsSection: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
  },
  appsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  appItem: {
    alignItems: 'center',
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  appInfo: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  appColorDot: {
    borderRadius: 6,
    height: 12,
    marginRight: 12,
    width: 12,
  },
  appDetails: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  packageName: {
    fontSize: 12,
  },
  appUsage: {
    alignItems: 'flex-end',
  },
  usageTime: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  usagePercentage: {
    fontSize: 12,
  },
  
  // No Data Styles
  noDataContainer: {
    alignItems: 'center',
    borderRadius: 16,
    padding: 40,
  },
  noDataIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  noDataText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  noDataReason: {
    alignSelf: 'stretch',
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'left',
  },
});

export default DigitalWellbeingDashboard;
