import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
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
  const [stats, setStats] = useState({ totalEntries: 0, streak: 0, thisMonth: 0, points: 0 });
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const inputBottomAnim = React.useRef(new Animated.Value(0)).current;
  const [inputHeight, setInputHeight] = useState<number>(64);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        Animated.timing(inputBottomAnim, {
          toValue: e.endCoordinates.height,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        Animated.timing(inputBottomAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  const handleClose = () => {
    console.log('📱 JournalSection close button pressed');
    // Dismiss keyboard before closing
    Keyboard.dismiss();
    onClose();
  };

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
      const allEntries = await journalStorage.getAllEntries();
      // Filter to show only today's entries
      const today = new Date();
      const todayString = today.toDateString();
      const todayEntries = allEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.toDateString() === todayString;
      });
      setEntries(todayEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const journalStats = await journalStorage.getStats();
      // Get current rating to include JOU points
      const currentRating = await UserStatsService.getCurrentRating();
      setStats({
        ...journalStats,
        points: currentRating.stats.JOU // Add points from rating system
      });
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
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <KigenLogo size="small" variant="image" showJapanese={false} />
            </View>
            <View style={styles.placeholder} />
          </View>
          
          {/* Scrollable Content */}
          <ScrollView 
            style={styles.scrollableContent}
            contentContainerStyle={styles.scrollableContentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.points}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        </View>

            {/* Journal Entries */}
            <View style={styles.entriesContainer}>
              <Text style={styles.sectionTitle}>Recent Entries</Text>
              {entries.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No journal entries yet. Start writing about your discipline journey!
                  </Text>
                </View>
              ) : (
                entries.slice(0, 5).map((entry) => (
                  <View key={entry.id} style={styles.entryCard}>
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                      <Text style={styles.entryTime}>
                        {new Date(entry.date).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </Text>
                    </View>
                    <Text style={styles.entryContent} numberOfLines={3}>
                      {entry.content}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          {/* Input Section - Fixed at bottom with keyboard overlay */}
          <Animated.View
            style={[
              styles.inputSection,
              // animate the bottom position directly so the input rises above the keyboard
              { bottom: inputBottomAnim },
            ]}
          >
            <Text style={styles.inputLabel}>Write about your discipline journey</Text>
            
            <TextInput
              style={[styles.textInput, { height: inputHeight }]}
              value={newEntry}
              onChangeText={setNewEntry}
              onContentSizeChange={(e) => {
                const h = e.nativeEvent.contentSize.height || 64;
                // keep height within the same bounds as the style max/min
                const clamped = Math.min(140, Math.max(64, h));
                setInputHeight(clamped);
              }}
              placeholder="Write about your discipline progress, challenges, wins..."
              placeholderTextColor={theme.colors.text.tertiary}
              multiline
              textAlignVertical="top"
              blurOnSubmit={false}
              returnKeyType="default"
              keyboardType="default"
              autoCorrect={true}
              autoCapitalize="sentences"
            />
            
            {/* Button Row */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setNewEntry('');
                  handleClose();
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
          </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  blackBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.borderRadius.md,
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  cancelButtonText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  closeButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  closeButtonText: {
    ...theme.typography.body,
    color: '#888691',
    fontWeight: '600',
  },
  container: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    bottom: 0,
    justifyContent: 'flex-end',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  contentContainer: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyStateText: {
    ...theme.typography.body,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  entriesContainer: {
    flex: 1,
  },
  entriesTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  entryCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  entryContent: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  entryDate: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  entryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  entryTime: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  header: {
    alignItems: 'flex-start',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  inputLabel: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  inputSection: {
    backgroundColor: theme.colors.background, // Pure black background
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.md, // reduced to avoid oversized input height
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20,
  },
  journalCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 0,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    flex: 1,
    margin: 0, // Pure black background instead of surface
  },
  keyboardAvoid: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    flex: 1,
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? theme.spacing.xl : theme.spacing.md,
  },
  placeholder: {
    width: 60, // Same width as close button area
  },
  scrollableContent: {
    flex: 1,
  },
  scrollableContentContainer: {
  paddingHorizontal: theme.spacing.lg,
  // Make space for the fixed input area so entries are not hidden
  paddingBottom: 180,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
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
    ...theme.typography.h4,
    color: theme.colors.text.primary, // Use theme color instead of fixed gray
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  textInput: {
    ...theme.typography.body,
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    color: theme.colors.text.primary,
    fontSize: 16,
    marginBottom: theme.spacing.md,
    maxHeight: 140,
    minHeight: 64,
    padding: theme.spacing.md,
    textAlignVertical: 'top', // Prevent zoom on iOS
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
});
