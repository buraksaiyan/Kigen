import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { journalStorage, JournalEntry } from '../services/journalStorage';
import { theme } from '../config/theme';
import { Card } from '../components/UI';
import { useTranslation } from '../i18n/I18nProvider';

interface JournalsScreenProps {
  visible?: boolean;
  onClose?: () => void;
}

export const JournalsScreen: React.FC<JournalsScreenProps> = ({
  visible = true,
  onClose,
}) => {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [allEntries, setAllEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalEntries: 0, streak: 0, thisMonth: 0 });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      const [entriesData, statsData] = await Promise.all([
        journalStorage.getAllEntries(),
        journalStorage.getStats(),
      ]);
      setAllEntries(entriesData);
      setStats(statsData);
      filterEntriesByMonth(entriesData, selectedMonth, selectedYear);
    } catch (error) {
      console.error('Error loading journal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEntriesByMonth = (allEntries: JournalEntry[], month: number, year: number) => {
    const filteredEntries = allEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === month && entryDate.getFullYear() === year;
    });
    setEntries(filteredEntries);
  };

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    filterEntriesByMonth(allEntries, month, year);
  };

  const deleteEntry = async (entryId: string) => {
    Alert.alert(
      t('journal.deleteEntry'),
      t('journal.deleteEntryConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await journalStorage.deleteEntry(entryId);
              await loadData(); // Reload data
            } catch {
              Alert.alert(t('common.error'), t('journal.deleteEntryError'));
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
          <Text style={styles.loadingText}>{t('journal.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>{t('common.close')}</Text>
          </TouchableOpacity>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Content */}
          <View style={styles.content}>
            <View style={styles.contentHeader}>
              <Text style={styles.title}>{t('journal.yourJournals')}</Text>
              <Text style={styles.subtitle}>{t('journal.subtitle')}</Text>
            </View>
          </View>

          {/* Stats */}
          <Card style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.streak}</Text>
                <Text style={styles.statLabel}>{t('journal.dayStreak')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.thisMonth}</Text>
                <Text style={styles.statLabel}>{t('journal.thisMonth')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalEntries}</Text>
                <Text style={styles.statLabel}>{t('journal.totalEntries')}</Text>
              </View>
            </View>
          </Card>

          {/* Month Selector */}
          <Card style={styles.monthSelectorCard}>
            <View style={styles.monthSelector}>
              <TouchableOpacity
                style={styles.monthNavButtonInline}
                onPress={() => {
                  const currentDate = new Date(selectedYear, selectedMonth - 1, 1);
                  currentDate.setMonth(currentDate.getMonth() - 1);
                  const newMonth = currentDate.getMonth();
                  const newYear = currentDate.getFullYear();
                  handleMonthChange(newMonth, newYear);
                }}
              >
                <Text style={styles.monthNavText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity
                style={[styles.monthNavButtonInline, (selectedMonth >= new Date().getMonth() && selectedYear >= new Date().getFullYear()) && styles.monthNavButtonDisabled]}
                onPress={() => {
                  const currentDate = new Date(selectedYear, selectedMonth + 1, 1);
                  currentDate.setMonth(currentDate.getMonth() + 1);
                  const newMonth = currentDate.getMonth();
                  const newYear = currentDate.getFullYear();
                  // Don't allow selecting future months
                  if (newYear < new Date().getFullYear() || (newYear === new Date().getFullYear() && newMonth <= new Date().getMonth())) {
                    handleMonthChange(newMonth, newYear);
                  }
                }}
                disabled={selectedMonth >= new Date().getMonth() && selectedYear >= new Date().getFullYear()}
              >
                <Text style={[styles.monthNavText, (selectedMonth >= new Date().getMonth() && selectedYear >= new Date().getFullYear()) && styles.monthNavTextDisabled]}>›</Text>
              </TouchableOpacity>
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
                      <Text style={styles.deleteText}>×</Text>
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
              <Text style={styles.emptyTitle}>{t('journal.noEntriesYet')}</Text>
              <Text style={styles.emptyText}>
                {t('journal.emptyStateText')}
              </Text>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: theme.colors.text.secondary, // Use theme color
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1, // Already correct - pure black
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
  },
  contentHeader: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  daySection: {
    marginBottom: theme.spacing.xl,
  },
  dayTitle: {
    ...theme.typography.h4,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  deleteText: {
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold', // Use theme color
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  entryCard: {
    marginBottom: theme.spacing.md,
  },
  entryContent: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  entryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  entryMeta: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  entryTime: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
  },
  headerTitle: {
    color: theme.colors.text.primary, // Use theme color
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  logoContainer: {
    alignItems: 'center',
    flex: 1,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15, // Use theme border color
  },
  monthNavButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.5,
  },
  monthNavButtonInline: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    marginHorizontal: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    width: 32,
  },
  monthNavText: {
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: '600',
  },
  monthNavTextDisabled: {
    color: theme.colors.text.tertiary,
  },
  monthSelector: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  monthSelectorCard: {
    marginBottom: theme.spacing.lg,
  },
  monthText: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  placeholder: { width: 60 },
  scrollView: {
    flex: 1,
  },
  statDivider: {
    backgroundColor: theme.colors.border,
    height: 30,
    width: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    ...theme.typography.small,
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
    marginTop: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  statNumber: {
    ...theme.typography.h3,
    color: theme.colors.text.primary, // Use theme color instead of fixed gray
    fontWeight: '700',
  },
  statsCard: {
    marginBottom: theme.spacing.lg,
  },
  statsRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
});
