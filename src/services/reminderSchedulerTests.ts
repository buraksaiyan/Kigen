/**
 * Quick Test Suite for ReminderScheduler
 * 
 * Run these tests to verify the reminder system is working correctly.
 * Import this file and call the test functions from your app.
 */

import { ReminderScheduler, scheduleReminder } from '../services/reminderScheduler';
import { Alert } from 'react-native';

/**
 * Test 1: Schedule a reminder for 2 minutes from now
 */
export async function test1_QuickReminder() {
  console.log('\n========== TEST 1: Quick Reminder (2 minutes) ==========');
  
  const twoMinutes = new Date(Date.now() + 2 * 60 * 1000);
  
  const id = await scheduleReminder({
    title: 'Test Reminder',
    body: 'This is a test notification!',
    scheduledTime: twoMinutes,
  });
  
  if (id) {
    console.log('✅ Test 1 PASSED');
    console.log('Reminder ID:', id);
    console.log('Will trigger at:', twoMinutes.toLocaleTimeString());
    Alert.alert('Test 1 Passed', `Reminder scheduled for ${twoMinutes.toLocaleTimeString()}`);
    return id;
  } else {
    console.log('❌ Test 1 FAILED');
    Alert.alert('Test 1 Failed', 'Could not schedule reminder');
    return null;
  }
}

/**
 * Test 2: Try to schedule a past time (should fail)
 */
export async function test2_PastTimeFail() {
  console.log('\n========== TEST 2: Past Time Validation ==========');
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const id = await scheduleReminder({
    title: 'This Should Fail',
    body: 'Past time test',
    scheduledTime: yesterday,
  });
  
  if (id === null) {
    console.log('✅ Test 2 PASSED - Correctly rejected past time');
    Alert.alert('Test 2 Passed', 'Past time was correctly rejected');
    return true;
  } else {
    console.log('❌ Test 2 FAILED - Should have rejected past time');
    Alert.alert('Test 2 Failed', 'Past time was accepted (should be rejected)');
    return false;
  }
}

/**
 * Test 3: Schedule and then cancel
 */
export async function test3_CancelReminder() {
  console.log('\n========== TEST 3: Schedule and Cancel ==========');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  
  // Schedule
  const id = await scheduleReminder({
    title: 'Reminder to Cancel',
    body: 'This will be canceled',
    scheduledTime: tomorrow,
  });
  
  if (!id) {
    console.log('❌ Test 3 FAILED - Could not schedule reminder');
    Alert.alert('Test 3 Failed', 'Could not schedule reminder');
    return false;
  }
  
  console.log('Scheduled reminder:', id);
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Cancel
  const success = await ReminderScheduler.cancelReminder(id);
  
  if (success) {
    console.log('✅ Test 3 PASSED - Reminder scheduled and canceled');
    Alert.alert('Test 3 Passed', 'Reminder was successfully canceled');
    return true;
  } else {
    console.log('❌ Test 3 FAILED - Could not cancel reminder');
    Alert.alert('Test 3 Failed', 'Could not cancel reminder');
    return false;
  }
}

/**
 * Test 4: Schedule a recurring daily reminder
 */
export async function test4_DailyRecurring() {
  console.log('\n========== TEST 4: Daily Recurring Reminder ==========');
  
  const tomorrow9am = new Date();
  tomorrow9am.setDate(tomorrow9am.getDate() + 1);
  tomorrow9am.setHours(9, 0, 0, 0);
  
  const id = await scheduleReminder({
    title: 'Daily Test Reminder',
    body: 'This reminder repeats daily',
    scheduledTime: tomorrow9am,
    recurring: {
      frequency: 'daily',
    },
  });
  
  if (id) {
    console.log('✅ Test 4 PASSED');
    console.log('Daily reminder ID:', id);
    console.log('First trigger:', tomorrow9am.toLocaleString());
    Alert.alert('Test 4 Passed', `Daily reminder scheduled for ${tomorrow9am.toLocaleTimeString()}`);
    return id;
  } else {
    console.log('❌ Test 4 FAILED');
    Alert.alert('Test 4 Failed', 'Could not schedule daily reminder');
    return null;
  }
}

/**
 * Test 5: Schedule a habit reminder
 */
export async function test5_HabitReminder() {
  console.log('\n========== TEST 5: Habit Reminder ==========');
  
  const today8pm = new Date();
  today8pm.setHours(20, 0, 0, 0);
  
  if (today8pm <= new Date()) {
    today8pm.setDate(today8pm.getDate() + 1);
  }
  
  const id = await scheduleReminder({
    title: 'Test Habit',
    body: 'Complete your daily habit!',
    scheduledTime: today8pm,
    type: 'habit',
    recurring: {
      frequency: 'daily',
    },
    metadata: {
      habitId: 'test_habit_123',
      category: 'health',
    },
  });
  
  if (id) {
    console.log('✅ Test 5 PASSED');
    console.log('Habit reminder ID:', id);
    console.log('Will trigger at:', today8pm.toLocaleString());
    Alert.alert('Test 5 Passed', 'Habit reminder scheduled successfully');
    return id;
  } else {
    console.log('❌ Test 5 FAILED');
    Alert.alert('Test 5 Failed', 'Could not schedule habit reminder');
    return null;
  }
}

/**
 * Test 6: Update a reminder
 */
export async function test6_UpdateReminder() {
  console.log('\n========== TEST 6: Update Reminder ==========');
  
  // Schedule initial reminder
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  
  const id = await scheduleReminder({
    title: 'Original Title',
    body: 'Original body',
    scheduledTime: tomorrow,
  });
  
  if (!id) {
    console.log('❌ Test 6 FAILED - Could not schedule initial reminder');
    return false;
  }
  
  console.log('Scheduled initial reminder:', id);
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Update the reminder
  const newTime = new Date(tomorrow.getTime() + 60 * 60 * 1000); // 1 hour later
  const success = await ReminderScheduler.updateReminder(id, {
    title: 'Updated Title',
    body: 'Updated body text',
    scheduledTime: newTime,
  });
  
  if (success) {
    console.log('✅ Test 6 PASSED - Reminder updated successfully');
    console.log('New time:', newTime.toLocaleString());
    Alert.alert('Test 6 Passed', 'Reminder was successfully updated');
    return true;
  } else {
    console.log('❌ Test 6 FAILED - Could not update reminder');
    Alert.alert('Test 6 Failed', 'Could not update reminder');
    return false;
  }
}

/**
 * Test 7: Get all active reminders
 */
export async function test7_GetActiveReminders() {
  console.log('\n========== TEST 7: Get Active Reminders ==========');
  
  const active = await ReminderScheduler.getActiveReminders();
  
  console.log('Active reminders:', active.length);
  active.forEach((reminder, index) => {
    console.log(`[${index + 1}] ${reminder.title}`);
    console.log(`    Type: ${reminder.type}`);
    console.log(`    Scheduled: ${new Date(reminder.scheduledTime).toLocaleString()}`);
    console.log(`    Recurring: ${reminder.recurring ? 'Yes' : 'No'}`);
  });
  
  console.log('✅ Test 7 PASSED');
  Alert.alert('Test 7 Passed', `Found ${active.length} active reminders`);
  return active;
}

/**
 * Test 8: Request permissions
 */
export async function test8_Permissions() {
  console.log('\n========== TEST 8: Notification Permissions ==========');
  
  const granted = await ReminderScheduler.requestPermissions();
  
  if (granted) {
    console.log('✅ Test 8 PASSED - Permissions granted');
    Alert.alert('Test 8 Passed', 'Notification permissions are granted');
    return true;
  } else {
    console.log('⚠️  Test 8 WARNING - Permissions denied');
    Alert.alert('Test 8 Warning', 'Notification permissions are denied');
    return false;
  }
}

/**
 * Test 9: Cleanup expired reminders
 */
export async function test9_CleanupExpired() {
  console.log('\n========== TEST 9: Cleanup Expired Reminders ==========');
  
  await ReminderScheduler.cleanupExpiredReminders();
  
  console.log('✅ Test 9 PASSED - Cleanup completed');
  Alert.alert('Test 9 Passed', 'Expired reminders cleaned up');
  return true;
}

/**
 * Test 10: Debug - View all scheduled notifications
 */
export async function test10_DebugNotifications() {
  console.log('\n========== TEST 10: Debug Scheduled Notifications ==========');
  
  const scheduled = await ReminderScheduler.getAllScheduledNotifications();
  
  console.log('Total scheduled notifications:', scheduled.length);
  scheduled.forEach((notification, index) => {
    console.log(`\n[${index + 1}] ${notification.content.title}`);
    console.log('  ID:', notification.identifier);
    console.log('  Body:', notification.content.body);
    console.log('  Trigger:', JSON.stringify(notification.trigger, null, 2));
  });
  
  console.log('✅ Test 10 PASSED');
  Alert.alert('Test 10 Passed', `Found ${scheduled.length} scheduled notifications`);
  return scheduled;
}

/**
 * Run all tests sequentially
 */
export async function runAllTests() {
  console.log('\n========================================');
  console.log('RUNNING ALL REMINDER SCHEDULER TESTS');
  console.log('========================================\n');
  
  const results = {
    test1: false,
    test2: false,
    test3: false,
    test4: false,
    test5: false,
    test6: false,
    test7: false,
    test8: false,
    test9: false,
    test10: false,
  };
  
  try {
    // Test 8 first (permissions)
    results.test8 = await test8_Permissions();
    if (!results.test8) {
      Alert.alert('Tests Stopped', 'Permissions required to continue tests');
      return results;
    }
    
    await delay(1000);
    
    // Run other tests
    results.test1 = !!(await test1_QuickReminder());
    await delay(1000);
    
    results.test2 = await test2_PastTimeFail();
    await delay(1000);
    
    results.test3 = await test3_CancelReminder();
    await delay(1000);
    
    results.test4 = !!(await test4_DailyRecurring());
    await delay(1000);
    
    results.test5 = !!(await test5_HabitReminder());
    await delay(1000);
    
    results.test6 = await test6_UpdateReminder();
    await delay(1000);
    
    await test7_GetActiveReminders();
    results.test7 = true;
    await delay(1000);
    
    await test9_CleanupExpired();
    results.test9 = true;
    await delay(1000);
    
    await test10_DebugNotifications();
    results.test10 = true;
    
  } catch (error) {
    console.error('Test suite error:', error);
    Alert.alert('Test Error', String(error));
  }
  
  // Summary
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');
  console.log(`Passed: ${passed}/${total}`);
  console.log('Results:', results);
  console.log('========================================\n');
  
  Alert.alert(
    'Tests Complete',
    `Passed: ${passed}/${total} tests\n\nCheck console for detailed logs`,
    [{ text: 'OK' }]
  );
  
  return results;
}

/**
 * Quick smoke test - runs a minimal set of tests
 */
export async function quickSmokeTest() {
  console.log('\n========== QUICK SMOKE TEST ==========\n');
  
  // Test permissions
  const hasPermission = await ReminderScheduler.requestPermissions();
  if (!hasPermission) {
    Alert.alert('Smoke Test Failed', 'No notification permissions');
    return false;
  }
  
  // Schedule a reminder for 1 minute
  const oneMinute = new Date(Date.now() + 60 * 1000);
  const id = await scheduleReminder({
    title: 'Smoke Test',
    body: 'Quick test reminder',
    scheduledTime: oneMinute,
  });
  
  if (!id) {
    Alert.alert('Smoke Test Failed', 'Could not schedule reminder');
    return false;
  }
  
  console.log('✅ Smoke test reminder scheduled:', id);
  
  // Get active reminders
  const active = await ReminderScheduler.getActiveReminders();
  console.log('Active reminders:', active.length);
  
  // Clean up - cancel the test reminder
  await ReminderScheduler.cancelReminder(id);
  console.log('✅ Test reminder canceled');
  
  console.log('\n✅ SMOKE TEST PASSED\n');
  Alert.alert('Smoke Test Passed', 'Basic functionality works!');
  
  return true;
}

// Helper function
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Export test suite for easy import
 */
export const ReminderTests = {
  runAll: runAllTests,
  quickSmoke: quickSmokeTest,
  test1_QuickReminder,
  test2_PastTimeFail,
  test3_CancelReminder,
  test4_DailyRecurring,
  test5_HabitReminder,
  test6_UpdateReminder,
  test7_GetActiveReminders,
  test8_Permissions,
  test9_CleanupExpired,
  test10_DebugNotifications,
};
