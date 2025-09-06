import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { journalStorage, JournalEntry } from '../services/journalStorage';
import { theme } from '../config/theme';
import { Card } from '../components/UI';
import { KigenKanjiBackground } from '../components/KigenKanjiBackground';

interface JournalsScreenProps {
  visible?: boolean;
  onClose?: () => void;
}

export const JournalsScreen: React.FC<JournalsScreenProps> = ({
  visible = true,
  onClose,
}) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalEntries: 0, streak: 0, thisMonth: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [entriesData, statsData] = await Promise.all([
        journalStorage.getAllEntries(),
        journalStorage.getStats(),
      ]);
      setEntries(entriesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading journal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    Alert.alert(
      'Delete Entry?',
      'This journal entry will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await journalStorage.deleteEntry(entryId);
              await loadData(); // Reload data
            } catch (error) {
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMoodEmoji = (mood: JournalEntry['mood']): string => {
    const moods: Record<JournalEntry['mood'], string> = {
      terrible: 'Terrible',
      bad: 'Bad',
      okay: 'Okay',
      good: 'Good',
      great: 'Great',
    };
    return moods[mood];
  };

  const getMoodColor = (mood: JournalEntry['mood']): string => {
    const colors: Record<JournalEntry['mood'], string> = {
      terrible: theme.colors.danger,
      bad: '#ff6b35',
      okay: theme.colors.text.secondary,
      good: '#4ade80',
      great: theme.colors.success,
    };
    return colors[mood];
  };

  // Group entries by date
  const groupedEntries = entries.reduce((acc, entry) => {
    const date = new Date(entry.date).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, JournalEntry[]>);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading journals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <KigenKanjiBackground />
        
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>起源 Journals</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Content */}
          <View style={styles.content}>
            <View style={styles.contentHeader}>
              <Text style={styles.title}>Your Journals</Text>
              <Text style={styles.subtitle}>Reflect on your discipline journey</Text>
            </View>
          </View>

          {/* Stats */}
          <Card style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.streak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.thisMonth}</Text>
                <Text style={styles.statLabel}>This Month</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalEntries}</Text>
                <Text style={styles.statLabel}>Total Entries</Text>
              </View>
            </View>
          </Card>

          {/* Journal Entries by Date */}
          {Object.entries(groupedEntries).map(([date, dayEntries]) => (
            <View key={date} style={styles.daySection}>
              <Text style={styles.dayTitle}>
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              
              {dayEntries.map((entry) => (
                <Card key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryMeta}>
                      <View style={styles.moodContainer}>
                        <Text style={styles.moodEmoji}>{getMoodEmoji(entry.mood)}</Text>
                        <View
                          style={[
                            styles.moodIndicator,
                            { backgroundColor: getMoodColor(entry.mood) },
                          ]}
                        />
                      </View>
                      <Text style={styles.entryTime}>
                        {new Date(entry.date).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      onPress={() => deleteEntry(entry.id)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.entryContent}>{entry.content}</Text>
                </Card>
              ))}
            </View>
          ))}

          {/* Empty State */}
          {entries.length === 0 && (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Journal Entries Yet</Text>
              <Text style={styles.emptyText}>
                Start journaling about your discipline journey from the main screen!
              </Text>
            </Card>
          )}
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
    borderBottomColor: '#374151',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  contentHeader: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  statsCard: {
    marginBottom: theme.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
  },
  statNumber: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  statLabel: {
    ...theme.typography.small,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  daySection: {
    marginBottom: theme.spacing.xl,
  },
  dayTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  entryCard: {
    marginBottom: theme.spacing.md,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  moodEmoji: {
    fontSize: 20,
    marginRight: theme.spacing.xs,
  },
  moodIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  entryTime: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
  },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 16,
  },
  deleteText: {
    fontSize: 14,
  },
  entryContent: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});
