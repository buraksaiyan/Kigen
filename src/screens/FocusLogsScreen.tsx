import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KigenKanjiBackground } from '../components/KigenKanjiBackground';

interface FocusLog {
  id: string;
  type: 'free' | 'executioner';
  goalId?: string;
  goalTitle?: string;
  duration: number; // in minutes
  actualDuration: number; // actual time spent
  unlocks: number;
  appUsageMinutes: number;
  status: 'completed' | 'aborted';
  startTime: string;
  endTime: string;
  rating?: 'excellent' | 'good' | 'fair' | 'poor';
  ratingReason?: string;
}

interface FocusLogsScreenProps {
  visible: boolean;
  onClose: () => void;
}

export default function FocusLogsScreen({ visible, navigation }: any) {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    totalFocusTime: 0,
    averageUnlocks: 0,
    completionRate: 0,
  });

  useEffect(() => {
    if (visible) {
      loadFocusLogs();
    }
  }, [visible]);

  const loadFocusLogs = async () => {
    try {
      const storedLogs = await AsyncStorage.getItem('@kigen_focus_logs');
      if (storedLogs) {
        const parsedLogs = JSON.parse(storedLogs);
        // Sort by most recent first
        const sortedLogs = parsedLogs.sort((a: FocusLog, b: FocusLog) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
        setLogs(sortedLogs);
        calculateStats(sortedLogs);
      }
    } catch (error) {
      console.error('Error loading focus logs:', error);
    }
  };

  const calculateStats = (logData: FocusLog[]) => {
    const totalSessions = logData.length;
    const completedSessions = logData.filter(log => log.status === 'completed').length;
    const totalFocusTime = logData.reduce((sum, log) => sum + log.actualDuration, 0);
    const totalUnlocks = logData.reduce((sum, log) => sum + log.unlocks, 0);
    const averageUnlocks = totalSessions > 0 ? totalUnlocks / totalSessions : 0;
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    setStats({
      totalSessions,
      completedSessions,
      totalFocusTime,
      averageUnlocks: Math.round(averageUnlocks * 10) / 10,
      completionRate: Math.round(completionRate),
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getSessionRating = (log: FocusLog): { rating: string; color: string } => {
    // Use AI rating if available
    if (log.rating && typeof log.rating === 'string') {
      const ratingColors = {
        excellent: '#10B981', // Green
        good: '#6D28D9',      // Purple  
        fair: '#F59E0B',      // Orange
        poor: '#EF4444',      // Red
      };
      
      return { 
        rating: log.rating.charAt(0).toUpperCase() + log.rating.slice(1), 
        color: ratingColors[log.rating] || '#9CA3AF' // Fallback color
      };
    }
    
    // Fallback to old algorithm for legacy logs
    const completionPercentage = (log.actualDuration / log.duration) * 100;
    const unlocksPerHour = log.actualDuration > 0 ? (log.unlocks / (log.actualDuration / 60)) : 0;
    
    if (log.status === 'aborted') {
      return { rating: 'Failed', color: '#DC2626' };
    }
    
    if (completionPercentage >= 90 && unlocksPerHour <= 2) {
      return { rating: 'Excellent', color: '#10B981' };
    } else if (completionPercentage >= 75 && unlocksPerHour <= 5) {
      return { rating: 'Good', color: '#6D28D9' };
    } else if (completionPercentage >= 50) {
      return { rating: 'Fair', color: '#F59E0B' };
    } else {
      return { rating: 'Poor', color: '#EF4444' };
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
    <SafeAreaView style={styles.container}>
      {/* Always use default Kanji background for consistency */}
      <KigenKanjiBackground style={StyleSheet.absoluteFillObject} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Focus Logs</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeButton}>Close</Text>
        </TouchableOpacity>
      </View>        <ScrollView style={styles.content}>
          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Focus Statistics</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.totalSessions}</Text>
                <Text style={styles.statLabel}>Total Sessions</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.completedSessions}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{formatDuration(stats.totalFocusTime)}</Text>
                <Text style={styles.statLabel}>Focus Time</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.completionRate}%</Text>
                <Text style={styles.statLabel}>Success Rate</Text>
              </View>
            </View>
          </View>

          {/* Logs Section */}
          <View style={styles.logsContainer}>
            <Text style={styles.logsTitle}>Session History</Text>
            
            {logs.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No focus sessions yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Start your first focus session to see your progress here
                </Text>
              </View>
            ) : (
              logs.map((log) => {
                const rating = getSessionRating(log);
                return (
                  <View key={log.id} style={styles.logCard}>
                    <View style={styles.logHeader}>
                      <View style={styles.logTypeContainer}>
                        <Text style={styles.logType}>
                          {log.type === 'free' ? 'Flow Focus' : 'Executioner Focus'}
                        </Text>
                        {log.goalTitle && (
                          <Text style={styles.logGoal}>{log.goalTitle}</Text>
                        )}
                      </View>
                      <View style={[styles.ratingBadge, { backgroundColor: rating.color }]}>
                        <Text style={styles.ratingText}>{rating.rating}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.logDetails}>
                      <View style={styles.logDetailItem}>
                        <Text style={styles.logDetailLabel}>Duration</Text>
                        <Text style={styles.logDetailValue}>
                          {formatDuration(log.actualDuration)} / {formatDuration(log.duration)}
                        </Text>
                      </View>
                      
                      <View style={styles.logDetailItem}>
                        <Text style={styles.logDetailLabel}>Unlocks</Text>
                        <Text style={styles.logDetailValue}>{log.unlocks}</Text>
                      </View>
                      
                      <View style={styles.logDetailItem}>
                        <Text style={styles.logDetailLabel}>Started</Text>
                        <Text style={styles.logDetailValue}>{formatDate(log.startTime)}</Text>
                      </View>
                    </View>
                    
                    {log.ratingReason && (
                      <View style={styles.ratingReasonContainer}>
                        <Text style={styles.ratingReasonText}>{log.ratingReason}</Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    marginBottom: 30,
  },
  statsTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#374151',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#6d28d9',
  },
  statNumber: {
    color: '#6d28d9',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
  logsContainer: {
    marginBottom: 20,
  },
  logsTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  logCard: {
    backgroundColor: '#374151',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  logTypeContainer: {
    flex: 1,
  },
  logType: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  logGoal: {
    color: '#6d28d9',
    fontSize: 14,
    fontWeight: '600',
  },
  ratingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logDetailItem: {
    alignItems: 'center',
  },
  logDetailLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 5,
  },
  logDetailValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  ratingReasonContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  ratingReasonText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
