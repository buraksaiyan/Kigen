import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { Card } from '../components/UI';
import { KigenKanjiBackground } from '../components/KigenKanjiBackground';
import { KigenLogo } from '../components/KigenLogo';

interface ProgressScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ visible, onClose }) => {
  const [currentView, setCurrentView] = useState<'focus-logs' | 'kigen-stats'>('focus-logs');

  // Mock data for demonstration
  const focusLogs = [
    { id: 1, type: 'Flow Focus', duration: 45, date: '2025-09-08', completed: true },
    { id: 2, type: 'Executioner Focus', duration: 30, date: '2025-09-07', completed: true },
    { id: 3, type: 'Meditation Focus', duration: 20, date: '2025-09-06', completed: false },
    { id: 4, type: 'Body Focus', duration: 60, date: '2025-09-05', completed: true },
  ];

  const kigenStats = [
    { id: 1, action: 'Focus Session Completed', points: '+15', date: '2025-09-08' },
    { id: 2, action: 'Journal Entry Added', points: '+5', date: '2025-09-08' },
    { id: 3, action: 'Goal Completed', points: '+10', date: '2025-09-07' },
    { id: 4, action: 'Session Aborted', points: '-5', date: '2025-09-06' },
    { id: 5, action: 'Social Media Usage', points: '-3', date: '2025-09-06' },
  ];

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

                <View style={styles.logsContainer}>
                  {focusLogs.map((log) => (
                    <Card key={log.id} style={styles.logCard}>
                      <View style={styles.logHeader}>
                        <Text style={styles.logType}>{log.type}</Text>
                        <Text style={[
                          styles.logStatus,
                          { color: log.completed ? theme.colors.success : theme.colors.danger }
                        ]}>
                          {log.completed ? 'Completed' : 'Aborted'}
                        </Text>
                      </View>
                      <View style={styles.logDetails}>
                        <Text style={styles.logDuration}>{log.duration} minutes</Text>
                        <Text style={styles.logDate}>{log.date}</Text>
                      </View>
                    </Card>
                  ))}
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.contentHeader}>
                  <Text style={styles.title}>Kigen Stats Logs</Text>
                  <Text style={styles.subtitle}>Points gained and lost</Text>
                </View>

                <View style={styles.logsContainer}>
                  {kigenStats.map((stat) => (
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
                  ))}
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
    color: theme.colors.primary,
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
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
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
  logPoints: {
    ...theme.typography.bodyLarge,
    fontWeight: '700',
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
});
