import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { theme } from '../config/theme';

const REMINDERS_STORAGE_KEY = '@kigen_reminders';

interface Reminder {
  id: string;
  title: string;
  message: string;
  scheduledTime: string;
  recurring: 'none' | 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  notificationId?: string;
  createdAt: string;
}

interface RemindersCreationPageProps {
  visible?: boolean;
  onClose?: () => void;
  onSave?: () => void;
}

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const RemindersCreationPage: React.FC<RemindersCreationPageProps> = ({
  visible = true,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [showTimeSelector, setShowTimeSelector] = useState(false);
  const [recurring, setRecurring] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (visible) {
      requestNotificationPermission();
    }
  }, [visible]);

  const requestNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please enable notifications to create reminders.',
        [{ text: 'OK' }]
      );
      setHasPermission(false);
    } else {
      setHasPermission(true);
    }
  };

  const scheduleNotification = async (reminder: Omit<Reminder, 'notificationId'>): Promise<string | null> => {
    try {
      // Combine date and time
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(selectedTime.getHours());
      scheduledDateTime.setMinutes(selectedTime.getMinutes());
      scheduledDateTime.setSeconds(0);
      scheduledDateTime.setMilliseconds(0);

      // Check if the time is in the future
      if (scheduledDateTime <= new Date()) {
        Alert.alert('Error', 'Please select a future date and time');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.message,
          sound: true,
        },
        trigger: null, // For immediate notification testing - in production, use proper date trigger
      });

      // Schedule recurring notifications if needed
      if (recurring !== 'none') {
        const recurringTrigger: any = {
          repeats: true,
          hour: selectedTime.getHours(),
          minute: selectedTime.getMinutes(),
        };

        switch (recurring) {
          case 'daily':
            // Daily at the same time
            break;
          case 'weekly':
            recurringTrigger.weekday = scheduledDateTime.getDay() + 1; // 1-7 for Sunday-Saturday
            break;
          case 'monthly':
            recurringTrigger.day = scheduledDateTime.getDate();
            break;
        }

        await Notifications.scheduleNotificationAsync({
          content: {
            title: reminder.title,
            body: reminder.message,
            sound: true,
          },
          trigger: recurringTrigger,
        });
      }

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  };

  const saveReminder = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a reminder title');
      return;
    }

    if (!hasPermission) {
      Alert.alert('Error', 'Notification permission is required to create reminders');
      return;
    }

    setLoading(true);
    try {
      const newReminder: Omit<Reminder, 'notificationId'> = {
        id: Date.now().toString(),
        title: title.trim(),
        message: message.trim() || title.trim(),
        scheduledTime: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), selectedTime.getHours(), selectedTime.getMinutes()).toISOString(),
        recurring,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      // Schedule the notification
      const notificationId = await scheduleNotification(newReminder);
      if (!notificationId) {
        throw new Error('Failed to schedule notification');
      }

      const completeReminder: Reminder = {
        ...newReminder,
        notificationId,
      };

      // Load existing reminders
      const existingReminders = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
      const reminders: Reminder[] = existingReminders ? JSON.parse(existingReminders) : [];
      
      // Add new reminder
      reminders.push(completeReminder);
      
      // Save back to storage
      await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));

      // Clear form
      setTitle('');
      setMessage('');
      setSelectedDate(new Date());
      setSelectedTime(new Date());
      setRecurring('none');
      
      onSave?.();
      Alert.alert('Success', 'Reminder created successfully!');
    } catch (error) {
      console.error('Error saving reminder:', error);
      Alert.alert('Error', 'Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDateSelector(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    setShowTimeSelector(false);
    if (time) {
      setSelectedTime(time);
    }
  };

  const formatDateTime = (date: Date, time: Date) => {
    const dateStr = date.toLocaleDateString();
    const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} at ${timeStr}`;
  };

  if (!visible) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Reminder</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.inputSection}>
          <Text style={styles.label}>Reminder Title *</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter reminder title..."
            placeholderTextColor={theme.colors.text.secondary}
            maxLength={100}
          />
          
          <Text style={styles.label}>Message (optional)</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={message}
            onChangeText={setMessage}
            placeholder="Enter reminder message..."
            placeholderTextColor={theme.colors.text.secondary}
            multiline
            maxLength={200}
          />

          <Text style={styles.label}>Date & Time</Text>
          <TouchableOpacity onPress={() => setShowDateSelector(!showDateSelector)} style={styles.dateTimeButton}>
            <Text style={styles.dateTimeButtonText}>
              📅 {formatDateTime(selectedDate, selectedTime)}
            </Text>
          </TouchableOpacity>

          {showDateSelector && (
            <View style={styles.dateTimeInputs}>
              <Text style={styles.infoText}>Simple date/time selection (production would use native picker)</Text>
            </View>
          )}

          <TouchableOpacity onPress={() => setShowTimeSelector(!showTimeSelector)} style={styles.dateTimeButton}>
            <Text style={styles.dateTimeButtonText}>
              🕐 Change Time
            </Text>
          </TouchableOpacity>

          {showTimeSelector && (
            <View style={styles.dateTimeInputs}>
              <Text style={styles.infoText}>Time selection interface would go here</Text>
            </View>
          )}

          <Text style={styles.label}>Repeat</Text>
          <View style={styles.recurringOptions}>
            {[
              { value: 'none', label: 'No Repeat' },
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setRecurring(option.value as any)}
                style={[
                  styles.recurringOption,
                  recurring === option.value && styles.recurringOptionSelected,
                ]}
              >
                <Text style={[
                  styles.recurringOptionText,
                  recurring === option.value && styles.recurringOptionTextSelected,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={saveReminder}
            disabled={loading || !hasPermission}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Creating...' : 'Create Reminder'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>📋 Reminder Info</Text>
          <Text style={styles.infoText}>
            • Reminders require notification permission
          </Text>
          <Text style={styles.infoText}>
            • Recurring reminders will continue until disabled
          </Text>
          <Text style={styles.infoText}>
            • You can manage existing reminders from Settings
          </Text>
          {!hasPermission && (
            <Text style={styles.warningText}>
              ⚠️ Notification permission denied. Please enable in Settings.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  dateTimeButton: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  dateTimeButtonText: {
    color: theme.colors.text.primary,
    fontSize: 16,
    textAlign: 'center',
  },
  dateTimeInputs: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
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
  infoSection: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    padding: theme.spacing.lg,
  },
  infoText: {
    ...theme.typography.small,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  infoTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  inputSection: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  recurringOption: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    marginBottom: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  recurringOptionSelected: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  recurringOptionText: {
    color: theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  recurringOptionTextSelected: {
    color: theme.colors.background,
  },
  recurringOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.lg,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.text.disabled,
  },
  saveButtonText: {
    color: theme.colors.background,
    fontSize: 18,
    fontWeight: '600',
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
  warningText: {
    ...theme.typography.small,
    color: theme.colors.danger,
    fontWeight: '500',
    marginTop: theme.spacing.sm,
  },
});