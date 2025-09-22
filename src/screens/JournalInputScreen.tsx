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

interface JournalInputScreenProps {
  visible: boolean;
  onClose: () => void;
  onSave: (entry: JournalEntry) => void;
}

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: string;
  tags: string[];
  createdAt: string;
}

export const JournalInputScreen: React.FC<JournalInputScreenProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [currentTag, setCurrentTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);

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

  const moods = [
    { emoji: '😊', label: 'Happy', color: '#FFD60A' },
    { emoji: '😌', label: 'Peaceful', color: '#30D158' },
    { emoji: '😍', label: 'Excited', color: '#FF6B6B' },
    { emoji: '🤔', label: 'Thoughtful', color: '#5E5CE6' },
    { emoji: '😔', label: 'Sad', color: '#8E8E93' },
    { emoji: '😤', label: 'Frustrated', color: '#FF9F0A' },
    { emoji: '😴', label: 'Tired', color: '#AC8E68' },
    { emoji: '🥰', label: 'Grateful', color: '#FF69B4' },
  ];

  const promptSuggestions = [
    'What made today special?',
    'What am I grateful for?',
    'What challenges did I face?',
    'What did I learn today?',
    'How am I feeling right now?',
    'What are my goals for tomorrow?',
  ];

  const handleSave = () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Error', 'Please write something for your journal entry');
      return;
    }

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      title: title.trim() || `Journal Entry - ${new Date().toLocaleDateString()}`,
      content: content.trim(),
      mood: selectedMood,
      tags,
      createdAt: new Date().toISOString(),
    };

    onSave(newEntry);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setSelectedMood('');
    setCurrentTag('');
    setTags([]);
  };

  const handleClose = () => {
    if (title.trim() || content.trim()) {
      Alert.alert(
        'Discard Entry?',
        'You have unsaved changes. Are you sure you want to discard this entry?',
        [
          { text: 'Keep Writing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => {
            resetForm();
            onClose();
          }},
        ]
      );
    } else {
      resetForm();
      onClose();
    }
  };

  const [menuOpen, setMenuOpen] = useState(false);

  const handleSaveAsDraft = () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Error', 'Please write something for your journal entry');
      return;
    }

    const draftEntry: JournalEntry = {
      id: Date.now().toString(),
      title: title.trim() || `Draft - ${new Date().toLocaleDateString()}`,
      content: content.trim(),
      mood: selectedMood,
      tags,
      createdAt: new Date().toISOString(),
    };

    // Save via onSave but keep the editor open as a draft
    onSave(draftEntry);
    setMenuOpen(false);
    Alert.alert('Saved', 'Entry saved as draft');
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim().toLowerCase()) && tags.length < 5) {
      setTags([...tags, currentTag.trim().toLowerCase()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const usePromptSuggestion = (prompt: string) => {
    if (content.trim()) {
      setContent(content + '\n\n' + prompt + '\n');
    } else {
      setContent(prompt + '\n');
    }
  };

  const getWordCount = () => {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
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
              New Entry
            </Text>
            <View style={styles.headerRight}> 
              <TouchableOpacity onPress={handleSave} style={styles.saveButtonTop}>
                <Text style={[styles.saveButtonText, { color: theme.colors.primary }]}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)} style={styles.menuToggle}>
                <MaterialIcons name={menuOpen ? 'arrow-drop-up' : 'arrow-drop-down'} size={28} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Expandable draft menu (small) */}
          {menuOpen && (
            <View style={[styles.draftMenu, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <TouchableOpacity onPress={handleSaveAsDraft} style={styles.draftMenuItem}>
                <Text style={{ color: theme.colors.text.primary, fontWeight: '600' }}>Save as draft</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Title Input */}
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.titleInput, { 
                  color: theme.colors.text.primary,
                }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Entry title (optional)"
                placeholderTextColor={theme.colors.text.secondary}
                maxLength={100}
              />
            </View>

            {/* Mood Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.sectionLabel, { color: theme.colors.text.primary }]}>
                How are you feeling?
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.moodScrollView}
              >
                {moods.map((mood) => (
                  <TouchableOpacity
                    key={mood.label}
                    style={[
                      styles.moodOption,
                      { 
                        backgroundColor: selectedMood === mood.label ? mood.color + '20' : theme.colors.surface,
                        borderColor: selectedMood === mood.label ? mood.color : theme.colors.border,
                        borderWidth: selectedMood === mood.label ? 2 : 1,
                      }
                    ]}
                    onPress={() => setSelectedMood(selectedMood === mood.label ? '' : mood.label)}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    <Text style={[styles.moodLabel, { 
                      color: selectedMood === mood.label ? theme.colors.text.primary : theme.colors.text.secondary 
                    }]}>
                      {mood.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Writing Prompts */}
            <View style={styles.inputGroup}>
              <Text style={[styles.sectionLabel, { color: theme.colors.text.primary }]}>
                Need inspiration? Try these prompts:
              </Text>
              <View style={styles.promptsContainer}>
                {promptSuggestions.map((prompt, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.promptButton, { backgroundColor: theme.colors.surface }]}
                    onPress={() => usePromptSuggestion(prompt)}
                  >
                    <MaterialIcons name="lightbulb-outline" size={16} color={theme.colors.warning} />
                    <Text style={[styles.promptText, { color: theme.colors.text.secondary }]}>
                      {prompt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Content Input */}
            <View style={styles.inputGroup}>
              <View style={styles.contentHeader}>
                <Text style={[styles.sectionLabel, { color: theme.colors.text.primary }]}>
                  Your thoughts
                </Text>
                <Text style={[styles.wordCount, { color: theme.colors.text.secondary }]}>
                  {getWordCount()} words
                </Text>
              </View>
              <TextInput
                style={[styles.contentInput, { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text.primary,
                }]}
                value={content}
                onChangeText={setContent}
                placeholder="Write about your day, thoughts, feelings, or anything on your mind..."
                placeholderTextColor={theme.colors.text.secondary}
                multiline
                textAlignVertical="top"
                scrollEnabled={false}
              />
            </View>

            {/* Tags Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.sectionLabel, { color: theme.colors.text.primary }]}>
                Tags (optional)
              </Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={[styles.tagInput, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text.primary,
                  }]}
                  value={currentTag}
                  onChangeText={setCurrentTag}
                  placeholder="Add a tag..."
                  placeholderTextColor={theme.colors.text.secondary}
                  onSubmitEditing={addTag}
                  returnKeyType="done"
                  maxLength={20}
                />
                <TouchableOpacity onPress={addTag} style={styles.addTagButton}>
                  <MaterialIcons name="add" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
              
              {tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {tags.map((tag, index) => (
                    <View key={index} style={[styles.tagChip, { backgroundColor: theme.colors.primary }]}>
                      <Text style={styles.tagChipText}>#{tag}</Text>
                      <TouchableOpacity onPress={() => removeTag(tag)}>
                        <MaterialIcons name="close" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Statistics */}
            <View style={[styles.statsContainer, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.statItem}>
                <MaterialIcons name="schedule" size={16} color={theme.colors.text.secondary} />
                <Text style={[styles.statText, { color: theme.colors.text.secondary }]}>
                  {new Date().toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.statItem}>
                <MaterialIcons name="format-list-numbered" size={16} color={theme.colors.text.secondary} />
                <Text style={[styles.statText, { color: theme.colors.text.secondary }]}>
                  {getWordCount()} words
                </Text>
              </View>
              <View style={styles.statItem}>
                <MaterialIcons name="local-offer" size={16} color={theme.colors.text.secondary} />
                <Text style={[styles.statText, { color: theme.colors.text.secondary }]}>
                  {tags.length} tags
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
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  moodScrollView: {
    flexDirection: 'row',
  },
  moodOption: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    minWidth: 80,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  promptsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  promptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 8,
  },
  promptText: {
    fontSize: 13,
    marginLeft: 6,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  wordCount: {
    fontSize: 12,
  },
  contentInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 140,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  addTagButton: {
    padding: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  tagChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 40,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonLarge: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveButtonLargeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveButtonTop: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  menuToggle: {
    padding: 4,
  },
  draftMenu: {
    position: 'relative',
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  draftMenuItem: {
    padding: 12,
  },
});