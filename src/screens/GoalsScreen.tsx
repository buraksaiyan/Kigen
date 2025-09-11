import React, { useState, useEffect } from 'react';
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
import { KigenKanjiBackground } from '../components/KigenKanjiBackground';
import { KigenLogo } from '../components/KigenLogo';

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
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({
  visible = true,
  onClose,
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
      id: Date.now().toString(),
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
            const updated = goals.map(goal =>
              goal.id === goalId
                ? {
                    ...goal,
                    completed: true,
                    failed: false,
                    completedAt: new Date().toISOString(),
                  }
                : goal
            );
            setGoals(updated);
            await saveGoals(updated);
            
            // Record goal completion in rating system
            await UserStatsService.recordGoalCompletion();
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
        <KigenKanjiBackground />
        
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <KigenLogo size="small" variant="image" showJapanese={false} />
          </View>
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
                <Text style={[styles.statNumber, { color: theme.colors.success }]}>
                  {completedGoals.length}
                </Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.colors.danger }]}>
                  {failedGoals.length}
                </Text>
                <Text style={styles.statLabel}>Failed</Text>
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

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Completed Goals ({completedGoals.length})</Text>
              {completedGoals.map(goal => (
                <Card key={goal.id} style={[styles.goalCard, styles.completedCard] as any}>
                  <View style={styles.goalHeader}>
                    <Text style={[styles.goalTitle, styles.completedTitle]}>
                      [COMPLETED] {goal.title}
                    </Text>
                    <Text style={styles.goalDate}>
                      Completed {goal.completedAt ? formatDate(goal.completedAt) : 'Unknown'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteGoal(goal.id)}
                    style={styles.smallDeleteButton}
                  >
                    <Text style={styles.smallDeleteText}>×</Text>
                  </TouchableOpacity>
                </Card>
              ))}
            </>
          )}

          {/* Failed Goals */}
          {failedGoals.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Failed Goals ({failedGoals.length})</Text>
              {failedGoals.map(goal => (
                <Card key={goal.id} style={[styles.goalCard, styles.failedCard] as any}>
                  <View style={styles.goalHeader}>
                    <Text style={[styles.goalTitle, styles.failedTitle]}>
                      [FAILED] {goal.title}
                    </Text>
                    <Text style={styles.goalDate}>
                      Failed {goal.failedAt ? formatDate(goal.failedAt) : 'Unknown'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteGoal(goal.id)}
                    style={styles.smallDeleteButton}
                  >
                    <Text style={styles.smallDeleteText}>×</Text>
                  </TouchableOpacity>
                </Card>
              ))}
            </>
          )}

          {/* Empty State */}
          {goals.length === 0 && (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Goals Yet</Text>
              <Text style={styles.emptyText}>
                Start adding discipline goals from the main screen!
              </Text>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  header: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  contentHeader: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  statsCard: {
    marginBottom: theme.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
  },
  statNumber: {
    ...theme.typography.h3,
    color: '#888691',
    fontWeight: '700',
  },
  statLabel: {
    ...theme.typography.small,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginVertical: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  goalCard: {
    marginBottom: theme.spacing.md,
  },
  completedCard: {
    backgroundColor: theme.colors.surfaceSecondary,
    opacity: 0.8,
  },
  failedCard: {
    backgroundColor: theme.colors.surfaceSecondary,
    opacity: 0.7,
  },
  goalHeader: {
    marginBottom: theme.spacing.md,
  },
  goalTitle: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  completedTitle: {
    color: theme.colors.success,
    textDecorationLine: 'line-through',
  },
  failedTitle: {
    color: theme.colors.danger,
    textDecorationLine: 'line-through',
  },
  goalDate: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
  },
  goalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    minWidth: 50,
  },
  smallDeleteButton: {
    position: 'absolute',
    right: theme.spacing.sm,
    top: theme.spacing.sm,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 16,
  },
  smallDeleteText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  addGoalCard: {
    marginBottom: theme.spacing.lg,
  },
  addGoalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  goalInput: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  addGoalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  cancelButton: {
    flex: 1,
  },
  addButton: {
    flex: 1,
  },
  addGoalPrompt: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  promptTitle: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  promptButton: {
    minWidth: 120,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
});
