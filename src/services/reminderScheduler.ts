/**
 * Reminder Scheduler Service
 * 
 * Provides robust scheduling for reminders and habit reminders using Expo Notifications.
 * Features:
 * - Schedules at exact future times (never fires immediately)
 * - Respects user's local timezone
 * - Supports background scheduling
 * - Works even if app is closed or device is restarted
 * - Reminders are cancelable and editable
 * - Same logic for both reminders and habit reminders
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowList: true,
  }),
});

// Storage keys
const REMINDERS_STORAGE_KEY = '@inzone_reminders';
const HABIT_REMINDERS_STORAGE_KEY = '@inzone_habit_reminders';

// Types
export interface ScheduledReminder {
  id: string;
  title: string;
  body: string;
  scheduledTime: string; // ISO 8601 format
  notificationId: string; // Expo notification identifier
  type: 'reminder' | 'habit';
  recurring?: RecurringConfig;
  isActive: boolean;
  createdAt: string;
  metadata?: Record<string, any>; // Additional data (habitId, goalId, etc.)
}

export interface RecurringConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  weekday?: number; // 1-7 for Sunday-Saturday (only for weekly)
  day?: number; // Day of month (only for monthly)
}

export interface ScheduleReminderParams {
  title: string;
  body: string;
  scheduledTime: Date;
  type?: 'reminder' | 'habit';
  recurring?: RecurringConfig;
  metadata?: Record<string, any>;
}

/**
 * ReminderScheduler - Main service class
 */
export class ReminderScheduler {
  /**
   * Request notification permissions (required before scheduling)
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Additional Android-specific setup
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });

        // Create separate channel for reminders
        await Notifications.setNotificationChannelAsync('reminders', {
          name: 'Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
          description: 'Notifications for scheduled reminders',
        });

        // Create separate channel for habit reminders
        await Notifications.setNotificationChannelAsync('habits', {
          name: 'Habit Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
          description: 'Notifications for habit tracking',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Schedule a reminder at a specific time
   * @param params - Reminder parameters
   * @returns The reminder ID or null if failed
   */
  static async scheduleReminder(params: ScheduleReminderParams): Promise<string | null> {
    try {
      const { title, body, scheduledTime, type = 'reminder', recurring, metadata } = params;

      // Validate that scheduled time is in the future
      const now = new Date();
      if (scheduledTime <= now) {
        console.error('Scheduled time must be in the future');
        console.error(`Current time: ${now.toISOString()}`);
        console.error(`Scheduled time: ${scheduledTime.toISOString()}`);
        return null;
      }

      // Ensure permissions are granted
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.error('Cannot schedule reminder: permissions not granted');
        return null;
      }

      // Calculate seconds until the scheduled time
      const secondsUntilTrigger = Math.floor((scheduledTime.getTime() - now.getTime()) / 1000);
      
      console.log('=== Scheduling Reminder ===');
      console.log('Title:', title);
      console.log('Body:', body);
      console.log('Type:', type);
      console.log('Scheduled Time (Local):', scheduledTime.toLocaleString());
      console.log('Scheduled Time (ISO):', scheduledTime.toISOString());
      console.log('Current Time (Local):', now.toLocaleString());
      console.log('Current Time (ISO):', now.toISOString());
      console.log('Seconds until trigger:', secondsUntilTrigger);
      console.log('Minutes until trigger:', Math.floor(secondsUntilTrigger / 60));

      // Schedule the notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            type,
            scheduledTime: scheduledTime.toISOString(),
            metadata,
          },
        },
        trigger: {
          channelId: type === 'habit' ? 'habits' : 'reminders',
          seconds: secondsUntilTrigger,
        },
      });

      console.log('✅ Notification scheduled with ID:', notificationId);

      // Create the reminder object
      const reminder: ScheduledReminder = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title,
        body,
        scheduledTime: scheduledTime.toISOString(),
        notificationId,
        type,
        recurring,
        isActive: true,
        createdAt: new Date().toISOString(),
        metadata,
      };

      // Schedule recurring notification if needed
      if (recurring) {
        await this.scheduleRecurringReminder(reminder);
      }

      // Save to storage
      await this.saveReminder(reminder);

      return reminder.id;
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      return null;
    }
  }

  /**
   * Schedule recurring reminder
   */
  private static async scheduleRecurringReminder(reminder: ScheduledReminder): Promise<void> {
    try {
      if (!reminder.recurring) return;

      const { frequency, weekday, day } = reminder.recurring;
      const scheduledDate = new Date(reminder.scheduledTime);

      let trigger: Notifications.CalendarTriggerInput;

      switch (frequency) {
        case 'daily':
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: scheduledDate.getHours(),
            minute: scheduledDate.getMinutes(),
            repeats: true,
          };
          break;

        case 'weekly':
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: scheduledDate.getHours(),
            minute: scheduledDate.getMinutes(),
            weekday: weekday || scheduledDate.getDay() + 1, // 1-7 for Sun-Sat
            repeats: true,
          };
          break;

        case 'monthly':
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: scheduledDate.getHours(),
            minute: scheduledDate.getMinutes(),
            day: day || scheduledDate.getDate(),
            repeats: true,
          };
          break;

        default:
          return;
      }

      // Schedule recurring notification (separate from the first trigger)
      const recurringId = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            type: reminder.type,
            isRecurring: true,
            metadata: reminder.metadata,
          },
        },
        trigger,
      });

      console.log(`✅ Recurring notification scheduled (${frequency}) with ID:`, recurringId);
    } catch (error) {
      console.error('Error scheduling recurring reminder:', error);
    }
  }

  /**
   * Cancel a scheduled reminder
   * @param reminderId - The reminder ID to cancel
   */
  static async cancelReminder(reminderId: string): Promise<boolean> {
    try {
      const reminder = await this.getReminder(reminderId);
      if (!reminder) {
        console.warn('Reminder not found:', reminderId);
        return false;
      }

      // Cancel the notification
      await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
      console.log('✅ Notification canceled:', reminder.notificationId);

      // Remove from storage
      await this.deleteReminder(reminderId);

      return true;
    } catch (error) {
      console.error('Error canceling reminder:', error);
      return false;
    }
  }

  /**
   * Update a scheduled reminder
   * @param reminderId - The reminder ID to update
   * @param updates - New reminder parameters
   */
  static async updateReminder(
    reminderId: string,
    updates: Partial<ScheduleReminderParams>
  ): Promise<boolean> {
    try {
      const existingReminder = await this.getReminder(reminderId);
      if (!existingReminder) {
        console.warn('Reminder not found:', reminderId);
        return false;
      }

      // Cancel the old notification
      await Notifications.cancelScheduledNotificationAsync(existingReminder.notificationId);

      // Schedule new notification with updated params
      const newReminderId = await this.scheduleReminder({
        title: updates.title || existingReminder.title,
        body: updates.body || existingReminder.body,
        scheduledTime: updates.scheduledTime || new Date(existingReminder.scheduledTime),
        type: updates.type || existingReminder.type,
        recurring: updates.recurring || existingReminder.recurring,
        metadata: updates.metadata || existingReminder.metadata,
      });

      if (!newReminderId) {
        console.error('Failed to reschedule reminder');
        return false;
      }

      // Delete old reminder from storage
      await this.deleteReminder(reminderId);

      console.log('✅ Reminder updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating reminder:', error);
      return false;
    }
  }

  /**
   * Get all scheduled reminders
   * @param type - Optional filter by type
   */
  static async getAllReminders(type?: 'reminder' | 'habit'): Promise<ScheduledReminder[]> {
    try {
      const [reminders, habitReminders] = await Promise.all([
        this.loadRemindersFromStorage(REMINDERS_STORAGE_KEY),
        this.loadRemindersFromStorage(HABIT_REMINDERS_STORAGE_KEY),
      ]);

      const allReminders = [...reminders, ...habitReminders];

      if (type) {
        return allReminders.filter(r => r.type === type);
      }

      return allReminders;
    } catch (error) {
      console.error('Error getting all reminders:', error);
      return [];
    }
  }

  /**
   * Get a specific reminder by ID
   */
  static async getReminder(reminderId: string): Promise<ScheduledReminder | null> {
    try {
      const allReminders = await this.getAllReminders();
      return allReminders.find(r => r.id === reminderId) || null;
    } catch (error) {
      console.error('Error getting reminder:', error);
      return null;
    }
  }

  /**
   * Get active reminders (not yet triggered)
   */
  static async getActiveReminders(): Promise<ScheduledReminder[]> {
    try {
      const allReminders = await this.getAllReminders();
      const now = new Date();

      return allReminders.filter(r => {
        const scheduledTime = new Date(r.scheduledTime);
        return r.isActive && scheduledTime > now;
      });
    } catch (error) {
      console.error('Error getting active reminders:', error);
      return [];
    }
  }

  /**
   * Clean up expired reminders (past scheduled time and not recurring)
   */
  static async cleanupExpiredReminders(): Promise<void> {
    try {
      const allReminders = await this.getAllReminders();
      const now = new Date();

      for (const reminder of allReminders) {
        const scheduledTime = new Date(reminder.scheduledTime);
        
        // If reminder is past and not recurring, delete it
        if (scheduledTime <= now && !reminder.recurring) {
          await this.deleteReminder(reminder.id);
          console.log('Cleaned up expired reminder:', reminder.id);
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired reminders:', error);
    }
  }

  /**
   * Cancel all scheduled reminders
   */
  static async cancelAllReminders(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(REMINDERS_STORAGE_KEY);
      await AsyncStorage.removeItem(HABIT_REMINDERS_STORAGE_KEY);
      console.log('✅ All reminders canceled');
    } catch (error) {
      console.error('Error canceling all reminders:', error);
    }
  }

  /**
   * Get all scheduled notifications (for debugging)
   */
  static async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  // Private helper methods

  private static async saveReminder(reminder: ScheduledReminder): Promise<void> {
    try {
      const storageKey = reminder.type === 'habit' 
        ? HABIT_REMINDERS_STORAGE_KEY 
        : REMINDERS_STORAGE_KEY;

      const existingReminders = await this.loadRemindersFromStorage(storageKey);
      existingReminders.push(reminder);

      await AsyncStorage.setItem(storageKey, JSON.stringify(existingReminders));
      console.log('✅ Reminder saved to storage');
    } catch (error) {
      console.error('Error saving reminder:', error);
    }
  }

  private static async deleteReminder(reminderId: string): Promise<void> {
    try {
      // Try both storage keys
      for (const storageKey of [REMINDERS_STORAGE_KEY, HABIT_REMINDERS_STORAGE_KEY]) {
        const reminders = await this.loadRemindersFromStorage(storageKey);
        const filteredReminders = reminders.filter(r => r.id !== reminderId);

        if (filteredReminders.length !== reminders.length) {
          await AsyncStorage.setItem(storageKey, JSON.stringify(filteredReminders));
          console.log('✅ Reminder deleted from storage');
          return;
        }
      }
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  }

  private static async loadRemindersFromStorage(storageKey: string): Promise<ScheduledReminder[]> {
    try {
      const data = await AsyncStorage.getItem(storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading reminders from storage:', error);
      return [];
    }
  }
}

/**
 * Helper function for easy reminder scheduling
 * 
 * @example
 * ```typescript
 * // Schedule a reminder for tomorrow at 9:00 AM
 * const tomorrow9am = new Date();
 * tomorrow9am.setDate(tomorrow9am.getDate() + 1);
 * tomorrow9am.setHours(9, 0, 0, 0);
 * 
 * const reminderId = await scheduleReminder({
 *   title: 'Morning Exercise',
 *   body: 'Time for your morning workout!',
 *   scheduledTime: tomorrow9am
 * });
 * ```
 */
export const scheduleReminder = ReminderScheduler.scheduleReminder.bind(ReminderScheduler);

/**
 * Helper function for canceling reminders
 * 
 * @example
 * ```typescript
 * await cancelReminder(reminderId);
 * ```
 */
export const cancelReminder = ReminderScheduler.cancelReminder.bind(ReminderScheduler);

/**
 * Helper function for updating reminders
 * 
 * @example
 * ```typescript
 * await updateReminder(reminderId, {
 *   scheduledTime: newDate,
 *   body: 'Updated reminder message'
 * });
 * ```
 */
export const updateReminder = ReminderScheduler.updateReminder.bind(ReminderScheduler);
