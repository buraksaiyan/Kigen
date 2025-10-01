import * as TaskManager from 'expo-task-manager';
import { HabitStreakService } from './habitStreakService';
import { AppState } from 'react-native';

const HABIT_CHECK_TASK = 'habit-streak-check';

// Define the background task
TaskManager.defineTask(HABIT_CHECK_TASK, async () => {
  try {
    console.log('Running background habit streak check...');
    
    // Check and reset missed habit streaks
    const result = await HabitStreakService.checkAndResetMissedStreaks();
    
    if (result.habitsResetCount > 0) {
      console.log(`Background check: Reset ${result.habitsResetCount} habit streaks`);
    }

    // Schedule midday reminders for incomplete habits
    await HabitStreakService.scheduleMiddayReminders();
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Background habit check failed:', error);
    return { success: false, error: String(error) };
  }
});

export class HabitBackgroundService {
  private static appStateListener: any = null;

  /**
   * Initialize app state listener to check habits when app becomes active
   */
  static async initialize(): Promise<void> {
    try {
      console.log('Initializing Habit Background Service...');

      // Remove existing listener if any
      if (this.appStateListener) {
        this.appStateListener.remove();
      }

      // Add app state change listener to check habits when app becomes active
      this.appStateListener = AppState.addEventListener('change', async (nextAppState) => {
        if (nextAppState === 'active') {
          console.log('App became active - checking habit streaks...');
          try {
            const result = await HabitStreakService.checkAndResetMissedStreaks();
            if (result.habitsResetCount > 0) {
              console.log(`App active check: Reset ${result.habitsResetCount} habit streaks`);
            }
            
            // Schedule midday reminders for today
            await HabitStreakService.scheduleMiddayReminders();
          } catch (error) {
            console.error('Failed to check habits on app active:', error);
          }
        }
      });

      console.log('Habit Background Service initialized successfully');
    } catch (error) {
      console.error('Error initializing Habit Background Service:', error);
    }
  }

  /**
   * Cleanup the service
   */
  static cleanup(): void {
    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
      console.log('Habit Background Service cleaned up');
    }
  }

  /**
   * Force check habits (for testing/manual trigger)
   */
  static async forceCheck(): Promise<void> {
    try {
      console.log('Force checking habit streaks...');
      const result = await HabitStreakService.checkAndResetMissedStreaks();
      console.log(`Force check result: ${result.habitsResetCount} streaks reset`);
      
      await HabitStreakService.scheduleMiddayReminders();
      console.log('Midday reminders scheduled');
    } catch (error) {
      console.error('Force check failed:', error);
    }
  }
}