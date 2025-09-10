import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { journalStorage, JournalEntry } from '../services/journalStorage';
import { UserStatsService } from '../services/userStatsService';
import { Card } from './UI';
import { KigenKanjiBackground } from './KigenKanjiBackground';
import { KigenLogo } from './KigenLogo';

interface JournalSectionProps {
  isExpanded: boolean;
  onClose: () => void;
}

export const JournalSection: React.FC<JournalSectionProps> = ({ isExpanded, onClose }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ totalEntries: 0, streak: 0, thisMonth: 0 });
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const slideAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

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
      setIsLoading(true);
      const loadedEntries = await journalStorage.getAllEntries();
      setEntries(loadedEntries); // Show all entries, not just 10
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setIsLoading(false);
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
      await journalStorage.addEntry(newEntry);
      
      // Record journal entry for points calculation
      await UserStatsService.recordJournalEntry();
      
      setNewEntry('');
      await loadEntries();
      await loadStats();
    } catch (error) {
      console.error('Failed to save journal entry:', error);
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
      <SafeAreaView style={styles.journalCard}>
          {/* Kanji background like Goals page */}
          <KigenKanjiBackground />
          
          {/* Modal Header - matches GoalsScreen */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <KigenLogo size="small" variant="image" showJapanese={false} />
            </View>
            <View style={styles.placeholder} />
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

        {/* Recent Entries - Scrollable */}
        <View style={[styles.contentContainer, { marginBottom: keyboardHeight > 0 ? keyboardHeight + 140 : 0 }]}>
          <ScrollView style={styles.entriesContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.entriesTitle}>Recent Entries</Text>
            {entries.length === 0 ? (
              <Text style={styles.emptyText}>Start your discipline journal today!</Text>
            ) : (
              entries.map((entry) => (
                <View key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                  </View>
                  <Text style={styles.entryContent}>{entry.content}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* Input Section - Fixed at bottom with keyboard awareness */}
        <View 
          style={[
            styles.inputSection, 
            keyboardHeight > 0 && {
              position: 'absolute',
              bottom: keyboardHeight + 60, // Add space above navigation
              left: 0,
              right: 0,
              backgroundColor: theme.colors.surface,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
            }
          ]}
        >
          <Text style={styles.inputLabel}>Write about your discipline journey</Text>
          
          <TextInput
            style={[
              styles.textInput,
              {
                minHeight: 100,
                maxHeight: 200,
              }
            ]}
            value={newEntry}
            onChangeText={setNewEntry}
            placeholder="Write about your discipline progress, challenges, wins..."
            placeholderTextColor={theme.colors.text.tertiary}
            multiline
            textAlignVertical="top"
            blurOnSubmit={true}
            returnKeyType="done"
          />
          
          {/* Button Row - Always visible */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setNewEntry('');
                onClose(); // Close the journal section
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
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
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
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
    flex: 1,
    margin: 0,
    borderRadius: 0,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  closeButtonText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  placeholder: {
    width: 60, // Same width as close button area
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
    textShadowColor: '#888691',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
  },
  statLabel: {
    ...theme.typography.small,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: theme.spacing.xs,
  },
  inputSection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl, // More space to avoid navigation overlap
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  contentContainer: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSecondary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  inputLabel: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  textInput: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    textAlignVertical: 'top',
    fontSize: 16, // Prevent zoom on iOS
  },
  addButton: {
    flex: 1,
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
  entryContent: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  blackBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
});
