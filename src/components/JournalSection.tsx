import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { theme } from '../config/theme';
import { journalStorage, JournalEntry } from '../services/journalStorage';
import { Card } from './UI';

interface JournalSectionProps {
  isExpanded: boolean;
  onClose: () => void;
}

export const JournalSection: React.FC<JournalSectionProps> = ({ isExpanded, onClose }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [selectedMood, setSelectedMood] = useState<JournalEntry['mood']>('okay');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ totalEntries: 0, streak: 0, thisMonth: 0 });

  const slideAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (isExpanded) {
      loadEntries();
      loadStats();
    }
  }, [isExpanded]);

  const loadEntries = async () => {
    try {
      const loadedEntries = await journalStorage.getAllEntries();
      setEntries(loadedEntries.slice(0, 10)); // Show last 10 entries
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const loadStats = async () => {
    try {
      const journalStats = await journalStorage.getStats();
      setStats(journalStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.trim()) return;

    setIsLoading(true);
    try {
      await journalStorage.addEntry(newEntry, selectedMood);
      setNewEntry('');
      setSelectedMood('okay');
      await loadEntries();
      await loadStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to save journal entry');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  const getMoodEmoji = (mood: JournalEntry['mood'] = 'okay') => {
    const moods = {
      terrible: '😢',
      bad: '😟',
      okay: '😐',
      good: '😊',
      great: '😁',
    };
    return moods[mood];
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  const opacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents={isExpanded ? 'auto' : 'none'}
    >
      <Card style={styles.journalCard}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>📝 Journal</Text>
            <Text style={styles.subtitle}>Reflect on your discipline journey</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.thisMonth}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalEntries}</Text>
            <Text style={styles.statLabel}>Total Entries</Text>
          </View>
        </View>

        {/* New Entry Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>How was your discipline today?</Text>
          
          {/* Mood Selection */}
          <View style={styles.moodSelector}>
            {(['terrible', 'bad', 'okay', 'good', 'great'] as const).map((mood) => (
              <TouchableOpacity
                key={mood}
                style={[
                  styles.moodButton,
                  selectedMood === mood && styles.moodButtonSelected,
                ]}
                onPress={() => setSelectedMood(mood)}
              >
                <Text style={styles.moodEmoji}>{getMoodEmoji(mood)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.textInput}
            value={newEntry}
            onChangeText={setNewEntry}
            placeholder="Write about your discipline progress, challenges, wins..."
            placeholderTextColor={theme.colors.text.tertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          <TouchableOpacity
            style={[styles.addButton, (!newEntry.trim() || isLoading) && styles.addButtonDisabled]}
            onPress={handleAddEntry}
            disabled={!newEntry.trim() || isLoading}
          >
            <Text style={styles.addButtonText}>
              {isLoading ? 'Saving...' : 'Add Entry'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Entries */}
        <ScrollView style={styles.entriesContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.entriesTitle}>Recent Entries</Text>
          {entries.length === 0 ? (
            <Text style={styles.emptyText}>Start your discipline journal today! ✨</Text>
          ) : (
            entries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                  <Text style={styles.entryMood}>{getMoodEmoji(entry.mood)}</Text>
                </View>
                <Text style={styles.entryContent}>{entry.content}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  journalCard: {
    margin: 0,
    borderRadius: 0,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    maxHeight: '85%',
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    color: theme.colors.text.secondary,
    fontWeight: '300',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...theme.typography.h4,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  statLabel: {
    ...theme.typography.small,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: theme.spacing.xs,
  },
  inputSection: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  moodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  moodButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodButtonSelected: {
    backgroundColor: theme.colors.primary,
  },
  moodEmoji: {
    fontSize: 20,
  },
  textInput: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    minHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  entriesContainer: {
    flex: 1,
  },
  entriesTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: theme.spacing.lg,
  },
  entryCard: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  entryDate: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  entryMood: {
    fontSize: 16,
  },
  entryContent: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
});
