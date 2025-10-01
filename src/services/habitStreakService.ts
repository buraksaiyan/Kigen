import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  customDays?: number[];
  targetDuration?: number;
  targetDays?: number;
  reminderTime?: string;
  isActive: boolean;
  createdAt: string;
  streak: number;
  lastCompleted?: string;
  failedAt?: string;
  failureReason?: 'missed_day' | 'gave_up';
}

interface HabitStreakCheckResult {
  habitsResetCount: number;
  resetHabits: Array<{ id: string; title: string; previousStreak: number }>;
}

export class HabitStreakService {
  private static STORAGE_KEY = '@inzone_habits';
  private static LAST_CHECK_KEY = '@inzone_habit_last_streak_check';

  /**
   * Check all active habits for missed days and reset streaks if needed.
   * Should be called daily, preferably on app startup.
   */
  static async checkAndResetMissedStreaks(): Promise<HabitStreakCheckResult> {
    try {
      const today = new Date();
      const todayStr = today.toDateString();
      
      // Check if we already performed the streak check today
      const lastCheckStr = await AsyncStorage.getItem(this.LAST_CHECK_KEY);
      if (lastCheckStr === todayStr) {
        console.log('Habit streak check already performed today');
        return { habitsResetCount: 0, resetHabits: [] };
      }

      const habitsData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!habitsData) {
        await AsyncStorage.setItem(this.LAST_CHECK_KEY, todayStr);
        return { habitsResetCount: 0, resetHabits: [] };
      }

      const habits: Habit[] = JSON.parse(habitsData);
      const activeHabits = habits.filter(h => h.isActive);
      const resetHabits: Array<{ id: string; title: string; previousStreak: number }> = [];
      
      // Check each active habit for missed days
      const updatedHabits = habits.map(habit => {
        if (!habit.isActive || habit.streak === 0) {
          return habit; // Skip inactive habits or habits with no streak
        }

        // Calculate days since last completion
        const lastCompletedDate = habit.lastCompleted ? new Date(habit.lastCompleted) : null;
        if (!lastCompletedDate) {
          return habit; // No previous completion, keep as is
        }

        const daysDifference = Math.floor((today.getTime() - lastCompletedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // For daily habits: if more than 1 day has passed, reset streak
        // For weekly habits: if more than 7 days have passed, reset streak
        // For custom habits: check based on frequency pattern (simplified to daily for now)
        let shouldReset = false;
        
        if (habit.frequency === 'daily') {
          shouldReset = daysDifference > 1;
        } else if (habit.frequency === 'weekly') {
          shouldReset = daysDifference > 7;
        } else if (habit.frequency === 'custom') {
          // For custom habits, treat as daily for now (can be enhanced later)
          shouldReset = daysDifference > 1;
        }

        if (shouldReset && habit.streak > 0) {
          resetHabits.push({
            id: habit.id,
            title: habit.title,
            previousStreak: habit.streak
          });

          return {
            ...habit,
            streak: 0,
            failedAt: new Date().toISOString(),
            failureReason: 'missed_day' as const,
            lastCompleted: undefined
          };
        }

        return habit;
      });

      // Save updated habits if any streaks were reset
      if (resetHabits.length > 0) {
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedHabits));
        console.log(`Reset ${resetHabits.length} habit streaks due to missed days`);

        // Send notifications for each reset habit
        await this.sendStreakResetNotifications(resetHabits);
      }

      // Mark that we performed the check today
      await AsyncStorage.setItem(this.LAST_CHECK_KEY, todayStr);

      return {
        habitsResetCount: resetHabits.length,
        resetHabits
      };
    } catch (error) {
      console.error('Error checking habit streaks:', error);
      return { habitsResetCount: 0, resetHabits: [] };
    }
  }

  /**
   * Send notifications to the app inbox for reset habit streaks
   */
  private static async sendStreakResetNotifications(resetHabits: Array<{ id: string; title: string; previousStreak: number }>) {
    try {
      for (const habit of resetHabits) {
        const message = habit.previousStreak === 1 
          ? `Your "${habit.title}" habit streak was reset because you missed a day. Don't give up! Start again today.`
          : `Your "${habit.title}" habit streak of ${habit.previousStreak} days was reset because you missed a day. Don't give up! Start again today.`;

        // Send push notification for streak reset
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Habit Streak Reset',
            body: message,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: null, // Send immediately
        });

        console.log(`Sent notification for habit streak reset: ${habit.title}`);
      }
    } catch (error) {
      console.error('Error sending streak reset notifications:', error);
    }
  }

  /**
   * Schedule midday reminder notifications for incomplete habits
   */
  static async scheduleMiddayReminders(): Promise<void> {
    try {
      const habitsData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!habitsData) return;

      const habits: Habit[] = JSON.parse(habitsData);
      const activeHabits = habits.filter(h => h.isActive);
      const today = new Date().toDateString();

      // Find habits that haven't been completed today
      const incompleteHabits = activeHabits.filter(habit => 
        habit.lastCompleted !== today
      );

      if (incompleteHabits.length === 0) {
        console.log('All habits completed for today - no midday reminders needed');
        return;
      }

      // Cancel any existing scheduled notifications for habits
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const habitNotifications = scheduledNotifications.filter(n => 
        n.content.title === 'Habit Reminder'
      );
      for (const notification of habitNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }

      // Schedule a notification for 12:00 PM (midday) if it hasn't passed yet
      const now = new Date();
      const midday = new Date();
      midday.setHours(12, 0, 0, 0);

      // Only schedule if midday hasn't passed yet today
      if (midday.getTime() > now.getTime()) {
        const habitTitles = incompleteHabits.map(h => h.title).join(', ');
        const message = incompleteHabits.length === 1 && incompleteHabits[0]
          ? `Don't forget to complete your "${incompleteHabits[0].title}" habit today!`
          : `Don't forget to complete your habits today: ${habitTitles}`;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Habit Reminder',
            body: message,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: {
            hour: 12,
            minute: 0,
          } as Notifications.CalendarTriggerInput,
        });

        console.log(`Scheduled midday reminder for ${incompleteHabits.length} incomplete habits`);
      } else {
        console.log('Midday has already passed - no reminder scheduled');
      }
    } catch (error) {
      console.error('Error scheduling midday reminders:', error);
    }
  }

  /**
   * Initialize the habit streak service - should be called on app startup
   */
  static async initialize(): Promise<void> {
    try {
      console.log('Initializing Habit Streak Service...');

      // Request notification permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted - habit reminders will not work');
      }

      // Check for missed streaks
      const result = await this.checkAndResetMissedStreaks();
      if (result.habitsResetCount > 0) {
        console.log(`Initialized: Reset ${result.habitsResetCount} habit streaks`);
      }

      // Schedule midday reminders for today
      await this.scheduleMiddayReminders();

      console.log('Habit Streak Service initialized successfully');
    } catch (error) {
      console.error('Error initializing Habit Streak Service:', error);
    }
  }

  /**
   * Get habits that need attention (incomplete today and approaching deadline)
   */
  static async getHabitsNeedingAttention(): Promise<Habit[]> {
    try {
      const habitsData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!habitsData) return [];

      const habits: Habit[] = JSON.parse(habitsData);
      const activeHabits = habits.filter(h => h.isActive);
      const today = new Date().toDateString();

      // Return habits that haven't been completed today
      return activeHabits.filter(habit => habit.lastCompleted !== today);
    } catch (error) {
      console.error('Error getting habits needing attention:', error);
      return [];
    }
  }

  /**
   * Manually reset a habit streak (for testing or manual intervention)
   */
  static async manuallyResetHabitStreak(habitId: string): Promise<boolean> {
    try {
      const habitsData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!habitsData) return false;

      const habits: Habit[] = JSON.parse(habitsData);
      const habitIndex = habits.findIndex(h => h.id === habitId);
      
      if (habitIndex === -1 || !habits[habitIndex]) return false;

      const habit = habits[habitIndex];
      if (!habit) return false;

      const previousStreak = habit.streak;

      habits[habitIndex] = {
        ...habit,
        streak: 0,
        failedAt: new Date().toISOString(),
        failureReason: 'missed_day' as const,
        lastCompleted: undefined
      };

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(habits));

      // Send notification
      await this.sendStreakResetNotifications([{
        id: habit.id,
        title: habit.title,
        previousStreak: previousStreak
      }]);

      console.log(`Manually reset habit streak for: ${habit.title}`);
      return true;
    } catch (error) {
      console.error('Error manually resetting habit streak:', error);
      return false;
    }
  }
}