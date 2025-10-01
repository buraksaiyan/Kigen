import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { HabitStreakService } from '../services/habitStreakService';
import { HabitBackgroundService } from '../services/habitBackgroundService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HabitStreakTestScreen() {
  const [log, setLog] = useState<string[]>([]);
  const [habits, setHabits] = useState<any[]>([]);

  const append = (message: string) => {
    setLog(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 19)]);
    console.log(message);
  };

  const loadHabits = async () => {
    try {
      const habitsData = await AsyncStorage.getItem('@inzone_habits');
      const parsedHabits = habitsData ? JSON.parse(habitsData) : [];
      setHabits(parsedHabits);
      append(`Loaded ${parsedHabits.length} habits from storage`);
    } catch (error) {
      append(`Error loading habits: ${error}`);
    }
  };

  const createTestHabit = async () => {
    try {
      const testHabit = {
        id: `test-habit-${Date.now()}`,
        title: 'Test Habit - Daily Water',
        description: 'Drink 8 glasses of water',
        frequency: 'daily',
        targetDays: 7,
        isActive: true,
        createdAt: new Date().toISOString(),
        streak: 2, // Start with streak of 2 days
        lastCompleted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toDateString(), // Completed 2 days ago
      };

      const existingHabits = await AsyncStorage.getItem('@inzone_habits');
      const habitsArray = existingHabits ? JSON.parse(existingHabits) : [];
      habitsArray.push(testHabit);

      await AsyncStorage.setItem('@inzone_habits', JSON.stringify(habitsArray));
      append(`Created test habit with 2-day streak, last completed 2 days ago`);
      await loadHabits();
    } catch (error) {
      append(`Error creating test habit: ${error}`);
    }
  };

  const clearAllHabits = async () => {
    try {
      await AsyncStorage.removeItem('@inzone_habits');
      await AsyncStorage.removeItem('@inzone_habit_last_streak_check');
      setHabits([]);
      append('Cleared all habits and reset check date');
    } catch (error) {
      append(`Error clearing habits: ${error}`);
    }
  };

  const forceStreakCheck = async () => {
    try {
      append('Running manual streak check...');
      const result = await HabitStreakService.checkAndResetMissedStreaks();
      append(`Check complete: ${result.habitsResetCount} streaks reset`);
      
      if (result.resetHabits.length > 0) {
        result.resetHabits.forEach(habit => {
          append(`Reset "${habit.title}" (was ${habit.previousStreak} days)`);
        });
      }
      
      await loadHabits();
    } catch (error) {
      append(`Error during streak check: ${error}`);
    }
  };

  const scheduleReminders = async () => {
    try {
      append('Scheduling midday reminders...');
      await HabitStreakService.scheduleMiddayReminders();
      append('Midday reminders scheduled');
    } catch (error) {
      append(`Error scheduling reminders: ${error}`);
    }
  };

  const getHabitsNeedingAttention = async () => {
    try {
      const needingAttention = await HabitStreakService.getHabitsNeedingAttention();
      append(`${needingAttention.length} habits need attention today`);
      needingAttention.forEach(habit => {
        append(`- "${habit.title}" (streak: ${habit.streak})`);
      });
    } catch (error) {
      append(`Error getting habits needing attention: ${error}`);
    }
  };

  const forceBackgroundCheck = async () => {
    try {
      append('Running background service check...');
      await HabitBackgroundService.forceCheck();
      append('Background check completed');
      await loadHabits();
    } catch (error) {
      append(`Background check error: ${error}`);
    }
  };

  const resetTestHabitManually = async () => {
    if (habits.length === 0) {
      append('No habits to reset');
      return;
    }

    const testHabit = habits.find(h => h.title.includes('Test Habit'));
    if (!testHabit) {
      append('No test habit found');
      return;
    }

    try {
      const success = await HabitStreakService.manuallyResetHabitStreak(testHabit.id);
      if (success) {
        append(`Manually reset streak for "${testHabit.title}"`);
        await loadHabits();
      } else {
        append('Failed to reset habit streak');
      }
    } catch (error) {
      append(`Error resetting habit manually: ${error}`);
    }
  };

  const createOldHabitForTesting = async () => {
    try {
      const testHabit = {
        id: `old-habit-${Date.now()}`,
        title: 'Old Habit - 5 Days Ago',
        description: 'Test habit last completed 5 days ago',
        frequency: 'daily',
        targetDays: 30,
        isActive: true,
        createdAt: new Date().toISOString(),
        streak: 5, // Had a 5-day streak
        lastCompleted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toDateString(), // Completed 5 days ago
      };

      const existingHabits = await AsyncStorage.getItem('@inzone_habits');
      const habitsArray = existingHabits ? JSON.parse(existingHabits) : [];
      habitsArray.push(testHabit);

      await AsyncStorage.setItem('@inzone_habits', JSON.stringify(habitsArray));
      append(`Created old habit with 5-day streak, last completed 5 days ago (should reset to 0)`);
      await loadHabits();
    } catch (error) {
      append(`Error creating old habit: ${error}`);
    }
  };

  const simulateHabitCompletion = async () => {
    try {
      const testHabit = habits.find(h => h.streak === 0 || h.streak === undefined);
      if (!testHabit) {
        append('No habit with 0 streak found to test completion');
        return;
      }

      const today = new Date().toDateString();
      const updatedHabits = habits.map(h => 
        h.id === testHabit.id 
          ? { ...h, streak: (h.streak || 0) + 1, lastCompleted: today }
          : h
      );

      await AsyncStorage.setItem('@inzone_habits', JSON.stringify(updatedHabits));
      append(`Simulated completion for "${testHabit.title}" - streak: ${testHabit.streak || 0} → ${(testHabit.streak || 0) + 1}`);
      await loadHabits();
    } catch (error) {
      append(`Error simulating completion: ${error}`);
    }
  };

  const runStreakLogicTest = async () => {
    append('=== RUNNING STREAK LOGIC TEST ===');
    
    // Test 1: Create a habit completed yesterday (should not reset)
    append('Test 1: Creating habit completed yesterday (should not reset)');
    const yesterdayHabit = {
      id: `yesterday-${Date.now()}`,
      title: 'Yesterday Habit',
      frequency: 'daily',
      targetDays: 7,
      isActive: true,
      streak: 3,
      lastCompleted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toDateString(), // Yesterday
    };

    // Test 2: Create a habit completed 3 days ago (should reset)
    append('Test 2: Creating habit completed 3 days ago (should reset)');
    const oldHabit = {
      id: `old-${Date.now()}`,
      title: 'Old Habit (3 days)',
      frequency: 'daily',
      targetDays: 7,
      isActive: true,
      streak: 4,
      lastCompleted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toDateString(), // 3 days ago
    };

    try {
      const existingHabits = await AsyncStorage.getItem('@inzone_habits');
      const habitsArray = existingHabits ? JSON.parse(existingHabits) : [];
      habitsArray.push(yesterdayHabit, oldHabit);

      await AsyncStorage.setItem('@inzone_habits', JSON.stringify(habitsArray));
      append('Test habits created');
      await loadHabits();

      // Run the streak check
      append('Running streak check...');
      const result = await HabitStreakService.checkAndResetMissedStreaks();
      
      append(`Check results: ${result.habitsResetCount} habits reset`);
      result.resetHabits.forEach(habit => {
        append(`- Reset "${habit.title}" from ${habit.previousStreak} to 0 days`);
      });

      await loadHabits();
      append('=== TEST COMPLETE ===');
    } catch (error) {
      append(`Error in streak logic test: ${error}`);
    }
  };

  useEffect(() => {
    loadHabits();
    append('Habit Streak Test Screen loaded');
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Habit Streak Service Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Habits ({habits.length})</Text>
        {habits.map(habit => (
          <View key={habit.id} style={styles.habitItem}>
            <Text style={styles.habitTitle}>{habit.title}</Text>
            <Text style={styles.habitDetails}>
              Streak: {habit.streak} days | 
              Active: {habit.isActive ? 'Yes' : 'No'} | 
              Last: {habit.lastCompleted || 'Never'}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Test Actions</Text>
        <Button title="Create Test Habit (2-day old streak)" onPress={createTestHabit} />
        <Button title="Create Old Habit (5 days ago)" onPress={createOldHabitForTesting} />
        <Button title="Simulate Habit Completion" onPress={simulateHabitCompletion} />
        <Button title="Clear All Habits" onPress={clearAllHabits} color="#ff4444" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Streak System Tests</Text>
        <Button title="🧪 Run Full Streak Logic Test" onPress={runStreakLogicTest} />
        <Button title="Force Streak Check" onPress={forceStreakCheck} />
        <Button title="Reset Test Habit Manually" onPress={resetTestHabitManually} />
        <Button title="Get Habits Needing Attention" onPress={getHabitsNeedingAttention} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Background & Notifications</Text>
        <Button title="Schedule Midday Reminders" onPress={scheduleReminders} />
        <Button title="Force Background Check" onPress={forceBackgroundCheck} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Log</Text>
        {log.map((entry, index) => (
          <Text key={index} style={styles.logEntry}>{entry}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  habitItem: {
    backgroundColor: '#222',
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
  },
  habitTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  habitDetails: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
  },
  logEntry: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});