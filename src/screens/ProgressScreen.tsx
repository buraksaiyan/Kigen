import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { Card } from '../components/UI';
import { KigenKanjiBackground } from '../components/KigenKanjiBackground';
import { KigenLogo } from '../components/KigenLogo';
import { focusSessionService, type FocusSession, type SessionStats } from '../services/FocusSessionService';

interface ProgressScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ visible, onClose }) => {
  const [currentView, setCurrentView] = useState<'focus-logs' | 'kigen-stats'>('focus-logs');
  const [focusLogs, setFocusLogs] = useState<FocusSession[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [kigenStats, setKigenStats] = useState<any[]>([]);
  const [todaysSummary, setTodaysSummary] = useState<{
    sessions: number;
    minutes: number;
    points: number;
    completedSessions: number;
  }>({ sessions: 0, minutes: 0, points: 0, completedSessions: 0 });
  const [loading, setLoading] = useState(false);

  // Load data when modal becomes visible
  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  // Handle hardware back button
  useEffect(() => {
    if (!visible) return;

    const backAction = () => {
      console.log('📱 Hardware back button pressed in ProgressScreen');
      onClose();
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [visible, onClose]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logs, stats, summary, kigenLogs] = await Promise.all([
        focusSessionService.getFocusSessions(20), // Get last 20 sessions
        focusSessionService.getSessionStats(),
        focusSessionService.getTodaysSummary(),
        focusSessionService.getKigenStatsLogs(20), // Get last 20 Kigen stats logs
      ]);

      setFocusLogs(logs);
      setSessionStats(stats);
      setTodaysSummary(summary);
      setKigenStats(kigenLogs);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <KigenKanjiBackground />
        
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <KigenLogo size="small" variant="image" showJapanese={false} />
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Tab Selection - Similar to Dashboard/Leaderboard */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, currentView === 'focus-logs' && styles.activeTab]}
            onPress={() => setCurrentView('focus-logs')}
          >
            <Text style={[styles.tabText, currentView === 'focus-logs' && styles.activeTabText]}>
              Focus Logs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, currentView === 'kigen-stats' && styles.activeTab]}
            onPress={() => setCurrentView('kigen-stats')}
          >
            <Text style={[styles.tabText, currentView === 'kigen-stats' && styles.activeTabText]}>
              Kigen Stats
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {currentView === 'focus-logs' ? (
              <View>
                <View style={styles.contentHeader}>
                  <Text style={styles.title}>Focus Session Logs</Text>
                  <Text style={styles.subtitle}>Your focus session history</Text>
                </View>

                {/* Today's Summary */}
                <Card style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Today's Summary</Text>
                  <View style={styles.summaryGrid}>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryNumber}>{todaysSummary.sessions}</Text>
                        <Text style={styles.summaryLabel}>Sessions</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryNumber}>{formatDuration(todaysSummary.minutes)}</Text>
                        <Text style={styles.summaryLabel}>Focus Time</Text>
                      </View>
                    </View>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryNumber}>{todaysSummary.points}</Text>
                        <Text style={styles.summaryLabel}>Points Earned</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryNumber}>
                          {todaysSummary.sessions > 0 
                            ? Math.round((todaysSummary.completedSessions / todaysSummary.sessions) * 100)
                            : 0}%
                        </Text>
                        <Text style={styles.summaryLabel}>Completion</Text>
                      </View>
                    </View>
                  </View>
                </Card>

                <View style={styles.logsContainer}>
                  {loading ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>Loading focus logs...</Text>
                    </View>
                  ) : focusLogs.length > 0 ? (
                    focusLogs.map((log) => (
                      <Card key={log.id} style={styles.logCard}>
                        <View style={styles.logHeader}>
                          <View style={styles.logTitleContainer}>
                            <Text style={[styles.logType, { color: log.mode.color }]}>
                              {log.mode.title}
                            </Text>
                            {log.goal && (
                              <Text style={styles.logGoal}>Goal: {log.goal.title}</Text>
                            )}
                          </View>
                          <Text style={[
                            styles.logStatus,
                            { 
                              color: log.completionType === 'completed' 
                                ? theme.colors.success 
                                : log.completionType === 'early-finish' 
                                  ? '#FFA500' // Orange for early finish
                                  : theme.colors.danger // Red for aborted
                            }
                          ]}>
                            {log.completionType === 'completed' 
                              ? 'Completed' 
                              : log.completionType === 'early-finish' 
                                ? 'Finished Early' 
                                : 'Aborted'
                            }
                          </Text>
                        </View>
                        <View style={styles.logDetails}>
                          <Text style={styles.logDuration}>
                            {formatDuration(log.actualDuration)}/{formatDuration(log.duration)}
                          </Text>
                          <Text style={styles.logPoints}>+{log.pointsEarned} points</Text>
                          <Text style={styles.logDate}>{formatDate(log.startTime)}</Text>
                        </View>
                      </Card>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No focus logs yet</Text>
                      <Text style={styles.emptyStateSubtext}>Complete focus sessions to see your progress here</Text>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.contentHeader}>
                  <Text style={styles.title}>Kigen Stats Logs</Text>
                  <Text style={styles.subtitle}>Points gained and lost</Text>
                </View>

                <View style={styles.logsContainer}>
                  {kigenStats.length > 0 ? (
                    kigenStats.map((stat) => (
                      <Card key={stat.id} style={styles.logCard}>
                        <View style={styles.logHeader}>
                          <Text style={styles.logAction}>{stat.action}</Text>
                          <Text style={[
                            styles.logPoints,
                            { color: stat.points.startsWith('+') ? theme.colors.success : theme.colors.danger }
                          ]}>
                            {stat.points}
                          </Text>
                        </View>
                        <Text style={styles.logDate}>{stat.date}</Text>
                      </Card>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No stats activity yet</Text>
                      <Text style={styles.emptyStateSubtext}>Your point gains and losses will appear here</Text>
                    </View>
                  )}
                </View>
              </View>
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
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    ...theme.typography.body,
    color: '#888691',
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 60,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#888691',
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
    borderColor: '#888691',
  },
  tabText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  contentHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontWeight: '700',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  logsContainer: {
    gap: theme.spacing.md,
  },
  logCard: {
    padding: theme.spacing.md,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  logType: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  logAction: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    fontWeight: '600',
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  logStatus: {
    ...theme.typography.body,
    fontWeight: '600',
  },
  logDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logDuration: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  logDate: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyStateText: {
    ...theme.typography.h3,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  emptyStateSubtext: {
    ...theme.typography.body,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  // Summary card styles
  summaryCard: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  summaryTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    fontWeight: '700',
    textAlign: 'center',
  },
  summaryGrid: {
    gap: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    ...theme.typography.h2,
    color: '#888691',
    fontWeight: '700',
  },
  summaryLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  // Enhanced log styles
  logTitleContainer: {
    flex: 1,
  },
  logGoal: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  logPoints: {
    ...theme.typography.body,
    color: '#888691',
    fontWeight: '600',
  },
});
