import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../config/theme';
import { Card } from '../components/UI';

const GOALS_STORAGE_KEY = '@kigen_goals';

interface Goal {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  failed: boolean;
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
}

interface FocusMode {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  description: string;
}

interface GoalSelectionScreenProps {
  visible: boolean;
  onClose: () => void;
  mode: FocusMode;
  onGoalSelected: (goal: Goal) => void;
  onCreateGoal: () => void;
}

export const GoalSelectionScreen: React.FC<GoalSelectionScreenProps> = ({
  visible,
  onClose,
  mode,
  onGoalSelected,
  onCreateGoal,
}) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadGoals();
    }
  }, [visible]);

  const loadGoals = async () => {
    setLoading(true);
    try {
      // Load real goals from AsyncStorage
      const stored = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
      if (stored) {
        const allGoals: Goal[] = JSON.parse(stored);
        // Filter to only show active goals (not completed or failed)
        const activeGoals = allGoals.filter(goal => !goal.completed && !goal.failed);
        console.log(`Loaded ${activeGoals.length} active goals for executioner mode`);
        setGoals(activeGoals);
      } else {
        console.log('No goals found in storage');
        setGoals([]);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGoalSelect = (goal: Goal) => {
    console.log('Goal selected:', goal.title);
    Alert.alert(
      'Start Executioner Focus',
      `Focus on: "${goal.title}"\n\nThis will help you tackle this goal with maximum intensity and discipline.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Start Focus',
          onPress: () => onGoalSelected(goal),
          style: 'default',
        },
      ]
    );
  };

  const handleNoGoals = () => {
    Alert.alert(
      'No Active Goals',
      'You need to create a goal first to use Executioner Focus mode. This mode is designed to help you tackle specific goals with maximum intensity.',
      [
        {
          text: 'Close',
          style: 'cancel',
          onPress: onClose,
        },
        {
          text: 'Create Goal',
          onPress: () => {
            onClose();
            onCreateGoal();
          },
          style: 'default',
        },
      ]
    );
  };

  useEffect(() => {
  let timeoutId: ReturnType<typeof globalThis.setTimeout>;
    
    if (visible && !loading) {
      // Only show no goals alert if we're sure there are no goals and loading is complete
    timeoutId = globalThis.setTimeout(() => {
        if (goals.length === 0 && !loading) {
          console.log('No active goals found, showing create goal prompt');
          handleNoGoals();
        }
      }, 1000); // Increased delay to ensure loading completes
    }

    return () => {
      if (timeoutId) {
        globalThis.clearTimeout(timeoutId);
      }
    };
  }, [goals.length, visible, loading]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.contentHeader}>
              <View style={[styles.modeIndicator, { backgroundColor: mode.color }]} />
              <Text style={[styles.title, { color: mode.color }]}>{mode.title}</Text>
              <Text style={styles.subtitle}>Select a goal to focus on with maximum intensity</Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading your goals...</Text>
              </View>
            ) : goals.length > 0 ? (
              <View style={styles.goalsContainer}>
                {goals.map((goal) => (
                  <TouchableOpacity
                    key={goal.id}
                    onPress={() => handleGoalSelect(goal)}
                    activeOpacity={0.7}
                  >
                    <Card style={[styles.goalCard, { borderColor: mode.color }]}>
                      <View style={styles.goalContent}>
                        <View style={styles.goalHeader}>
                          <Text style={[styles.goalTitle, { color: mode.color }]}>
                            {goal.title}
                          </Text>
                          <View style={[styles.goalBadge, { backgroundColor: `${mode.color}20` }]}>
                            <Text style={[styles.goalBadgeText, { color: mode.color }]}>
                              ACTIVE
                            </Text>
                          </View>
                        </View>
                        {goal.description && (
                          <Text style={styles.goalDescription}>{goal.description}</Text>
                        )}
                        <View style={styles.goalFooter}>
                          <Text style={styles.goalDate}>
                            Created {new Date(goal.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                ))}

                {/* Create New Goal Button */}
                <TouchableOpacity
                  style={[styles.createGoalButton, { borderColor: mode.color }]}
                  onPress={() => {
                    onClose();
                    onCreateGoal();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.createGoalText, { color: mode.color }]}>
                    + Create New Goal
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No Active Goals</Text>
                <Text style={styles.emptyStateText}>
                  Create a goal first to use Executioner Focus mode.
                  This mode helps you tackle specific goals with maximum intensity.
                </Text>
                <TouchableOpacity
                  style={[styles.createFirstGoalButton, { backgroundColor: mode.color }]}
                  onPress={() => {
                    onClose();
                    onCreateGoal();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.createFirstGoalText}>Create Your First Goal</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Info Card */}
            <Card style={styles.infoCard}>
              <Text style={styles.infoTitle}>🎯 Executioner Focus</Text>
              <Text style={styles.infoText}>
                This mode is designed for high-intensity goal execution. Select a specific goal you want to tackle with maximum focus and discipline.
              </Text>
              <Text style={styles.infoText}>
                • Laser focus on a single objective{'\n'}
                • Time pressure creates urgency{'\n'}
                • Maximum productivity mindset{'\n'}
                • Track goal completion
              </Text>
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    ...theme.typography.body,
    color: '#888691',
    fontWeight: '600',
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  contentHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  createFirstGoalButton: {
    borderRadius: theme.borderRadius.md,
    elevation: 5,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  createFirstGoalText: {
    ...theme.typography.bodyLarge,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  createGoalButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.md,
    borderStyle: 'dashed',
    borderWidth: 2,
    paddingVertical: theme.spacing.lg,
  },
  createGoalText: {
    ...theme.typography.bodyLarge,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  emptyStateText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  emptyStateTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  goalBadge: {
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  goalBadgeText: {
    ...theme.typography.caption,
    fontSize: 10,
    fontWeight: '700',
  },
  goalCard: {
    borderWidth: 2,
  },
  goalContent: {
    padding: theme.spacing.md,
  },
  goalDate: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
  },
  goalDescription: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  goalFooter: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    paddingTop: theme.spacing.sm,
  },
  goalHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  goalTitle: {
    ...theme.typography.h3,
    flex: 1,
    fontWeight: '700',
    marginRight: theme.spacing.sm,
  },
  goalsContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
  },
  infoText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  infoTitle: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modeIndicator: {
    borderRadius: 2,
    height: 40,
    marginBottom: theme.spacing.md,
    width: 4,
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  title: {
    ...theme.typography.h2,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
});
