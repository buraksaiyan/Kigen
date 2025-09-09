import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_TIMER_TASK = 'background-timer-task';

interface TimerState {
  id: string;
  startTime: number;
  duration: number; // in seconds
  isPaused: boolean;
  isRunning: boolean;
  mode: {
    title: string;
    color: string;
  };
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class BackgroundTimerService {
  private static STORAGE_KEY = '@kigen_background_timer';

  // Register background task
  static async registerBackgroundTask() {
    try {
      await TaskManager.defineTask(BACKGROUND_TIMER_TASK, async ({ data, error, executionInfo }) => {
        if (error) {
          console.error('Background task error:', error);
          return;
        }
        
        await this.checkTimerProgress();
      });

      await BackgroundFetch.registerTaskAsync(BACKGROUND_TIMER_TASK, {
        minimumInterval: 15000, // 15 seconds
        stopOnTerminate: false,
        startOnBoot: true,
      });

      console.log('Background task registered successfully');
    } catch (error) {
      console.error('Failed to register background task:', error);
    }
  }

  // Start timer in background
  static async startTimer(timer: TimerState) {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(timer));
      await this.registerBackgroundTask();
      
      // Schedule completion notification
      await this.scheduleCompletionNotification(timer);
      
      console.log('Background timer started:', timer.id);
    } catch (error) {
      console.error('Failed to start background timer:', error);
    }
  }

  // Update timer state
  static async updateTimer(updates: Partial<TimerState>) {
    try {
      const currentTimerData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (currentTimerData) {
        const currentTimer = JSON.parse(currentTimerData);
        const updatedTimer = { ...currentTimer, ...updates };
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedTimer));
        
        // Reschedule notification if needed
        if (updates.isPaused !== undefined || updates.isRunning !== undefined) {
          await this.cancelNotifications();
          if (updatedTimer.isRunning && !updatedTimer.isPaused) {
            await this.scheduleCompletionNotification(updatedTimer);
          }
        }
      }
    } catch (error) {
      console.error('Failed to update background timer:', error);
    }
  }

  // Get current timer state
  static async getTimer(): Promise<TimerState | null> {
    try {
      const timerData = await AsyncStorage.getItem(this.STORAGE_KEY);
      return timerData ? JSON.parse(timerData) : null;
    } catch (error) {
      console.error('Failed to get background timer:', error);
      return null;
    }
  }

  // Calculate remaining time
  static async getRemainingTime(): Promise<number> {
    try {
      const timer = await this.getTimer();
      if (!timer || !timer.isRunning || timer.isPaused) {
        return 0;
      }

      const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
      const remaining = Math.max(0, timer.duration - elapsed);
      
      return remaining;
    } catch (error) {
      console.error('Failed to calculate remaining time:', error);
      return 0;
    }
  }

  // Stop timer
  static async stopTimer() {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      await this.cancelNotifications();
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TIMER_TASK);
      console.log('Background timer stopped');
    } catch (error) {
      console.error('Failed to stop background timer:', error);
    }
  }

  // Check timer progress (called by background task)
  private static async checkTimerProgress() {
    try {
      const timer = await this.getTimer();
      if (!timer || !timer.isRunning || timer.isPaused) {
        return;
      }

      const remaining = await this.getRemainingTime();
      
      if (remaining <= 0) {
        // Timer completed
        await this.showCompletionNotification(timer);
        await this.stopTimer();
      }
    } catch (error) {
      console.error('Failed to check timer progress:', error);
    }
  }

  // Schedule completion notification
  private static async scheduleCompletionNotification(timer: TimerState) {
    try {
      const remaining = await this.getRemainingTime();
      
      if (remaining > 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🎯 Focus Session Complete!',
            body: `Your ${timer.mode.title} session has finished. Great work!`,
            data: { timerId: timer.id },
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: null, // Immediate notification
        });
      }
    } catch (error) {
      console.error('Failed to schedule completion notification:', error);
    }
  }

  // Show immediate completion notification
  private static async showCompletionNotification(timer: TimerState) {
    try {
      await Notifications.presentNotificationAsync({
        title: '🎯 Focus Session Complete!',
        body: `Your ${timer.mode.title} session has finished. Great work!`,
        data: { timerId: timer.id },
      });
    } catch (error) {
      console.error('Failed to show completion notification:', error);
    }
  }

  // Cancel all notifications
  private static async cancelNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  }

  // Request notification permissions
  static async requestPermissions() {
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

      return true;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }
}

export default BackgroundTimerService;
