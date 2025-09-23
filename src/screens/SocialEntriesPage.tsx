import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../config/theme';

const SOCIAL_ENTRIES_STORAGE_KEY = '@kigen_social_entries';

type MoodLevel = 1 | 2 | 3 | 4 | 5;
type SocialActivity = 'meeting' | 'call' | 'text' | 'hangout' | 'event' | 'work' | 'family' | 'other';
type TimeSpent = '15min' | '30min' | '1hour' | '2hours' | '3hours' | 'halfday' | 'fullday';

interface SocialEntry {
  id: string;
  activity: SocialActivity;
  description: string;
  peopleCount: number;
  moodBefore: MoodLevel;
  moodAfter: MoodLevel;
  timeSpent: TimeSpent;
  quality: MoodLevel;
  notes?: string;
  createdAt: string;
}

interface SocialEntriesPageProps {
  visible?: boolean;
  onClose?: () => void;
  onSave?: () => void;
}

const activityConfig: Record<SocialActivity, { icon: string; label: string; color: string }> = {
  meeting: { icon: 'business', label: 'Meeting', color: '#3498DB' },
  call: { icon: 'phone', label: 'Phone Call', color: '#E74C3C' },
  text: { icon: 'message', label: 'Messaging', color: '#2ECC71' },
  hangout: { icon: 'people', label: 'Hangout', color: '#F39C12' },
  event: { icon: 'event', label: 'Event', color: '#9B59B6' },
  work: { icon: 'work', label: 'Work Social', color: '#34495E' },
  family: { icon: 'family-restroom', label: 'Family Time', color: '#E67E22' },
  other: { icon: 'more-horiz', label: 'Other', color: '#95A5A6' },
};

const timeSpentConfig: Record<TimeSpent, { label: string; minutes: number }> = {
  '15min': { label: '15 minutes', minutes: 15 },
  '30min': { label: '30 minutes', minutes: 30 },
  '1hour': { label: '1 hour', minutes: 60 },
  '2hours': { label: '2 hours', minutes: 120 },
  '3hours': { label: '3+ hours', minutes: 180 },
  'halfday': { label: 'Half day', minutes: 240 },
  'fullday': { label: 'Full day', minutes: 480 },
};

const moodEmojis = ['😢', '😕', '😐', '😊', '😄'];
const moodLabels = ['Poor', 'Fair', 'Okay', 'Good', 'Great'];

export const SocialEntriesPage: React.FC<SocialEntriesPageProps> = ({
  visible = true,
  onClose,
  onSave,
}) => {
  const [activity, setActivity] = useState<SocialActivity>('hangout');
  const [description, setDescription] = useState('');
  const [peopleCount, setPeopleCount] = useState(1);
  const [moodBefore, setMoodBefore] = useState<MoodLevel>(3);
  const [moodAfter, setMoodAfter] = useState<MoodLevel>(3);
  const [timeSpent, setTimeSpent] = useState<TimeSpent>('1hour');
  const [quality, setQuality] = useState<MoodLevel>(3);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const saveSocialEntry = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please describe your social interaction');
      return;
    }

    setLoading(true);
    try {
      const newEntry: SocialEntry = {
        id: Date.now().toString(),
        activity,
        description: description.trim(),
        peopleCount,
        moodBefore,
        moodAfter,
        timeSpent,
        quality,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      // Load existing entries
      const existingEntries = await AsyncStorage.getItem(SOCIAL_ENTRIES_STORAGE_KEY);
      const entries: SocialEntry[] = existingEntries ? JSON.parse(existingEntries) : [];
      
      // Add new entry
      entries.unshift(newEntry);
      
      // Keep only last 100 entries
      const trimmedEntries = entries.slice(0, 100);
      
      // Save back to storage
      await AsyncStorage.setItem(SOCIAL_ENTRIES_STORAGE_KEY, JSON.stringify(trimmedEntries));

      // Clear form
      setDescription('');
      setPeopleCount(1);
      setMoodBefore(3);
      setMoodAfter(3);
      setTimeSpent('1hour');
      setQuality(3);
      setNotes('');
      
      onSave?.();
      Alert.alert('Success', 'Social interaction logged successfully!');
    } catch (error) {
      console.error('Error saving social entry:', error);
      Alert.alert('Error', 'Failed to log social interaction');
    } finally {
      setLoading(false);
    }
  };

  const renderMoodSelector = (
    label: string,
    value: MoodLevel,
    onChange: (mood: MoodLevel) => void
  ) => (
    <View style={styles.moodSection}>
      <Text style={styles.moodLabel}>{label}</Text>
      <View style={styles.moodOptions}>
        {[1, 2, 3, 4, 5].map((mood) => (
          <TouchableOpacity
            key={mood}
            onPress={() => onChange(mood as MoodLevel)}
            style={[
              styles.moodOption,
              value === mood && styles.moodOptionSelected,
            ]}
          >
            <Text style={styles.moodEmoji}>
              {moodEmojis[mood - 1]}
            </Text>
            <Text style={[
              styles.moodLabelText,
              value === mood && styles.moodLabelSelected,
            ]}>
              {moodLabels[mood - 1]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (!visible) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Social Interaction</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Type of Interaction</Text>
          <View style={styles.activityGrid}>
            {Object.entries(activityConfig).map(([key, config]) => (
              <TouchableOpacity
                key={key}
                onPress={() => setActivity(key as SocialActivity)}
                style={[
                  styles.activityOption,
                  activity === key && { backgroundColor: config.color + '20', borderColor: config.color },
                ]}
              >
                <Icon name={config.icon} size={24} color={config.color} />
                <Text style={[styles.activityLabel, { color: config.color }]}>
                  {config.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={styles.textInput}
            value={description}
            onChangeText={setDescription}
            placeholder="What did you do? Who did you interact with?"
            placeholderTextColor={theme.colors.text.secondary}
            maxLength={200}
          />

          <Text style={styles.label}>Number of People</Text>
          <View style={styles.peopleCounter}>
            <TouchableOpacity
              onPress={() => setPeopleCount(Math.max(1, peopleCount - 1))}
              style={styles.counterButton}
            >
              <Icon name="remove" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.counterText}>{peopleCount} people</Text>
            <TouchableOpacity
              onPress={() => setPeopleCount(Math.min(20, peopleCount + 1))}
              style={styles.counterButton}
            >
              <Icon name="add" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Time Spent</Text>
          <View style={styles.timeOptions}>
            {Object.entries(timeSpentConfig).map(([key, config]) => (
              <TouchableOpacity
                key={key}
                onPress={() => setTimeSpent(key as TimeSpent)}
                style={[
                  styles.timeOption,
                  timeSpent === key && styles.timeOptionSelected,
                ]}
              >
                <Text style={[
                  styles.timeOptionText,
                  timeSpent === key && styles.timeOptionTextSelected,
                ]}>
                  {config.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {renderMoodSelector('How did you feel before?', moodBefore, setMoodBefore)}
          {renderMoodSelector('How did you feel after?', moodAfter, setMoodAfter)}
          {renderMoodSelector('Overall interaction quality?', quality, setQuality)}

          <Text style={styles.label}>Additional Notes (optional)</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional thoughts or observations..."
            placeholderTextColor={theme.colors.text.secondary}
            multiline
            maxLength={300}
          />

          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: activityConfig[activity].color },
              loading && styles.saveButtonDisabled,
            ]}
            onPress={saveSocialEntry}
            disabled={loading}
          >
            <Icon name="save" size={20} color={theme.colors.background} />
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Log Interaction'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.insightsSection}>
          <Text style={styles.insightsTitle}>📊 Social Wellness Insights</Text>
          <Text style={styles.insightText}>
            • Track how social interactions affect your mood
          </Text>
          <Text style={styles.insightText}>
            • Monitor the quality and frequency of your connections
          </Text>
          <Text style={styles.insightText}>
            • Identify which activities boost your social energy
          </Text>
          <Text style={styles.insightText}>
            • Build awareness of your social patterns and preferences
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },
  activityLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  activityOption: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    marginBottom: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    minWidth: '30%',
    padding: theme.spacing.md,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  closeButtonText: {
    color: theme.colors.text.secondary,
    fontSize: 18,
    fontWeight: '600',
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
  },
  counterButton: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
  },
  counterText: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: theme.spacing.lg,
    minWidth: 80,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerSpacer: {
    width: 32,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    flex: 1,
    marginHorizontal: theme.spacing.md,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: theme.spacing.xl,
  },
  insightText: {
    ...theme.typography.small,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  insightsSection: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    padding: theme.spacing.lg,
  },
  insightsTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  moodEmoji: {
    fontSize: 20,
    marginBottom: theme.spacing.xs,
  },
  moodLabel: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  moodLabelSelected: {
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  moodLabelText: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    textAlign: 'center',
  },
  moodOption: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 2,
    padding: theme.spacing.md,
  },
  moodOptionSelected: {
    backgroundColor: theme.colors.secondary + '20',
    borderColor: theme.colors.secondary,
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodSection: {
    marginBottom: theme.spacing.md,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  peopleCounter: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  saveButton: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: theme.colors.background,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    color: theme.colors.text.primary,
    fontSize: 16,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  timeOption: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    marginBottom: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  timeOptionSelected: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  timeOptionText: {
    color: theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  timeOptionTextSelected: {
    color: theme.colors.background,
  },
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },
});