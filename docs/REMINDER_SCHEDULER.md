# Reminder Scheduler System Documentation

## Overview

The **ReminderScheduler** is a robust, production-ready scheduling system for reminders and habit reminders in React Native/Expo applications. It uses Expo's notification APIs to provide reliable background scheduling that works even when the app is closed or the device is restarted.

---

## ✅ Requirements Met

✔️ **Never Fires Immediately** - All reminders are validated to be scheduled in the future  
✔️ **Local Timezone Support** - Respects the user's device timezone automatically  
✔️ **Background Scheduling** - Works reliably in the background using Expo Notifications  
✔️ **Unified Logic** - Same scheduling system for both reminders and habit reminders  
✔️ **Editable & Cancelable** - Full support for editing and canceling scheduled reminders  
✔️ **Persistent** - Survives app closure and device restarts  
✔️ **Detailed Logging** - Comprehensive debug logs for troubleshooting  

---

## 📦 Installation

The required package is already installed in your project:

```json
"expo-notifications": "~0.32.12"
```

---

## 🚀 Quick Start

### 1. Import the Service

```typescript
import { scheduleReminder, ReminderScheduler } from './services/reminderScheduler';
```

### 2. Schedule a Basic Reminder

```typescript
// Schedule a reminder for tomorrow at 9:00 AM
const tomorrow9am = new Date();
tomorrow9am.setDate(tomorrow9am.getDate() + 1);
tomorrow9am.setHours(9, 0, 0, 0);

const reminderId = await scheduleReminder({
  title: 'Morning Exercise',
  body: 'Time for your morning workout!',
  scheduledTime: tomorrow9am,
});

if (reminderId) {
  console.log('✅ Reminder scheduled:', reminderId);
}
```

### 3. Schedule a Daily Recurring Reminder

```typescript
const today8pm = new Date();
today8pm.setHours(20, 0, 0, 0);

// If 8 PM has already passed, schedule for tomorrow
if (today8pm <= new Date()) {
  today8pm.setDate(today8pm.getDate() + 1);
}

const reminderId = await scheduleReminder({
  title: 'Daily Reading',
  body: 'Don\'t forget to read for 30 minutes!',
  scheduledTime: today8pm,
  type: 'habit',
  recurring: {
    frequency: 'daily',
  },
  metadata: {
    habitId: 'reading_habit_123',
  },
});
```

---

## 📚 API Reference

### `ReminderScheduler.scheduleReminder(params)`

Schedules a new reminder.

**Parameters:**
```typescript
interface ScheduleReminderParams {
  title: string;              // Notification title
  body: string;               // Notification message
  scheduledTime: Date;        // When to trigger (must be in the future)
  type?: 'reminder' | 'habit'; // Type of reminder (default: 'reminder')
  recurring?: RecurringConfig; // Optional recurring configuration
  metadata?: Record<string, any>; // Additional data
}
```

**Returns:** `Promise<string | null>` - The reminder ID or null if failed

**Example:**
```typescript
const reminderId = await ReminderScheduler.scheduleReminder({
  title: 'Take a Break',
  body: 'Step away from the screen for 5 minutes',
  scheduledTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
});
```

---

### `ReminderScheduler.cancelReminder(reminderId)`

Cancels a scheduled reminder.

**Parameters:**
- `reminderId: string` - The ID of the reminder to cancel

**Returns:** `Promise<boolean>` - true if successful

**Example:**
```typescript
const success = await ReminderScheduler.cancelReminder('reminder_123');
if (success) {
  console.log('Reminder canceled');
}
```

---

### `ReminderScheduler.updateReminder(reminderId, updates)`

Updates an existing reminder.

**Parameters:**
- `reminderId: string` - The ID of the reminder to update
- `updates: Partial<ScheduleReminderParams>` - Fields to update

**Returns:** `Promise<boolean>` - true if successful

**Example:**
```typescript
await ReminderScheduler.updateReminder('reminder_123', {
  scheduledTime: newDate,
  body: 'Updated message',
});
```

---

### `ReminderScheduler.getAllReminders(type?)`

Gets all scheduled reminders.

**Parameters:**
- `type?: 'reminder' | 'habit'` - Optional filter by type

**Returns:** `Promise<ScheduledReminder[]>`

**Example:**
```typescript
const allReminders = await ReminderScheduler.getAllReminders();
const habitReminders = await ReminderScheduler.getAllReminders('habit');
```

---

### `ReminderScheduler.getActiveReminders()`

Gets all active reminders (future scheduled time).

**Returns:** `Promise<ScheduledReminder[]>`

---

### `ReminderScheduler.cleanupExpiredReminders()`

Removes expired non-recurring reminders.

**Example:**
```typescript
await ReminderScheduler.cleanupExpiredReminders();
```

---

### `ReminderScheduler.requestPermissions()`

Requests notification permissions (call before scheduling).

**Returns:** `Promise<boolean>` - true if granted

**Example:**
```typescript
const hasPermission = await ReminderScheduler.requestPermissions();
if (!hasPermission) {
  Alert.alert('Permissions Required', 'Please enable notifications');
}
```

---

## 🔄 Recurring Reminders

### Daily Recurring

```typescript
{
  recurring: {
    frequency: 'daily',
  }
}
```

### Weekly Recurring (Every Monday)

```typescript
{
  recurring: {
    frequency: 'weekly',
    weekday: 2, // 1 = Sunday, 2 = Monday, ..., 7 = Saturday
  }
}
```

### Monthly Recurring (1st of Each Month)

```typescript
{
  recurring: {
    frequency: 'monthly',
    day: 1, // Day of month (1-31)
  }
}
```

---

## 🎯 Use Cases

### 1. Habit Tracking Reminders

```typescript
// Morning water reminder - daily at 7:00 AM
const morningWater = await scheduleReminder({
  title: 'Morning Water',
  body: 'Start your day with a glass of water 💧',
  scheduledTime: createTime(7, 0),
  type: 'habit',
  recurring: { frequency: 'daily' },
  metadata: { habitId: 'water_habit' },
});

// Helper function
function createTime(hour: number, minute: number): Date {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  if (date <= new Date()) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}
```

### 2. Goal Deadline Reminders

```typescript
// Remind 1 day before goal deadline
const goalDeadline = new Date('2025-10-15T09:00:00');
const oneDayBefore = new Date(goalDeadline.getTime() - 24 * 60 * 60 * 1000);

await scheduleReminder({
  title: 'Goal Deadline Approaching',
  body: 'Your goal "Complete Course" is due tomorrow!',
  scheduledTime: oneDayBefore,
  metadata: { goalId: 'goal_456' },
});
```

### 3. Scheduled Break Reminders

```typescript
// Take a break every 2 hours during work hours
const breakTimes = [10, 12, 14, 16]; // 10 AM, 12 PM, 2 PM, 4 PM

for (const hour of breakTimes) {
  await scheduleReminder({
    title: 'Break Time',
    body: 'Time for a 5-minute break! 🧘',
    scheduledTime: createTime(hour, 0),
    recurring: { frequency: 'daily' },
  });
}
```

### 4. Weekly Planning Reminders

```typescript
// Every Monday at 8:00 AM
const nextMonday = getNextWeekday(1); // 0 = Sunday, 1 = Monday
nextMonday.setHours(8, 0, 0, 0);

await scheduleReminder({
  title: 'Weekly Planning',
  body: 'Set your goals for the week ahead 📋',
  scheduledTime: nextMonday,
  recurring: {
    frequency: 'weekly',
    weekday: 2, // Monday
  },
});
```

### 5. Snooze Functionality

```typescript
async function snoozeReminder(reminderId: string, minutes: number = 10) {
  const newTime = new Date();
  newTime.setMinutes(newTime.getMinutes() + minutes);
  
  return await ReminderScheduler.updateReminder(reminderId, {
    scheduledTime: newTime,
  });
}

// Snooze for 10 minutes
await snoozeReminder('reminder_123', 10);
```

---

## 🐛 Debugging

### View All Scheduled Notifications

```typescript
const scheduled = await ReminderScheduler.getAllScheduledNotifications();
console.log('Scheduled notifications:', scheduled.length);

scheduled.forEach((notification, index) => {
  console.log(`[${index + 1}] ${notification.content.title}`);
  console.log('  Time:', notification.trigger);
  console.log('  ID:', notification.identifier);
});
```

### Check Reminder Status

```typescript
const reminder = await ReminderScheduler.getReminder('reminder_123');
if (reminder) {
  console.log('Title:', reminder.title);
  console.log('Scheduled:', new Date(reminder.scheduledTime).toLocaleString());
  console.log('Active:', reminder.isActive);
  console.log('Type:', reminder.type);
}
```

---

## ⚠️ Important Notes

### 1. **Always Validate Future Time**

The service automatically validates that scheduled times are in the future, but you should also check in your UI:

```typescript
if (scheduledTime <= new Date()) {
  Alert.alert('Error', 'Please select a future time');
  return;
}
```

### 2. **Request Permissions First**

Always request permissions before scheduling:

```typescript
const hasPermission = await ReminderScheduler.requestPermissions();
if (!hasPermission) {
  // Handle permission denial
  return;
}
```

### 3. **Handle Timezone Correctly**

The Date object automatically uses the device's local timezone. No conversion needed!

```typescript
// This automatically uses the user's local timezone
const reminderTime = new Date();
reminderTime.setHours(9, 0, 0, 0);
```

### 4. **Clean Up Expired Reminders**

Call cleanup periodically to remove old reminders:

```typescript
// On app startup or daily
await ReminderScheduler.cleanupExpiredReminders();
```

### 5. **Store Reminder IDs**

Store the reminder ID if you need to cancel or update later:

```typescript
const reminderId = await scheduleReminder({...});
// Save reminderId to AsyncStorage or state
await AsyncStorage.setItem('my_reminder_id', reminderId);
```

---

## 📱 Platform-Specific Behavior

### Android
- Uses notification channels for better control
- Supports HIGH priority notifications
- Works reliably in background (via AlarmManager)

### iOS
- Requires explicit permission dialog
- Background notifications supported
- May be delayed if device is in low power mode

---

## 🔧 Integration with Existing Code

### Update RemindersCreationPage

The new `RemindersCreationPageNew.tsx` component demonstrates proper integration. Replace the old version:

```typescript
// In MainNavigator.tsx
import { RemindersCreationPageNew } from '../screens/RemindersCreationPageNew';

// Replace the screen
<Stack.Screen name="ReminderEntry" component={RemindersCreationPageNew} />
```

### Update Habit Streak Service

Replace the habit reminder scheduling logic in `habitStreakService.ts`:

```typescript
import { ReminderScheduler } from './reminderScheduler';

// Replace scheduleMiddayReminders with:
async function scheduleHabitReminder(habit: Habit) {
  const reminderTime = new Date();
  reminderTime.setHours(12, 0, 0, 0); // Midday
  
  if (reminderTime <= new Date()) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }
  
  await ReminderScheduler.scheduleReminder({
    title: 'Habit Reminder',
    body: `Don't forget: ${habit.title}`,
    scheduledTime: reminderTime,
    type: 'habit',
    recurring: { frequency: 'daily' },
    metadata: { habitId: habit.id },
  });
}
```

---

## 📊 Testing

### Manual Testing Checklist

- [ ] Schedule a reminder for 2 minutes from now - verify it triggers
- [ ] Schedule a recurring daily reminder - verify it repeats
- [ ] Cancel a scheduled reminder - verify it doesn't trigger
- [ ] Update a reminder time - verify the new time is used
- [ ] Close the app - verify reminders still trigger
- [ ] Restart the device - verify reminders persist
- [ ] Try to schedule a past time - verify validation works

### Test Helper

```typescript
// Schedule a test reminder for 1 minute from now
async function testReminder() {
  const oneMinute = new Date(Date.now() + 60 * 1000);
  
  const id = await scheduleReminder({
    title: 'Test Reminder',
    body: 'This is a test notification',
    scheduledTime: oneMinute,
  });
  
  console.log('Test reminder scheduled for:', oneMinute.toLocaleTimeString());
  return id;
}
```

---

## 🎉 Benefits

✅ **Reliable** - Uses Expo's battle-tested notification system  
✅ **Type-Safe** - Full TypeScript support with interfaces  
✅ **Debuggable** - Comprehensive logging for troubleshooting  
✅ **Flexible** - Supports one-time and recurring reminders  
✅ **Persistent** - Data stored in AsyncStorage  
✅ **Background** - Works even when app is closed  
✅ **Cross-Platform** - Works on both iOS and Android  

---

## 📝 Summary

The ReminderScheduler service provides a complete, production-ready solution for scheduling reminders in your React Native/Expo app. It handles all the complexity of background scheduling, timezone management, and permission handling, giving you a simple API to work with.

**Key Files:**
- `src/services/reminderScheduler.ts` - Main service
- `src/services/reminderSchedulerExamples.ts` - Usage examples
- `src/screens/RemindersCreationPageNew.tsx` - UI component

**Next Steps:**
1. Review the examples file for common use cases
2. Update your existing reminder code to use the new service
3. Test thoroughly on both platforms
4. Consider adding a reminder management screen for users to view/edit reminders

---

For questions or issues, refer to the examples file or check the debug logs!
