/**
 * Example Usage of ReminderScheduler Service
 * 
 * This file demonstrates how to use the ReminderScheduler for both
 * regular reminders and habit reminders.
 */

import {
  ReminderScheduler,
  scheduleReminder,
  cancelReminder,
  updateReminder,
  ScheduleReminderParams,
} from '../services/reminderScheduler';

// ============================================================================
// Example 1: Schedule a simple reminder for tomorrow at 9:00 AM
// ============================================================================
export async function scheduleSimpleReminder() {
  const tomorrow9am = new Date();
  tomorrow9am.setDate(tomorrow9am.getDate() + 1);
  tomorrow9am.setHours(9, 0, 0, 0);

  const reminderId = await scheduleReminder({
    title: 'Morning Exercise',
    body: 'Time for your morning workout!',
    scheduledTime: tomorrow9am,
  });

  if (reminderId) {
    console.log('✅ Reminder scheduled with ID:', reminderId);
  } else {
    console.error('❌ Failed to schedule reminder');
  }

  return reminderId;
}

// ============================================================================
// Example 2: Schedule a habit reminder (daily recurring)
// ============================================================================
export async function scheduleHabitReminder() {
  const today8pm = new Date();
  today8pm.setHours(20, 0, 0, 0); // 8:00 PM

  // If 8 PM has already passed today, schedule for tomorrow
  if (today8pm <= new Date()) {
    today8pm.setDate(today8pm.getDate() + 1);
  }

  const reminderId = await scheduleReminder({
    title: 'Daily Reading',
    body: 'Don\'t forget to read for 30 minutes today!',
    scheduledTime: today8pm,
    type: 'habit',
    recurring: {
      frequency: 'daily',
    },
    metadata: {
      habitId: 'habit_123',
      targetDuration: 30,
    },
  });

  if (reminderId) {
    console.log('✅ Habit reminder scheduled with ID:', reminderId);
  }

  return reminderId;
}

// ============================================================================
// Example 3: Schedule a weekly reminder (every Monday at 6:00 AM)
// ============================================================================
export async function scheduleWeeklyReminder() {
  const nextMonday6am = new Date();
  
  // Calculate next Monday
  const currentDay = nextMonday6am.getDay();
  const daysUntilMonday = currentDay === 0 ? 1 : 8 - currentDay;
  nextMonday6am.setDate(nextMonday6am.getDate() + daysUntilMonday);
  nextMonday6am.setHours(6, 0, 0, 0);

  const reminderId = await scheduleReminder({
    title: 'Weekly Review',
    body: 'Time for your weekly planning session!',
    scheduledTime: nextMonday6am,
    recurring: {
      frequency: 'weekly',
      weekday: 2, // Monday (1 = Sunday, 2 = Monday, ...)
    },
  });

  return reminderId;
}

// ============================================================================
// Example 4: Schedule a monthly reminder (1st of each month at 9:00 AM)
// ============================================================================
export async function scheduleMonthlyReminder() {
  const firstOfNextMonth = new Date();
  firstOfNextMonth.setMonth(firstOfNextMonth.getMonth() + 1);
  firstOfNextMonth.setDate(1);
  firstOfNextMonth.setHours(9, 0, 0, 0);

  const reminderId = await scheduleReminder({
    title: 'Monthly Budget Review',
    body: 'Review your monthly expenses and set new goals',
    scheduledTime: firstOfNextMonth,
    recurring: {
      frequency: 'monthly',
      day: 1,
    },
  });

  return reminderId;
}

// ============================================================================
// Example 5: Schedule a reminder with metadata (for habit tracking)
// ============================================================================
export async function scheduleHabitWithMetadata() {
  const reminderTime = new Date();
  reminderTime.setHours(18, 30, 0, 0); // 6:30 PM today

  // If time has passed, schedule for tomorrow
  if (reminderTime <= new Date()) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }

  const reminderId = await scheduleReminder({
    title: 'Meditation Time',
    body: 'Take 10 minutes to meditate and relax',
    scheduledTime: reminderTime,
    type: 'habit',
    recurring: {
      frequency: 'daily',
    },
    metadata: {
      habitId: 'meditation_habit_456',
      category: 'mindfulness',
      targetDuration: 10,
      streakCount: 7,
    },
  });

  return reminderId;
}

// ============================================================================
// Example 6: Cancel a reminder
// ============================================================================
export async function cancelExistingReminder(reminderId: string) {
  const success = await cancelReminder(reminderId);
  
  if (success) {
    console.log('✅ Reminder canceled successfully');
  } else {
    console.error('❌ Failed to cancel reminder');
  }

  return success;
}

// ============================================================================
// Example 7: Update a reminder (reschedule or change content)
// ============================================================================
export async function updateExistingReminder(reminderId: string) {
  const newTime = new Date();
  newTime.setDate(newTime.getDate() + 2); // 2 days from now
  newTime.setHours(10, 0, 0, 0); // 10:00 AM

  const success = await updateReminder(reminderId, {
    scheduledTime: newTime,
    body: 'Updated reminder message - don\'t forget!',
  });

  if (success) {
    console.log('✅ Reminder updated successfully');
  } else {
    console.error('❌ Failed to update reminder');
  }

  return success;
}

// ============================================================================
// Example 8: Get all active reminders
// ============================================================================
export async function getActiveReminders() {
  const activeReminders = await ReminderScheduler.getActiveReminders();
  
  console.log('Active reminders:', activeReminders.length);
  activeReminders.forEach(reminder => {
    console.log('- ', reminder.title, 'at', new Date(reminder.scheduledTime).toLocaleString());
  });

  return activeReminders;
}

// ============================================================================
// Example 9: Get all habit reminders
// ============================================================================
export async function getAllHabitReminders() {
  const habitReminders = await ReminderScheduler.getAllReminders('habit');
  
  console.log('Habit reminders:', habitReminders.length);
  return habitReminders;
}

// ============================================================================
// Example 10: Clean up expired reminders
// ============================================================================
export async function cleanupExpired() {
  await ReminderScheduler.cleanupExpiredReminders();
  console.log('✅ Expired reminders cleaned up');
}

// ============================================================================
// Example 11: Debug - View all scheduled notifications
// ============================================================================
export async function debugScheduledNotifications() {
  const scheduled = await ReminderScheduler.getAllScheduledNotifications();
  
  console.log('=== Scheduled Notifications ===');
  console.log('Total:', scheduled.length);
  
  scheduled.forEach((notification, index) => {
    console.log(`\n[${index + 1}] ${notification.content.title}`);
    console.log('  ID:', notification.identifier);
    console.log('  Body:', notification.content.body);
    console.log('  Trigger:', JSON.stringify(notification.trigger, null, 2));
  });

  return scheduled;
}

// ============================================================================
// Example 12: Request permissions before scheduling
// ============================================================================
export async function ensurePermissions() {
  const hasPermission = await ReminderScheduler.requestPermissions();
  
  if (hasPermission) {
    console.log('✅ Notification permissions granted');
  } else {
    console.error('❌ Notification permissions denied');
  }

  return hasPermission;
}

// ============================================================================
// Example 13: Schedule multiple reminders at once
// ============================================================================
export async function scheduleBatchReminders() {
  const reminders: ScheduleReminderParams[] = [
    {
      title: 'Morning Water',
      body: 'Drink a glass of water to start your day',
      scheduledTime: createTimeToday(7, 0),
      type: 'habit',
      recurring: { frequency: 'daily' },
    },
    {
      title: 'Midday Stretch',
      body: 'Take a 5-minute stretch break',
      scheduledTime: createTimeToday(12, 0),
      type: 'habit',
      recurring: { frequency: 'daily' },
    },
    {
      title: 'Evening Journal',
      body: 'Write down 3 things you\'re grateful for',
      scheduledTime: createTimeToday(21, 0),
      type: 'habit',
      recurring: { frequency: 'daily' },
    },
  ];

  const reminderIds = await Promise.all(
    reminders.map(params => scheduleReminder(params))
  );

  const successCount = reminderIds.filter(id => id !== null).length;
  console.log(`✅ Scheduled ${successCount}/${reminders.length} reminders`);

  return reminderIds;
}

// ============================================================================
// Helper: Create a Date object for a specific time today (or tomorrow if passed)
// ============================================================================
function createTimeToday(hour: number, minute: number): Date {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  // If time has already passed today, schedule for tomorrow
  if (date <= new Date()) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}

// ============================================================================
// Example Integration: Using in a React Component
// ============================================================================
export const ReminderExamples = {
  // Call from a React component
  onCreateMorningReminder: async () => {
    const reminderTime = new Date();
    reminderTime.setHours(7, 30, 0, 0);

    if (reminderTime <= new Date()) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const id = await scheduleReminder({
      title: 'Good Morning!',
      body: 'Start your day with a positive mindset',
      scheduledTime: reminderTime,
      recurring: { frequency: 'daily' },
    });

    return id;
  },

  // Call when user completes a habit
  onHabitCompleted: async (habitId: string, habitTitle: string) => {
    // Cancel any pending reminders for this habit
    const reminders = await ReminderScheduler.getAllReminders('habit');
    const habitReminders = reminders.filter(r => r.metadata?.habitId === habitId);
    
    await Promise.all(habitReminders.map(r => cancelReminder(r.id)));
    
    console.log(`Canceled ${habitReminders.length} reminders for completed habit: ${habitTitle}`);
  },

  // Call when user snoozes a reminder
  onSnoozeReminder: async (reminderId: string, snoozeMinutes: number = 10) => {
    const newTime = new Date();
    newTime.setMinutes(newTime.getMinutes() + snoozeMinutes);

    return await updateReminder(reminderId, {
      scheduledTime: newTime,
    });
  },
};
