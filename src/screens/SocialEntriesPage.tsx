import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../config/theme';
import { UserStatsService } from '../services/userStatsService';

const SOCIAL_ENTRIES_STORAGE_KEY = '@inzone_social_entries';

type SocialActivity = 'outside' | 'with_friends';
type TimeSpent = '15min' | '30min' | '1hour' | '2hours' | '3hours' | 'halfday' | 'fullday';

interface SocialEntry {
  id: string;
  activity: SocialActivity;
  timeSpent: TimeSpent;
  createdAt: string;
}

interface SocialEntriesPageProps {
  onClose?: () => void;
  onSave?: () => void;
}

const activityConfig: Record<SocialActivity, { icon: string; label: string; color: string }> = {
  outside: { icon: 'nature', label: 'Being Outside', color: '#2ECC71' },
  with_friends: { icon: 'people', label: 'With Friends', color: '#3498DB' },
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
  onClose,
  onSave,
}) => {
  const navigation = useNavigation();
  const [activity, setActivity] = useState<SocialActivity>('outside');
  const [timeSpent, setTimeSpent] = useState<TimeSpent>('1hour');
  const [loading, setLoading] = useState(false);

  const saveSocialEntry = async () => {
    setLoading(true);
    try {
      const newEntry: SocialEntry = {
        id: Date.now().toString(),
        activity,
        timeSpent,
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

      // Record points and time for social activity
      const hoursSpent = timeSpentConfig[timeSpent].minutes / 60;
      
      if (activity === 'outside') {
        await UserStatsService.recordTimeSpentOutside(hoursSpent);
      } else if (activity === 'with_friends') {
        await UserStatsService.recordTimeSpentWithFriends(hoursSpent);
      }

      // Clear form
      setActivity('outside');
      setTimeSpent('1hour');
      
      Alert.alert('Success', 'Social interaction logged successfully!');
      navigation.goBack();
      
      Alert.alert('Success', 'Social interaction logged successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving social entry:', error);
      Alert.alert('Error', 'Failed to log social interaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Social Interaction</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>What did you do?</Text>
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

          <Text style={styles.label}>How long did you spend?</Text>
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