import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Modal,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../config/theme';
import { Card } from '../components/UI';

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

interface GoalsHistoryScreenProps {
  visible?: boolean;
  onClose?: () => void;
}

export const GoalsHistoryScreen: React.FC<GoalsHistoryScreenProps> = ({
  visible = true,
  onClose,
}) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoals();
  }, []);

  const visibleRef = useRef(visible);
  const onCloseRef = useRef(onClose);

  // Update refs when props change
  useEffect(() => {
    visibleRef.current = visible;
    onCloseRef.current = onClose;
  }, [visible, onClose]);

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      if (!visibleRef.current || !onCloseRef.current) return false;

      console.log('📱 Hardware back button pressed in GoalsHistoryScreen');
      onCloseRef.current();
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
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

  const completedGoals = goals.filter(g => g.completed);
  const failedGoals = goals.filter(g => g.failed);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading goals history...</Text>
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
          {/* Goals History Content */}
          <View style={styles.content}>
            <View style={styles.contentHeader}>
              <Text style={styles.title}>Goals History</Text>
              <Text style={styles.subtitle}>Your completed and failed goals</Text>
            </View>
          </View>

          {/* Stats */}
          <Card style={styles.statsCard}>
            <View style={styles.statsRow}>
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
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{completedGoals.length + failedGoals.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </Card>

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
                    <Text style={styles.smallDeleteText}>×</Text>
                  </TouchableOpacity>
                </Card>
              ))}
            </>
          )}

          {/* Empty State */}
          {(completedGoals.length === 0 && failedGoals.length === 0) && (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Goals History</Text>
              <Text style={styles.emptyText}>
                Your completed and failed goals will appear here.
              </Text>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  closeButtonText: {
    ...theme.typography.body,
    color: '#888691',
    fontWeight: '600',
  },
  completedCard: {
    borderLeftColor: theme.colors.success,
    borderLeftWidth: 4,
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
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  emptyCard: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    padding: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  failedCard: {
    borderLeftColor: theme.colors.danger,
    borderLeftWidth: 4,
  },
  failedTitle: {
    color: theme.colors.danger,
  },
  goalCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  goalDate: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
    marginTop: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  goalHeader: {
    flex: 1,
  },
  goalTitle: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    fontWeight: '600',
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  placeholder: {
    width: 60, // Same width as close button area
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  smallDeleteButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.danger,
    borderRadius: theme.borderRadius.sm,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  smallDeleteText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statDivider: {
    backgroundColor: theme.colors.border,
    height: 40,
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
    color: theme.colors.text.primary,
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