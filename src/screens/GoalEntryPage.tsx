import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../config/theme';

interface Goal {
  id: string;
  title: string;
  completed: boolean;
  failed: boolean;
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
}

const GOALS_STORAGE_KEY = '@kigen_goals';

interface GoalEntryPageProps {
  visible?: boolean;
  onClose?: () => void;
  onSave?: () => void;
}

export const GoalEntryPage: React.FC<GoalEntryPageProps> = ({
  onClose,
  onSave,
}) => {
  const navigation = useNavigation();
  const [goalText, setGoalText] = useState('');
  const [loading, setLoading] = useState(false);

  const saveGoal = async () => {
    if (!goalText.trim()) {
      Alert.alert('Error', 'Please enter a goal');
      return;
    }

    setLoading(true);
    try {
      // Load existing goals
      const existingGoals = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
      const goals: Goal[] = existingGoals ? JSON.parse(existingGoals) : [];

      // Create new goal
      const newGoal: Goal = {
        id: Date.now().toString(),
        title: goalText.trim(),
        completed: false,
        failed: false,
        createdAt: new Date().toISOString(),
      };

      // Add to goals array
      const updatedGoals = [...goals, newGoal];
      await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(updatedGoals));

      // Clear input
      setGoalText('');
      
      // Navigate back to previous screen
      navigation.goBack();
      
      Alert.alert('Success', 'Goal added successfully!');
    } catch (error) {
      console.error('Error saving goal:', error);
      Alert.alert('Error', 'Failed to save goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Goal</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.inputSection}>
          <Text style={styles.label}>What&apos;s your goal?</Text>
          <TextInput
            style={styles.textInput}
            value={goalText}
            onChangeText={setGoalText}
            placeholder="Enter your goal here..."
            placeholderTextColor={theme.colors.text.secondary}
            multiline
            maxLength={200}
          />
          
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={saveGoal}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Goal'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Goal Setting Tips</Text>
          <Text style={styles.tipsText}>
            • Make your goal specific and measurable{'\n'}
            • Set a realistic timeline{'\n'}
            • Break large goals into smaller milestones{'\n'}
            • Review your progress regularly
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    padding: theme.spacing.sm,
    width: 40,
  },
  closeButtonText: {
    color: theme.colors.text.secondary,
    fontSize: 18,
    fontWeight: '600',
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.text.disabled,
  },
  saveButtonText: {
    ...theme.typography.body,
    color: theme.colors.background,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    color: theme.colors.text.primary,
    fontSize: 17,
    marginBottom: theme.spacing.lg,
    minHeight: 120,
    padding: theme.spacing.lg,
    textAlignVertical: 'top',
  },
  tipsSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
  tipsText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  tipsTitle: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
});