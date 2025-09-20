import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../config/theme';
import { UserStatsService } from '../services/userStatsService';
import { Button, Card } from '../components/UI';
import { generateUniqueId } from '../utils/uniqueId';

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

interface GoalsScreenProps {
  visible?: boolean;
  onClose?: () => void;
  onGoalComplete?: () => void;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({
  visible = true,
  onClose,
  onGoalComplete,
}) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [showAddGoal, setShowAddGoal] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const stored = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
      if (stored) {
        setGoals(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGoals = async (goalsToSave: Goal[]) => {
    try {
      await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goalsToSave));
    } catch (error) {
      console.error('Error saving goals:', error);
    }
  };

  const addGoal = async () => {
    if (!newGoalTitle.trim()) return;

    const newGoal: Goal = {
      id: generateUniqueId(),
      title: newGoalTitle.trim(),
      completed: false,
      failed: false,
      createdAt: new Date().toISOString(),
    };

    const updatedGoals = [newGoal, ...goals];
    setGoals(updatedGoals);
    await saveGoals(updatedGoals);
    setNewGoalTitle('');
    setShowAddGoal(false);
  };

  const markComplete = async (goalId: string) => {
    Alert.alert(
      'Mark as Complete?',
      'This goal will be marked as successfully completed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            const goal = goals.find(g => g.id === goalId);
            const updated = goals.map(g =>
              g.id === goalId
                ? {
                    ...g,
                    completed: true,
                    failed: false,
                    completedAt: new Date().toISOString(),
                  }
                : g
            );
            setGoals(updated);
            await saveGoals(updated);
            
            // Record goal completion in rating system
            await UserStatsService.recordGoalCompletion();
            
            // Log goal completion for stats display
            if (goal) {
              const { focusSessionService } = await import('../services/FocusSessionService');
              await focusSessionService.saveGoalCompletionLog(goal.title);
            }
            
            // Notify parent component to refresh stats
            onGoalComplete?.();
          },
        },
      ]
    );
  };

  const markFailed = async (goalId: string) => {
    Alert.alert(
      'Mark as Failed?',
      'This goal will be marked as failed. You can try again later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Failed',
          style: 'destructive',
          onPress: async () => {
            const updated = goals.map(goal =>
              goal.id === goalId
                ? {
                    ...goal,
                    failed: true,
                    completed: false,
                    failedAt: new Date().toISOString(),
                  }
                : goal
            );
            setGoals(updated);
            await saveGoals(updated);
          },
        },
      ]
    );
  };

  const deleteGoal = async (goalId: string) => {
    Alert.alert(
      'Delete Goal?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = goals.filter(goal => goal.id !== goalId);
            setGoals(updated);
            await saveGoals(updated);
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activeGoals = goals.filter(g => !g.completed && !g.failed);
  const completedGoals = goals.filter(g => g.completed);
  const failedGoals = goals.filter(g => g.failed);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading goals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Goals Content */}
          <View style={styles.content}>
            <View style={styles.contentHeader}>
              <Text style={styles.title}>Your Goals</Text>
              <Text style={styles.subtitle}>Track your discipline journey</Text>
            </View>
          </View>

          {/* Stats */}
          <Card style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{activeGoals.length}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{completedGoals.length + failedGoals.length}</Text>
                <Text style={styles.statLabel}>History</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{goals.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </Card>

          {/* Add Goal Section */}
          {showAddGoal ? (
            <Card style={styles.addGoalCard}>
              <Text style={styles.addGoalTitle}>Add New Goal</Text>
              <TextInput
                style={styles.goalInput}
                value={newGoalTitle}
                onChangeText={setNewGoalTitle}
                placeholder="What discipline goal do you want to achieve?"
                placeholderTextColor={theme.colors.text.tertiary}
                autoFocus
              />
              <View style={styles.addGoalActions}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setShowAddGoal(false);
                    setNewGoalTitle('');
                  }}
                  variant="outline"
                  size="small"
                  style={styles.cancelButton}
                />
                <Button
                  title="Add Goal"
                  onPress={addGoal}
                  size="small"
                  style={styles.addButton}
                  disabled={!newGoalTitle.trim()}
                />
              </View>
            </Card>
          ) : (
            <Card style={styles.addGoalPrompt}>
              <Text style={styles.promptTitle}>Ready to set a new goal?</Text>
              <Button
                title="Add Goal"
                onPress={() => setShowAddGoal(true)}
                style={styles.promptButton}
              />
            </Card>
          )}

          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Active Goals ({activeGoals.length})</Text>
              {activeGoals.map(goal => (
                <Card key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <Text style={styles.goalDate}>
                      Created {formatDate(goal.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.goalActions}>
                    <Button
                      title="Complete"
                      onPress={() => markComplete(goal.id)}
                      size="small"
                      style={[styles.actionButton, { backgroundColor: theme.colors.success }] as any}
                    />
                    <Button
                      title="Failed"
                      onPress={() => markFailed(goal.id)}
                      variant="outline"
                      size="small"
                      style={styles.actionButton}
                    />
                    <Button
                      title="Delete"
                      onPress={() => deleteGoal(goal.id)}
                      variant="outline"
                      size="small"
                      style={styles.deleteButton}
                    />
                  </View>
                </Card>
              ))}
            </>
          )}

          {/* Empty State */}
          {activeGoals.length === 0 && (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Active Goals</Text>
              <Text style={styles.emptyText}>
                Start adding discipline goals to track your progress!
              </Text>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  addButton: {
    flex: 1,
  },
  addGoalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  addGoalCard: {
    marginBottom: theme.spacing.lg,
  },
  addGoalPrompt: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  addGoalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  completedCard: {
    backgroundColor: theme.colors.surfaceSecondary,
    opacity: 0.8,
  },
  completedTitle: {
    color: theme.colors.success,
    textDecorationLine: 'line-through',
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
  },
  contentHeader: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  deleteButton: {
    minWidth: 50,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  failedCard: {
    backgroundColor: theme.colors.surfaceSecondary,
    opacity: 0.7,
  },
  failedTitle: {
    color: theme.colors.danger,
    textDecorationLine: 'line-through',
  },
  goalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  goalCard: {
    marginBottom: theme.spacing.md,
  },
  goalDate: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
  },
  goalHeader: {
    marginBottom: theme.spacing.md,
  },
  goalInput: {
    ...theme.typography.body,
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  goalTitle: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  header: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  logoContainer: {
    alignItems: 'center',
    flex: 1,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  placeholder: {
    width: 60,
  },
  promptButton: {
    minWidth: 120,
  },
  promptTitle: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    marginVertical: theme.spacing.lg,
  },
  smallDeleteButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: theme.spacing.sm,
    top: theme.spacing.sm,
    width: 32,
  },
  smallDeleteText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  statDivider: {
    backgroundColor: theme.colors.border,
    height: 30,
    width: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    ...theme.typography.small,
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
    marginTop: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  statNumber: {
    ...theme.typography.h3,
    color: '#888691',
    fontWeight: '700',
  },
  statsCard: {
    marginBottom: theme.spacing.lg,
  },
  statsRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
});
