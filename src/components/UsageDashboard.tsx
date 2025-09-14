import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import UsageTracker, { UsageStats, AppUsage } from '../services/usageTracker';

interface UsageDashboardProps {
  theme: any;
}

const UsageDashboard: React.FC<UsageDashboardProps> = ({ theme }) => {
  const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const usageTracker = UsageTracker.getInstance();

  useEffect(() => {
    checkPermissionAndLoadData();
    
    // Check permissions every time component mounts
    const checkPermissions = async () => {
      const permission = await usageTracker.checkPermissions();
      if (permission !== hasPermission) {
        setHasPermission(permission);
        if (permission) {
          const stats = await usageTracker.getUsageStats(1);
          setUsageStats(stats);
        }
      }
    };

  const interval = globalThis.setInterval(checkPermissions, 5000); // Check every 5 seconds
    
  return () => globalThis.clearInterval(interval);
  }, [hasPermission]);

  const checkPermissionAndLoadData = async () => {
    setIsLoading(true);
    try {
      const permission = await usageTracker.hasUsageAccessPermission();
      setHasPermission(permission);
      
      if (permission) {
        const stats = await usageTracker.getUsageStats(1);
        setUsageStats(stats);
      }
    } catch (error) {
      console.error('Error checking permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = async () => {
    try {
      const granted = await usageTracker.requestUsageAccessPermission();
      if (granted) {
        await checkPermissionAndLoadData();
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  const onRefresh = async () => {
    await checkPermissionAndLoadData();
  };

  const renderAppUsageItem = (app: AppUsage, index: number) => {
    const isTopApp = index < 3;
    
    return (
      <View key={app.packageName} style={[styles.appItem, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.appRank}>
          <Text style={[styles.rankText, { color: isTopApp ? '#8B5CF6' : theme.textSecondary }]}>
            #{index + 1}
          </Text>
        </View>
        
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: theme.text }]} numberOfLines={1}>
            {app.appName}
          </Text>
          <Text style={[styles.packageName, { color: theme.textSecondary }]} numberOfLines={1}>
            {app.packageName}
          </Text>
        </View>
        
        <View style={styles.usageTime}>
          <Text style={[styles.timeText, { color: theme.text }]}>
            {usageTracker.formatTime(app.timeInForeground)}
          </Text>
        </View>
      </View>
    );
  };

  const renderPermissionRequest = () => (
    <View style={[styles.permissionContainer, { backgroundColor: theme.cardBackground }]}>
      <Text style={[styles.permissionTitle, { color: theme.text }]}>
        📱 Screen Time Tracking
      </Text>
      <Text style={[styles.permissionText, { color: theme.textSecondary }]}>
        Track your app usage and screen time to build better digital discipline habits.
      </Text>
      
      <View style={styles.stepsContainer}>
        <Text style={[styles.stepsTitle, { color: theme.text }]}>How to enable:</Text>
        <Text style={[styles.stepText, { color: theme.textSecondary }]}>1. Tap &quot;Grant Permission&quot; below</Text>
        <Text style={[styles.stepText, { color: theme.textSecondary }]}>2. Find &quot;Kigen&quot; in the list</Text>
        <Text style={[styles.stepText, { color: theme.textSecondary }]}>3. Toggle &quot;Allow usage access&quot; ON</Text>
        <Text style={[styles.stepText, { color: theme.textSecondary }]}>4. Return to the app</Text>
      </View>
      
      <TouchableOpacity
        style={[styles.permissionButton, { backgroundColor: '#8B5CF6' }]}
        onPress={requestPermission}
      >
        <Text style={styles.permissionButtonText}>⚙️ Grant Permission</Text>
      </TouchableOpacity>
      
      {__DEV__ && (
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: '#10B981', marginTop: 8 }]}
          onPress={async () => {
            await usageTracker.setUsagePermission(true);
            await checkPermissionAndLoadData();
          }}
        >
          <Text style={styles.permissionButtonText}>🧪 Demo: Grant Permission</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderUsageStats = () => {
    if (!usageStats.length) {
      return (
        <View style={[styles.noDataContainer, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.noDataText, { color: theme.textSecondary }]}>
            No usage data available
          </Text>
        </View>
      );
    }

    const todayStats = usageStats[0];
    if (!todayStats) {
      return (
        <View style={[styles.noDataContainer, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.noDataText, { color: theme.textSecondary }]}>
            No usage data available
          </Text>
        </View>
      );
    }

    const displayedApps = isExpanded ? todayStats.apps : todayStats.apps.slice(0, 5);

    return (
      <View style={[styles.statsContainer, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.statsHeader}>
          <View>
            <Text style={[styles.statsTitle, { color: theme.text }]}>
              Today&apos;s Screen Time
            </Text>
            <Text style={[styles.totalTime, { color: '#8B5CF6' }]}>
              {usageTracker.formatTime(todayStats.totalScreenTime)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            <Text style={[styles.expandButtonText, { color: '#8B5CF6' }]}>
              {isExpanded ? 'Show Less' : 'Show All'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.appsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#8B5CF6" />
          }
        >
          {displayedApps.map((app, index) => renderAppUsageItem(app, index))}
        </ScrollView>

        {!isExpanded && todayStats.apps.length > 5 && (
          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => setIsExpanded(true)}
          >
            <Text style={[styles.showMoreText, { color: theme.textSecondary }]}>
              +{todayStats.apps.length - 5} more apps
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Usage Tracking</Text>
      </View>
      
      {!hasPermission ? renderPermissionRequest() : renderUsageStats()}
    </View>
  );
};

const styles = StyleSheet.create({
  appInfo: {
    flex: 1,
    marginLeft: 12,
  },
  appItem: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 8,
    padding: 12,
  },
  appName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  appRank: {
    alignItems: 'center',
    width: 40,
  },
  appsList: {
    maxHeight: 300,
  },
  container: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  expandButton: {
    padding: 8,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerContainer: {
    marginBottom: 16,
  },
  noDataContainer: {
    alignItems: 'center',
    borderRadius: 16,
    padding: 40,
  },
  noDataText: {
    fontSize: 16,
  },
  packageName: {
    fontSize: 12,
  },
  permissionButton: {
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    alignItems: 'center',
    borderRadius: 16,
    padding: 20,
  },
  permissionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  showMoreButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  showMoreText: {
    fontSize: 14,
  },
  statsContainer: {
    borderRadius: 16,
    padding: 16,
  },
  statsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    marginBottom: 4,
    paddingLeft: 8,
  },
  stepsContainer: {
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalTime: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  usageTime: {
    alignItems: 'flex-end',
  },
});

export default UsageDashboard;
