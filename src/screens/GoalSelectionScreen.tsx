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
import { KigenKanjiBackground } from '../components/KigenKanjiBackground';
import { KigenLogo } from '../components/KigenLogo';

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
    let timeoutId: NodeJS.Timeout;
    
    if (visible && !loading) {
      // Only show no goals alert if we're sure there are no goals and loading is complete
      timeoutId = setTimeout(() => {
        if (goals.length === 0 && !loading) {
          console.log('No active goals found, showing create goal prompt');
          handleNoGoals();
        }
      }, 1000); // Increased delay to ensure loading completes
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [goals.length, visible, loading]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <KigenKanjiBackground />
        
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <KigenLogo size="small" variant="image" showJapanese={false} />
          </View>
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
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  contentHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  modeIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.h2,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontWeight: '700',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  goalsContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  goalCard: {
    borderWidth: 2,
  },
  goalContent: {
    padding: theme.spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  goalTitle: {
    ...theme.typography.h3,
    fontWeight: '700',
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  goalBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  goalBadgeText: {
    ...theme.typography.caption,
    fontWeight: '700',
    fontSize: 10,
  },
  goalDescription: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  goalFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  goalDate: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
  },
  createGoalButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  createGoalText: {
    ...theme.typography.bodyLarge,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  emptyStateTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    fontWeight: '700',
  },
  emptyStateText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  createFirstGoalButton: {
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  createFirstGoalText: {
    ...theme.typography.bodyLarge,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
  },
  infoTitle: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  infoText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
});
