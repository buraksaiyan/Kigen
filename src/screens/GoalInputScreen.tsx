import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface GoalInputScreenProps {
  visible: boolean;
  onClose: () => void;
  onSave: (goal: Goal) => void;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  progress: number;
  createdAt: string;
}

export const GoalInputScreen: React.FC<GoalInputScreenProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState('Personal');

  const theme = {
    colors: {
      background: '#000000',
      surface: '#1C1C1E',
      surfaceSecondary: '#2C2C2E',
      primary: '#007AFF',
      success: '#34C759',
      warning: '#FF9500',
      danger: '#FF3B30',
      text: {
        primary: '#FFFFFF',
        secondary: '#8E8E93',
      },
      border: '#38383A',
    },
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', color: theme.colors.success },
    { value: 'medium', label: 'Medium', color: theme.colors.warning },
    { value: 'high', label: 'High', color: theme.colors.danger },
  ];

  const categoryOptions = ['Personal', 'Career', 'Health', 'Finance', 'Learning', 'Social'];

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    if (!targetDate.trim()) {
      Alert.alert('Error', 'Please set a target completion date');
      return;
    }

    const newGoal: Goal = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      targetDate,
      priority,
      category,
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    onSave(newGoal);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTargetDate('');
    setPriority('medium');
    setCategory('Personal');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
              New Goal
            </Text>
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Text style={[styles.saveButtonText, { color: theme.colors.primary }]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                Goal Title *
              </Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text.primary,
                }]}
                value={title}
                onChangeText={setTitle}
                placeholder="What do you want to achieve?"
                placeholderTextColor={theme.colors.text.secondary}
                maxLength={100}
              />
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                Description
              </Text>
              <TextInput
                style={[styles.textAreaInput, { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text.primary,
                }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your goal in detail..."
                placeholderTextColor={theme.colors.text.secondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
            </View>

            {/* Target Date Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                Target Completion Date *
              </Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text.primary,
                }]}
                value={targetDate}
                onChangeText={setTargetDate}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={theme.colors.text.secondary}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            {/* Priority Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                Priority Level
              </Text>
              <View style={styles.priorityContainer}>
                {priorityOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.priorityOption,
                      { 
                        backgroundColor: theme.colors.surface,
                        borderColor: priority === option.value ? option.color : theme.colors.border,
                        borderWidth: priority === option.value ? 2 : 1,
                      }
                    ]}
                    onPress={() => setPriority(option.value as any)}
                  >
                    <View style={[styles.priorityDot, { backgroundColor: option.color }]} />
                    <Text style={[styles.priorityText, { 
                      color: priority === option.value ? theme.colors.text.primary : theme.colors.text.secondary 
                    }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                Category
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScrollView}>
                {categoryOptions.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryOption,
                      { 
                        backgroundColor: category === cat ? theme.colors.primary : theme.colors.surface,
                        borderColor: theme.colors.border,
                      }
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.categoryText, { 
                      color: category === cat ? '#FFFFFF' : theme.colors.text.secondary 
                    }]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Tips Section */}
            <View style={[styles.tipsContainer, { backgroundColor: theme.colors.surface }]}>
              <MaterialIcons name="lightbulb-outline" size={20} color={theme.colors.warning} />
              <View style={styles.tipsContent}>
                <Text style={[styles.tipsTitle, { color: theme.colors.text.primary }]}>
                  Goal Setting Tips
                </Text>
                <Text style={[styles.tipsText, { color: theme.colors.text.secondary }]}>
                  • Make your goal specific and measurable
                  {'\n'}• Set a realistic target date
                  {'\n'}• Break large goals into smaller milestones
                  {'\n'}• Review and update progress regularly
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    height: 120,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryScrollView: {
    flexDirection: 'row',
  },
  categoryOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tipsContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 40,
  },
  tipsContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 12,
    lineHeight: 16,
  },
});