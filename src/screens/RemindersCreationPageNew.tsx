/**
 * Updated RemindersCreationPage using the new ReminderScheduler service
 * 
 * This updated version uses the robust ReminderScheduler that:
 * - Never fires immediately (always schedules for future)
 * - Respects user's local timezone
 * - Works in background
 * - Supports editing and canceling
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  BackHandler,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../config/theme';
import { ReminderScheduler, RecurringConfig } from '../services/reminderScheduler';

interface RemindersCreationPageNewProps {
  onClose?: () => void;
  onSave?: () => void;
}

export const RemindersCreationPageNew: React.FC<RemindersCreationPageNewProps> = ({
  onClose,
  onSave,
}) => {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [recurring, setRecurring] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  // Handle Android hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Main' as never);
        }
        return true;
      };

      if (Platform.OS === 'android') {
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
      }

      return undefined;
    }, [navigation])
  );

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const requestNotificationPermission = async () => {
    const granted = await ReminderScheduler.requestPermissions();
    setHasPermission(granted);

    if (!granted) {
      Alert.alert(
        'Permissions Required',
        'Notification permissions are required to create reminders. Please enable them in your device settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const validateScheduledTime = (time: Date): boolean => {
    const now = new Date();
    
    if (time <= now) {
      Alert.alert(
        'Invalid Time',
        'Please select a future date and time. Reminders cannot be scheduled for the past or current moment.',
        [{ text: 'OK' }]
      );
      return false;
    }

    // Check if it's at least 1 minute in the future
    const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);
    if (time < oneMinuteFromNow) {
      Alert.alert(
        'Invalid Time',
        'Please schedule the reminder at least 1 minute in the future.',
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
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

    if (!validateScheduledTime(selectedDate)) {
      return;
    }

    setLoading(true);
    try {
      // Prepare recurring configuration
      let recurringConfig: RecurringConfig | undefined;
      if (recurring !== 'none') {
        recurringConfig = {
          frequency: recurring,
        };

        if (recurring === 'weekly') {
          recurringConfig.weekday = selectedDate.getDay() + 1; // 1-7 for Sun-Sat
        } else if (recurring === 'monthly') {
          recurringConfig.day = selectedDate.getDate();
        }
      }

      // Schedule the reminder using the new service
      const reminderId = await ReminderScheduler.scheduleReminder({
        title: title.trim(),
        body: message.trim() || title.trim(),
        scheduledTime: selectedDate,
        type: 'reminder',
        recurring: recurringConfig,
        metadata: {
          source: 'user_created',
        },
      });

      if (!reminderId) {
        throw new Error('Failed to schedule reminder');
      }

      console.log('✅ Reminder created successfully with ID:', reminderId);
      console.log('📅 Scheduled for:', selectedDate.toLocaleString());

      // Show success message
      Alert.alert(
        'Success',
        `Reminder scheduled for ${selectedDate.toLocaleString()}`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (onSave) {
                onSave();
              }
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error saving reminder:', error);
      Alert.alert('Error', 'Failed to create reminder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    
    if (date) {
      const newDate = new Date(selectedDate);
      newDate.setFullYear(date.getFullYear());
      newDate.setMonth(date.getMonth());
      newDate.setDate(date.getDate());
      setSelectedDate(newDate);
    }
  };

  const onTimeChange = (event: any, date?: Date) => {
    setShowTimePicker(false);
    
    if (date) {
      const newDate = new Date(selectedDate);
      newDate.setHours(date.getHours());
      newDate.setMinutes(date.getMinutes());
      setSelectedDate(newDate);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Reminder</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.inputSection}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter reminder title"
            placeholderTextColor={theme.colors.text.secondary}
            maxLength={100}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Message (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={message}
            onChangeText={setMessage}
            placeholder="Enter reminder message"
            placeholderTextColor={theme.colors.text.secondary}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Date & Time *</Text>
          
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateTimeText}>
              📅 {selectedDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.dateTimeText}>
              🕐 {selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="time"
              display="default"
              onChange={onTimeChange}
            />
          )}

          <View style={styles.scheduledTimeInfo}>
            <Text style={styles.scheduledTimeLabel}>Will trigger at:</Text>
            <Text style={styles.scheduledTimeValue}>
              {selectedDate.toLocaleString()}
            </Text>
            <Text style={styles.scheduledTimeNote}>
              {selectedDate > new Date() 
                ? `⏰ In ${Math.round((selectedDate.getTime() - new Date().getTime()) / 60000)} minutes`
                : '⚠️ Please select a future time'}
            </Text>
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Repeat</Text>
          
          <View style={styles.recurringOptions}>
            {[
              { value: 'none', label: 'Once', icon: '📅' },
              { value: 'daily', label: 'Daily', icon: '🔄' },
              { value: 'weekly', label: 'Weekly', icon: '📆' },
              { value: 'monthly', label: 'Monthly', icon: '🗓️' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.recurringOption,
                  recurring === option.value && styles.recurringOptionSelected,
                ]}
                onPress={() => setRecurring(option.value as any)}
              >
                <Text style={styles.recurringIcon}>{option.icon}</Text>
                <Text
                  style={[
                    styles.recurringLabel,
                    recurring === option.value && styles.recurringLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>ℹ️ How Reminders Work</Text>
          <Text style={styles.infoText}>
            • Reminders will trigger at the exact scheduled time
          </Text>
          <Text style={styles.infoText}>
            • Works even if the app is closed or device is restarted
          </Text>
          <Text style={styles.infoText}>
            • You can edit or cancel reminders before they trigger
          </Text>
          <Text style={styles.infoText}>
            • Recurring reminders will repeat automatically
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
          onPress={saveReminder}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Scheduling...' : 'Create Reminder'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: theme.colors.text.primary,
    fontSize: 24,
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  dateTimeButton: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  dateTimeText: {
    color: theme.colors.text.primary,
    fontSize: 16,
  },
  footer: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  infoSection: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
    padding: 16,
  },
  infoText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  infoTitle: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: theme.colors.text.primary,
    fontSize: 16,
    padding: 16,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  recurringIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  recurringLabel: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  recurringLabelSelected: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  recurringOption: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 16,
  },
  recurringOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  recurringOptions: {
    flexDirection: 'row',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scheduledTimeInfo: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  scheduledTimeLabel: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  scheduledTimeNote: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  scheduledTimeValue: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});
