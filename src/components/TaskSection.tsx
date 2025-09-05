import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../config/theme';
import { Card } from './UI';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
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
  
  const slideAnim = React.useRef(new Animated.Value(0)).current;

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

  const loadTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
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
      createdAt: new Date().toISOString(),
    };

    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
    setNewTaskTitle('');
  };

  const toggleTask = async (taskId: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
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
  };

  const exitFocusMode = () => {
    setFocusMode(false);
    setFocusTask(null);
  };

  const completeFocusTask = async () => {
    if (focusTask) {
      await toggleTask(focusTask.id);
      exitFocusMode();
    }
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  const opacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  if (focusMode && focusTask) {
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
        <Card style={styles.focusCard}>
          <View style={styles.focusHeader}>
            <Text style={styles.focusTitle}>⚡ Focus Mode</Text>
            <TouchableOpacity onPress={exitFocusMode} style={styles.exitButton}>
              <Text style={styles.exitButtonText}>Exit</Text>
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
              <Text style={styles.completeButtonText}>✓ Mark Complete</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </Animated.View>
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
      <Card style={styles.taskCard}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>⚡ Discipline Tasks</Text>
            <Text style={styles.subtitle}>Build focus through intentional action</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>
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

        {/* Add New Task */}
        <View style={styles.inputSection}>
          <TextInput
            style={styles.taskInput}
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            placeholder="Add a discipline task..."
            placeholderTextColor={theme.colors.text.tertiary}
            onSubmitEditing={addTask}
          />
          <TouchableOpacity
            style={[styles.addButton, !newTaskTitle.trim() && styles.addButtonDisabled]}
            onPress={addTask}
            disabled={!newTaskTitle.trim()}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Tasks List */}
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
                    <Text style={styles.checkboxEmpty}>○</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  
                  <View style={styles.taskActions}>
                    <TouchableOpacity
                      style={styles.focusButton}
                      onPress={() => startFocusMode(task)}
                    >
                      <Text style={styles.focusButtonText}>⚡</Text>
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
                    <Text style={styles.checkboxChecked}>✓</Text>
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
              Add your first discipline task to start building focus! ⚡
            </Text>
          )}
        </ScrollView>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  taskCard: {
    margin: 0,
    borderRadius: 0,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    maxHeight: '85%',
    backgroundColor: theme.colors.surface,
  },
  focusCard: {
    margin: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    color: theme.colors.text.secondary,
    fontWeight: '300',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...theme.typography.h4,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  statLabel: {
    ...theme.typography.small,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: theme.spacing.xs,
  },
  inputSection: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  taskInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    fontWeight: '300',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  completedTaskItem: {
    opacity: 0.7,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxEmpty: {
    fontSize: 18,
    color: theme.colors.text.tertiary,
  },
  checkboxChecked: {
    fontSize: 16,
    color: theme.colors.success,
  },
  taskTitle: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text.primary,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: theme.colors.text.secondary,
  },
  taskActions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  focusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusButtonText: {
    fontSize: 14,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontWeight: '300',
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: theme.spacing.lg,
  },
  // Focus Mode Styles
  focusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  focusTitle: {
    ...theme.typography.h2,
    color: theme.colors.primary,
  },
  exitButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.borderRadius.md,
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
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  focusSubtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  focusActions: {
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  completeButtonText: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
});
