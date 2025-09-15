import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../config/theme';
import { Card } from './UI';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  failed: boolean;
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
}

interface TaskSectionProps {
  isExpanded: boolean;
  onClose: () => void;
}

const TASKS_STORAGE_KEY = '@kigen_tasks';

export const TaskSection: React.FC<TaskSectionProps> = ({ isExpanded, onClose }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [focusTimer, setFocusTimer] = useState(0); // in seconds
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setIsKeyboardVisible(true);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (isExpanded) {
      loadTasks();
    }
  }, [isExpanded]);

  // Focus timer effect
  useEffect(() => {
    let interval: ReturnType<typeof globalThis.setInterval>;
    if (isTimerActive && focusMode) {
        interval = globalThis.setInterval(() => {
          setFocusTimer(prev => prev + 1);
        }, 1000);
    }
    return () => {
      if (interval) {
        globalThis.clearInterval(interval);
      }
    };
  }, [isTimerActive, focusMode]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const storedTasks = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTasks = async (tasksToSave: Task[]) => {
    try {
      await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasksToSave));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false,
      failed: false,
      createdAt: new Date().toISOString(),
    };

    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
    setNewTaskTitle('');
  };

  const toggleTask = async (taskId: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            completed: !task.completed,
            completedAt: !task.completed ? new Date().toISOString() : undefined
          } 
        : task
    );
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  };

  const markTaskAsFailed = async (taskId: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            failed: true, 
            completed: false,
            failedAt: new Date().toISOString()
          } 
        : task
    );
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  };

  const deleteTask = async (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  };

  const startFocusMode = (task: Task) => {
    setFocusTask(task);
    setFocusMode(true);
    setFocusTimer(0);
    setIsTimerActive(true);
  };

  const exitFocusMode = () => {
    setFocusMode(false);
    setFocusTask(null);
    setIsTimerActive(false);
    setFocusTimer(0);
  };

  const completeFocusTask = async () => {
    if (focusTask) {
      await toggleTask(focusTask.id);
      exitFocusMode();
    }
  };

  const failFocusTask = async () => {
    if (focusTask) {
      Alert.alert(
        'Mark as Failed?',
        'This will mark the task as failed. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Mark Failed', 
            style: 'destructive',
            onPress: async () => {
              await markTaskAsFailed(focusTask.id);
              exitFocusMode();
            }
          }
        ]
      );
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  const opacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const activeTasks = tasks.filter(t => !t.completed && !t.failed);
  const completedTasks = tasks.filter(t => t.completed);
  const failedTasks = tasks.filter(t => t.failed);

  if (focusMode && focusTask) {
    return (
      <View style={styles.focusOverlay}>
        <Card style={styles.focusCard}>
          <View style={styles.focusHeader}>
            <Text style={styles.focusTitle}>Focus Mode</Text>
            <TouchableOpacity onPress={exitFocusMode} style={styles.exitButton}>
              <Text style={styles.exitButtonText}>Exit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.focusTimerContainer}>
            <Text style={styles.focusTimer}>{formatTime(focusTimer)}</Text>
            <TouchableOpacity
              onPress={() => setIsTimerActive(!isTimerActive)}
              style={styles.timerButton}
            >
              <Text style={styles.timerButtonText}>
                {isTimerActive ? 'Pause' : 'Start'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.focusTaskContainer}>
            <Text style={styles.focusTaskTitle}>{focusTask.title}</Text>
            <Text style={styles.focusSubtitle}>
              Stay disciplined. Complete this task without distractions.
            </Text>
          </View>

          <View style={styles.focusActions}>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={completeFocusTask}
            >
              <Text style={styles.completeButtonText}>Mark Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.failButton}
              onPress={failFocusTask}
            >
              <Text style={styles.failButtonText}>Mark Failed</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents={isExpanded ? 'auto' : 'none'}
    >
      <View style={styles.taskCard}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Discipline Tasks</Text>
            <Text style={styles.subtitle}>Build focus through intentional action</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{activeTasks.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completedTasks.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
            </Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
        </View>

        {/* Tasks List */}
        <View style={[styles.contentContainer, { marginBottom: keyboardHeight > 0 ? keyboardHeight + 120 : 0 }]}>
          <ScrollView style={styles.tasksContainer} showsVerticalScrollIndicator={false}>
            {/* Active Tasks */}
            {activeTasks.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Active Tasks</Text>
                {activeTasks.map((task) => (
                  <View key={task.id} style={styles.taskItem}>
                    <TouchableOpacity
                      style={styles.taskCheckbox}
                      onPress={() => toggleTask(task.id)}
                    >
                      <Text style={styles.checkboxEmpty}>[ ]</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    
                    <View style={styles.taskActions}>
                      <TouchableOpacity
                        style={styles.focusButton}
                        onPress={() => startFocusMode(task)}
                      >
                        <Text style={styles.focusButtonText}>Focus</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deleteTask(task.id)}
                      >
                        <Text style={styles.deleteButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: theme.spacing.lg }]}>
                  Completed ({completedTasks.length})
                </Text>
                {completedTasks.slice(0, 5).map((task) => (
                  <View key={task.id} style={[styles.taskItem, styles.completedTaskItem]}>
                    <TouchableOpacity
                      style={styles.taskCheckbox}
                      onPress={() => toggleTask(task.id)}
                    >
                      <Text style={styles.checkboxChecked}>[X]</Text>
                    </TouchableOpacity>
                    
                    <Text style={[styles.taskTitle, styles.completedTaskTitle]}>
                      {task.title}
                    </Text>
                    
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteTask(task.id)}
                    >
                      <Text style={styles.deleteButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}

            {tasks.length === 0 && (
              <Text style={styles.emptyText}>
                Add your first discipline task to start building focus!
              </Text>
            )}
          </ScrollView>
        </View>

        {/* Add New Task - Fixed at bottom with keyboard awareness */}
        <View 
          style={[
            styles.inputSection,
            keyboardHeight > 0 && {
              position: 'absolute',
              bottom: keyboardHeight + 60, // Add space above navigation
              left: 0,
              right: 0,
              backgroundColor: theme.colors.surface,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
            }
          ]}
        >
          <TextInput
            style={styles.taskInput}
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            placeholder="Add a discipline task..."
            placeholderTextColor={theme.colors.text.tertiary}
            onSubmitEditing={addTask}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setNewTaskTitle('');
                onClose(); // Close the task section
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, !newTaskTitle.trim() && styles.addButtonDisabled]}
              onPress={addTask}
              disabled={!newTaskTitle.trim()}
            >
              <Text style={styles.addButtonText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    bottom: 0,
    justifyContent: 'flex-end',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  taskCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 0,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    flex: 1,
    margin: 0,
  },
  contentContainer: {
    flex: 1,
  },
  focusCard: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.primary,
    borderWidth: 2,
    margin: theme.spacing.lg,
  },
  focusOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  header: {
    alignItems: 'flex-start',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  closeText: {
    color: theme.colors.text.secondary,
    fontSize: 20,
    fontWeight: '300',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    ...theme.typography.h4,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  statLabel: {
    ...theme.typography.small,
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
    marginTop: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  inputSection: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    padding: theme.spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.borderRadius.md,
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  cancelButtonText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  taskInput: {
    ...theme.typography.body,
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    color: theme.colors.text.primary,
    padding: theme.spacing.md,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  tasksContainer: {
    flex: 1,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  taskItem: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  completedTaskItem: {
    opacity: 0.7,
  },
  taskCheckbox: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkboxEmpty: {
    color: theme.colors.text.tertiary,
    fontSize: 18,
  },
  checkboxChecked: {
    color: theme.colors.success,
    fontSize: 16,
  },
  taskTitle: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text.primary,
  },
  completedTaskTitle: {
    color: theme.colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  taskActions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  focusButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  focusButtonText: {
    fontSize: 14,
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  deleteButtonText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
    fontWeight: '300',
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  // Focus Mode Styles
  focusHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  focusTitle: {
    ...theme.typography.h2,
    color: theme.colors.primary,
  },
  exitButton: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  exitButtonText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  focusTaskContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  focusTaskTitle: {
    ...theme.typography.h1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  focusSubtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  focusActions: {
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  completeButtonText: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  // New styles for timer and failure
  focusTimerContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  focusTimer: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    fontSize: 48,
    fontWeight: '800',
    marginBottom: theme.spacing.md,
  },
  timerButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  timerButtonText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  failButton: {
    backgroundColor: theme.colors.danger,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  failButtonText: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
});
