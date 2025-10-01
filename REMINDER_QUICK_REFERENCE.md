# 🚀 Reminder Scheduler - Quick Reference

## Installation ✅
Already installed: `expo-notifications: ~0.32.12`

---

## 📝 Basic Usage

### Import
```typescript
import { scheduleReminder, ReminderScheduler } from './services/reminderScheduler';
```

### Schedule a Reminder
```typescript
const reminderId = await scheduleReminder({
  title: 'Task Reminder',
  body: 'Complete your daily task',
  scheduledTime: futureDate, // Must be in the future!
});
```

### Cancel a Reminder
```typescript
await ReminderScheduler.cancelReminder(reminderId);
```

### Update a Reminder
```typescript
await ReminderScheduler.updateReminder(reminderId, {
  scheduledTime: newDate,
  body: 'Updated message',
});
```

---

## ⚡ Quick Recipes

### 1. Tomorrow at 9 AM
```typescript
const tomorrow9am = new Date();
tomorrow9am.setDate(tomorrow9am.getDate() + 1);
tomorrow9am.setHours(9, 0, 0, 0);

await scheduleReminder({
  title: 'Good Morning',
  body: 'Start your day!',
  scheduledTime: tomorrow9am,
});
```

### 2. In 5 Minutes
```typescript
const fiveMinutes = new Date(Date.now() + 5 * 60 * 1000);

await scheduleReminder({
  title: 'Quick Reminder',
  body: 'Check this out',
  scheduledTime: fiveMinutes,
});
```

### 3. Daily at 8 PM
```typescript
const today8pm = new Date();
today8pm.setHours(20, 0, 0, 0);
if (today8pm <= new Date()) {
  today8pm.setDate(today8pm.getDate() + 1);
}

await scheduleReminder({
  title: 'Evening Routine',
  body: 'Time to wind down',
  scheduledTime: today8pm,
  recurring: { frequency: 'daily' },
});
```

### 4. Weekly (Every Monday at 9 AM)
```typescript
const nextMonday = getNextWeekday(1); // 0=Sunday, 1=Monday
nextMonday.setHours(9, 0, 0, 0);

await scheduleReminder({
  title: 'Weekly Planning',
  body: 'Plan your week',
  scheduledTime: nextMonday,
  recurring: {
    frequency: 'weekly',
    weekday: 2, // 1=Sunday, 2=Monday
  },
});
```

### 5. Habit Reminder
```typescript
await scheduleReminder({
  title: 'Drink Water',
  body: 'Stay hydrated! 💧',
  scheduledTime: reminderTime,
  type: 'habit',
  recurring: { frequency: 'daily' },
  metadata: { habitId: 'water_habit' },
});
```

---

## 🔍 Querying

### Get All Active Reminders
```typescript
const active = await ReminderScheduler.getActiveReminders();
console.log(`${active.length} active reminders`);
```

### Get Habit Reminders Only
```typescript
const habits = await ReminderScheduler.getAllReminders('habit');
```

### Get a Specific Reminder
```typescript
const reminder = await ReminderScheduler.getReminder(reminderId);
if (reminder) {
  console.log(reminder.title, new Date(reminder.scheduledTime));
}
```

---

## 🐛 Debugging

### View All Scheduled
```typescript
const scheduled = await ReminderScheduler.getAllScheduledNotifications();
console.log('Scheduled:', scheduled.length);
```

### Cleanup Expired
```typescript
await ReminderScheduler.cleanupExpiredReminders();
```

---

## 🧪 Testing

### Run Quick Smoke Test
```typescript
import { ReminderTests } from './services/reminderSchedulerTests';

// Quick test
await ReminderTests.quickSmoke();

// Full test suite
await ReminderTests.runAll();
```

### Test Individual Features
```typescript
// Test scheduling
await ReminderTests.test1_QuickReminder();

// Test canceling
await ReminderTests.test3_CancelReminder();

// Test daily recurring
await ReminderTests.test4_DailyRecurring();
```

---

## ⚠️ Important Rules

### ✅ DO
- Always schedule for future times
- Request permissions before scheduling
- Validate dates in your UI
- Store reminder IDs if you need to cancel later
- Use `type: 'habit'` for habit-related reminders

### ❌ DON'T
- Don't schedule for past times (will be rejected)
- Don't forget to request permissions first
- Don't assume reminders persist forever (cleanup expired ones)
- Don't rely on immediate triggering (always future)

---

## 🔑 Key Types

```typescript
// Scheduling parameters
interface ScheduleReminderParams {
  title: string;
  body: string;
  scheduledTime: Date;        // Must be future
  type?: 'reminder' | 'habit'; // Default: 'reminder'
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    weekday?: number;  // 1-7 (weekly only)
    day?: number;      // 1-31 (monthly only)
  };
  metadata?: Record<string, any>;
}

// Stored reminder
interface ScheduledReminder {
  id: string;
  title: string;
  body: string;
  scheduledTime: string; // ISO 8601
  notificationId: string;
  type: 'reminder' | 'habit';
  recurring?: RecurringConfig;
  isActive: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}
```

---

## 📱 Platform Notes

### Android
- Uses AlarmManager for background
- Supports notification channels
- Reliable background execution

### iOS
- Uses UNUserNotificationCenter
- May be delayed in low power mode
- Requires explicit permissions

---

## 🎯 Common Patterns

### Snooze Reminder
```typescript
async function snooze(reminderId: string, minutes: number = 10) {
  const newTime = new Date(Date.now() + minutes * 60 * 1000);
  return await ReminderScheduler.updateReminder(reminderId, {
    scheduledTime: newTime,
  });
}
```

### Create Time Helper
```typescript
function createTime(hour: number, minute: number): Date {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  
  // If time has passed, schedule for tomorrow
  if (date <= new Date()) {
    date.setDate(date.getDate() + 1);
  }
  
  return date;
}

// Usage
await scheduleReminder({
  title: 'Morning Reminder',
  body: 'Start your day!',
  scheduledTime: createTime(7, 30), // 7:30 AM
});
```

### Get Next Weekday
```typescript
function getNextWeekday(targetDay: number): Date {
  const date = new Date();
  const currentDay = date.getDay();
  const daysUntilTarget = targetDay === 0 
    ? (7 - currentDay) 
    : targetDay > currentDay 
      ? targetDay - currentDay 
      : 7 - (currentDay - targetDay);
  
  date.setDate(date.getDate() + daysUntilTarget);
  return date;
}

// Usage: Next Friday
const nextFriday = getNextWeekday(5); // 0=Sunday, 5=Friday
```

---

## 📁 File Locations

- **Service**: `src/services/reminderScheduler.ts`
- **Examples**: `src/services/reminderSchedulerExamples.ts`
- **Tests**: `src/services/reminderSchedulerTests.ts`
- **UI Component**: `src/screens/RemindersCreationPageNew.tsx`
- **Documentation**: `docs/REMINDER_SCHEDULER.md`

---

## 🎓 Learn More

1. **Full Documentation**: See `docs/REMINDER_SCHEDULER.md`
2. **Examples**: Check `src/services/reminderSchedulerExamples.ts`
3. **Expo Docs**: https://docs.expo.dev/versions/latest/sdk/notifications/

---

## ✨ Pro Tips

1. **Always validate** - Check that scheduledTime > new Date()
2. **Request early** - Ask for permissions on app startup
3. **Store IDs** - Save reminder IDs if you need to cancel later
4. **Use metadata** - Store extra data (habitId, goalId, etc.)
5. **Test locally** - Use 1-2 minute timers for quick testing
6. **Clean up** - Run cleanupExpiredReminders() periodically
7. **Debug logs** - Check console for detailed scheduling info

---

**Quick Start**: Just copy a recipe above and modify for your needs!
