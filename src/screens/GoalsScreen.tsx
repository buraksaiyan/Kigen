import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../config/theme';
import { Button, Card } from '../components/UI';

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

export const GoalsScreen: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

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
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🎯 Your Goals</Text>
            <Text style={styles.subtitle}>Track your discipline journey</Text>
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
                      title="✓ Complete"
                      onPress={() => markComplete(goal.id)}
                      size="small"
                      style={[styles.actionButton, { backgroundColor: theme.colors.success }] as any}
                    />
                    <Button
                      title="✗ Failed"
                      onPress={() => markFailed(goal.id)}
                      variant="outline"
                      size="small"
                      style={styles.actionButton}
                    />
                    <Button
                      title="🗑️"
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
                      ✓ {goal.title}
                    </Text>
                    <Text style={styles.goalDate}>
                      Completed {goal.completedAt ? formatDate(goal.completedAt) : 'Unknown'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteGoal(goal.id)}
                    style={styles.smallDeleteButton}
                  >
                    <Text style={styles.smallDeleteText}>🗑️</Text>
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
                      ✗ {goal.title}
                    </Text>
                    <Text style={styles.goalDate}>
                      Failed {goal.failedAt ? formatDate(goal.failedAt) : 'Unknown'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteGoal(goal.id)}
                    style={styles.smallDeleteButton}
                  >
                    <Text style={styles.smallDeleteText}>🗑️</Text>
                  </TouchableOpacity>
                </Card>
              ))}
            </>
          )}

          {/* Empty State */}
          {goals.length === 0 && (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>🎯 No Goals Yet</Text>
              <Text style={styles.emptyText}>
                Start adding discipline goals from the main screen!
              </Text>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
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
  header: {
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
    color: theme.colors.primary,
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
    fontSize: 14,
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
});
