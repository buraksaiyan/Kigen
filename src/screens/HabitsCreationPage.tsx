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
import { useNavigation } from '@react-navigation/native';
import { theme } from '../config/theme';

const HABITS_STORAGE_KEY = '@kigen_habits';

interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  customDays?: number[];
  targetDuration?: number; // in minutes
  reminderTime?: string;
  isActive: boolean;
  createdAt: string;
  streak: number;
  lastCompleted?: string;
}

interface HabitsCreationPageProps {
  onClose?: () => void;
  onSave?: () => void;
}

const DAYS_OF_WEEK = [
  { id: 0, label: 'Sun', short: 'S' },
  { id: 1, label: 'Mon', short: 'M' },
  { id: 2, label: 'Tue', short: 'T' },
  { id: 3, label: 'Wed', short: 'W' },
  { id: 4, label: 'Thu', short: 'T' },
  { id: 5, label: 'Fri', short: 'F' },
  { id: 6, label: 'Sat', short: 'S' },
];

export const HabitsCreationPage: React.FC<HabitsCreationPageProps> = ({
  onClose,
  onSave,
}) => {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [targetDuration, setTargetDuration] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleCustomDay = (dayId: number) => {
    setCustomDays(prev =>
      prev.includes(dayId)
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId]
    );
  };

  const saveHabit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a habit title');
      return;
    }

    if (frequency === 'custom' && customDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day for custom frequency');
      return;
    }

    setLoading(true);
    try {
      const newHabit: Habit = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim() || undefined,
        frequency,
        customDays: frequency === 'custom' ? customDays : undefined,
        targetDuration: targetDuration ? parseInt(targetDuration) : undefined,
        reminderTime: reminderTime || undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
        streak: 0,
      };

      // Load existing habits
      const existingHabits = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
      const habits: Habit[] = existingHabits ? JSON.parse(existingHabits) : [];

      // Add new habit
      habits.push(newHabit);

      // Save back to storage
      await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));

      // Clear form
      setTitle('');
      setDescription('');
      setFrequency('daily');
      setCustomDays([]);
      setTargetDuration('');
      setReminderTime('');

      Alert.alert('Success', 'Habit created successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving habit:', error);
      Alert.alert('Error', 'Failed to create habit');
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
        <Text style={styles.headerTitle}>Create New Habit</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Habit Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Drink 8 glasses of water"
              placeholderTextColor={theme.colors.text.secondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Optional description or motivation"
              placeholderTextColor={theme.colors.text.secondary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequency</Text>

          <View style={styles.frequencyOptions}>
            {[
              { id: 'daily', label: 'Daily', desc: 'Every day' },
              { id: 'weekly', label: 'Weekly', desc: 'Once per week' },
              { id: 'custom', label: 'Custom', desc: 'Select specific days' },
            ].map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.frequencyOption,
                  frequency === option.id && styles.frequencyOptionSelected,
                ]}
                onPress={() => setFrequency(option.id as any)}
              >
                <Text style={[
                  styles.frequencyOptionTitle,
                  frequency === option.id && styles.frequencyOptionTitleSelected,
                ]}>
                  {option.label}
                </Text>
                <Text style={[
                  styles.frequencyOptionDesc,
                  frequency === option.id && styles.frequencyOptionDescSelected,
                ]}>
                  {option.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {frequency === 'custom' && (
            <View style={styles.customDaysContainer}>
              <Text style={styles.label}>Select Days</Text>
              <View style={styles.daysGrid}>
                {DAYS_OF_WEEK.map((day) => (
                  <TouchableOpacity
                    key={day.id}
                    style={[
                      styles.dayButton,
                      customDays.includes(day.id) && styles.dayButtonSelected,
                    ]}
                    onPress={() => toggleCustomDay(day.id)}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      customDays.includes(day.id) && styles.dayButtonTextSelected,
                    ]}>
                      {day.short}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Optional Settings</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Duration (minutes)</Text>
            <TextInput
              style={styles.textInput}
              value={targetDuration}
              onChangeText={setTargetDuration}
              placeholder="e.g., 30"
              placeholderTextColor={theme.colors.text.secondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reminder Time</Text>
            <TextInput
              style={styles.textInput}
              value={reminderTime}
              onChangeText={setReminderTime}
              placeholder="e.g., 09:00"
              placeholderTextColor={theme.colors.text.secondary}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={saveHabit}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Creating...' : 'Create Habit'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.surface,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  frequencyOptions: {
    gap: 12,
  },
  frequencyOption: {
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  frequencyOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  frequencyOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  frequencyOptionTitleSelected: {
    color: theme.colors.text.primary,
  },
  frequencyOptionDesc: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  frequencyOptionDescSelected: {
    color: theme.colors.text.primary,
  },
  customDaysContainer: {
    marginTop: 16,
  },
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  dayButtonTextSelected: {
    color: theme.colors.text.primary,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.surface,
  },
});