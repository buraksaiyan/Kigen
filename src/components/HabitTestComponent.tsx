import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Habit {
  id: string;
  title: string;
  streak: number;
  completedToday: boolean;
  lastCompleted?: string;
  targetDays?: number;
}

export const HabitTestComponent: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);

  const loadHabits = async () => {
    try {
      const habitsData = await AsyncStorage.getItem('@inzone_habits');
      if (habitsData) {
        const parsedHabits = JSON.parse(habitsData);
        const activeHabits = parsedHabits
          .filter((habit: any) => habit.isActive)
          .map((habit: any) => ({
            id: habit.id,
            title: habit.title,
            streak: habit.streak || 0,
            completedToday: habit.lastCompleted === new Date().toDateString(),
            lastCompleted: habit.lastCompleted,
            targetDays: habit.targetDays || 30
          }));
        setHabits(activeHabits);
        console.log('Loaded habits:', activeHabits);
      }
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  };

  const toggleHabit = async (habitId: string) => {
    try {
      const updatedHabits = habits.map(habit => {
        if (habit.id === habitId) {
          const today = new Date().toDateString();
          const wasCompletedToday = habit.lastCompleted === today;

          if (!wasCompletedToday) {
            // First completion today - increase streak
            return {
              ...habit,
              streak: habit.streak + 1,
              lastCompleted: today,
              completedToday: true
            };
          } else {
            // Already completed today - decrease streak
            return {
              ...habit,
              streak: Math.max(0, habit.streak - 1),
              lastCompleted: undefined,
              completedToday: false
            };
          }
        }
        return habit;
      });
      setHabits(updatedHabits);

      // Update in AsyncStorage
      await AsyncStorage.setItem('@inzone_habits', JSON.stringify(updatedHabits));
      console.log('Updated habits:', updatedHabits);
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

  const createTestHabit = async () => {
    try {
      const testHabit = {
        id: Date.now().toString(),
        title: 'Test Habit - Drink Water',
        description: 'Drink 8 glasses of water daily',
        frequency: 'daily',
        targetDays: 21,
        reminderTime: undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
        streak: 0,
      };

      const existingHabits = await AsyncStorage.getItem('@inzone_habits');
      const habitsArray = existingHabits ? JSON.parse(existingHabits) : [];
      habitsArray.push(testHabit);

      await AsyncStorage.setItem('@inzone_habits', JSON.stringify(habitsArray));
      console.log('Created test habit:', testHabit);
      loadHabits(); // Reload habits
    } catch (error) {
      console.error('Error creating test habit:', error);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Habit Test Component</Text>

      <TouchableOpacity style={styles.button} onPress={createTestHabit}>
        <Text style={styles.buttonText}>Create Test Habit</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={loadHabits}>
        <Text style={styles.buttonText}>Reload Habits</Text>
      </TouchableOpacity>

      {habits.length === 0 ? (
        <Text style={styles.noHabits}>No habits found. Create one first.</Text>
      ) : (
        habits.map(habit => (
          <View key={habit.id} style={styles.habitItem}>
            <Text style={styles.habitTitle}>{habit.title}</Text>
            <Text style={styles.habitStreak}>
              Streak: {habit.streak} of {habit.targetDays} days
            </Text>
            <Text style={styles.habitStatus}>
              Completed Today: {habit.completedToday ? 'Yes' : 'No'}
            </Text>
            <TouchableOpacity
              style={[styles.toggleButton, habit.completedToday && styles.completedButton]}
              onPress={() => toggleHabit(habit.id)}
            >
              <Text style={styles.toggleButtonText}>
                {habit.completedToday ? 'Mark Incomplete' : 'Mark Complete'}
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  noHabits: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  habitItem: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  habitStreak: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  habitStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  toggleButton: {
    backgroundColor: '#34C759',
    padding: 10,
    borderRadius: 6,
  },
  completedButton: {
    backgroundColor: '#FF3B30',
  },
  toggleButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
  },
});