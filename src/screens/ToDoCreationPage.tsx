import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../config/theme';

const TODOS_STORAGE_KEY = '@kigen_todos';

type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface Todo {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
}

interface ToDoCreationPageProps {
  visible?: boolean;
  onClose?: () => void;
  onSave?: () => void;
}

const priorityConfig = {
  low: { color: '#95A5A6', icon: 'low-priority', label: 'Low' },
  medium: { color: '#F39C12', icon: 'priority-high', label: 'Medium' },
  high: { color: '#E74C3C', icon: 'priority-high', label: 'High' },
  urgent: { color: '#8E44AD', icon: 'warning', label: 'Urgent' },
};

export const ToDoCreationPage: React.FC<ToDoCreationPageProps> = ({
  visible = true,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkboxAnim] = useState(new Animated.Value(0));

  // Checkbox animation for visual feedback
  const animateCheckbox = () => {
    Animated.sequence([
      Animated.timing(checkboxAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(checkboxAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const saveTodo = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    setLoading(true);
    animateCheckbox();

    try {
      const newTodo: Todo = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        completed: false,
        dueDate: dueDate || undefined,
        createdAt: new Date().toISOString(),
      };

      // Load existing todos
      const existingTodos = await AsyncStorage.getItem(TODOS_STORAGE_KEY);
      const todos: Todo[] = existingTodos ? JSON.parse(existingTodos) : [];
      
      // Add new todo (high priority items first)
      if (priority === 'urgent' || priority === 'high') {
        todos.unshift(newTodo);
      } else {
        todos.push(newTodo);
      }
      
      // Save back to storage
      await AsyncStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos));

      // Clear form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      
      onSave?.();
      Alert.alert('Success', 'Task added successfully!');
    } catch (error) {
      console.error('Error saving todo:', error);
      Alert.alert('Error', 'Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  const generateDueDateOptions = (): { label: string; value: string }[] => {
    const options: { label: string; value: string }[] = [];
    const today = new Date();
    
    // Today
    options.push({
      label: 'Today',
      value: today.toISOString().split('T')[0] || '',
    });
    
    // Tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    options.push({
      label: 'Tomorrow',
      value: tomorrow.toISOString().split('T')[0] || '',
    });
    
    // This week
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() + 7);
    options.push({
      label: 'This Week',
      value: thisWeek.toISOString().split('T')[0] || '',
    });
    
    // Next week
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 14);
    options.push({
      label: 'Next Week',
      value: nextWeek.toISOString().split('T')[0] || '',
    });

    return options;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!visible) {
    return null;
  }

  const checkboxScale = checkboxAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const dueDateOptions = generateDueDateOptions();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Task</Text>
        <Animated.View style={[styles.checkboxIcon, { transform: [{ scale: checkboxScale }] }]}>
          <Icon name="check-circle" size={24} color={theme.colors.secondary} />
        </Animated.View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.inputSection}>
          <Text style={styles.label}>Task Title *</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="What needs to be done?"
            placeholderTextColor={theme.colors.text.secondary}
            maxLength={100}
          />
          
          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add more details..."
            placeholderTextColor={theme.colors.text.secondary}
            multiline
            maxLength={300}
          />

          <Text style={styles.label}>Priority Level</Text>
          <View style={styles.priorityOptions}>
            {Object.entries(priorityConfig).map(([key, config]) => (
              <TouchableOpacity
                key={key}
                onPress={() => setPriority(key as Priority)}
                style={[
                  styles.priorityOption,
                  { borderColor: config.color },
                  priority === key && { backgroundColor: config.color + '20' },
                ]}
              >
                <Icon name={config.icon} size={20} color={config.color} />
                <Text style={[styles.priorityOptionText, { color: config.color }]}>
                  {config.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Due Date</Text>
          <View style={styles.dueDateOptions}>
            <TouchableOpacity
              onPress={() => setDueDate('')}
              style={[
                styles.dueDateOption,
                !dueDate && styles.dueDateOptionSelected,
              ]}
            >
              <Text style={[
                styles.dueDateOptionText,
                !dueDate && styles.dueDateOptionTextSelected,
              ]}>
                No due date
              </Text>
            </TouchableOpacity>
            
            {dueDateOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setDueDate(option.value)}
                style={[
                  styles.dueDateOption,
                  dueDate === option.value && styles.dueDateOptionSelected,
                ]}
              >
                <Text style={[
                  styles.dueDateOptionText,
                  dueDate === option.value && styles.dueDateOptionTextSelected,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {dueDate && (
            <View style={styles.dueDatePreview}>
              <Icon name="schedule" size={16} color={theme.colors.secondary} />
              <Text style={styles.dueDatePreviewText}>
                Due: {formatDate(dueDate)}
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: priorityConfig[priority].color },
              loading && styles.saveButtonDisabled,
            ]}
            onPress={saveTodo}
            disabled={loading}
          >
            <Icon name="add-task" size={20} color={theme.colors.background} />
            <Text style={styles.saveButtonText}>
              {loading ? 'Adding...' : 'Add Task'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>✅ Task Management Tips</Text>
          <Text style={styles.tipText}>
            • Use priority levels to organize your tasks effectively
          </Text>
          <Text style={styles.tipText}>
            • High and urgent tasks will appear at the top of your list
          </Text>
          <Text style={styles.tipText}>
            • Set due dates to stay on track with deadlines
          </Text>
          <Text style={styles.tipText}>
            • Break large tasks into smaller, manageable subtasks
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  checkboxIcon: {
    padding: theme.spacing.sm,
  },
  closeButton: {
    padding: theme.spacing.sm,
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
  dueDateOption: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    marginBottom: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  dueDateOptionSelected: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  dueDateOptionText: {
    color: theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  dueDateOptionTextSelected: {
    color: theme.colors.background,
  },
  dueDateOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },
  dueDatePreview: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  dueDatePreviewText: {
    color: theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: theme.spacing.sm,
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
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    flex: 1,
    marginHorizontal: theme.spacing.md,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  priorityOption: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: theme.spacing.xs,
  },
  priorityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.lg,
  },
  saveButton: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: theme.colors.background,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    color: theme.colors.text.primary,
    fontSize: 16,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  tipText: {
    ...theme.typography.small,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  tipsSection: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    padding: theme.spacing.lg,
  },
  tipsTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
});