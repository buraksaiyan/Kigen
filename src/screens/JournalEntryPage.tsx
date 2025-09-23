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
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { journalStorage, JournalEntry } from '../services/journalStorage';
import { UserStatsService } from '../services/userStatsService';
import { theme } from '../config/theme';

const JOURNAL_DRAFTS_KEY = '@kigen_journal_drafts';

interface JournalDraft {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface JournalEntryPageProps {
  visible?: boolean;
  onClose?: () => void;
  onSave?: () => void;
}

export const JournalEntryPage: React.FC<JournalEntryPageProps> = ({
  visible = true,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<JournalDraft[]>([]);
  const [showDraftMenu, setShowDraftMenu] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadDrafts();
    }
  }, [visible]);

  // Auto-save as draft every 5 seconds if there's content
  useEffect(() => {
    if (!visible || (!title.trim() && !content.trim())) return;

    const autoSaveTimer = setInterval(() => {
      saveAsDraft(true); // silent auto-save
    }, 5000);

    return () => clearInterval(autoSaveTimer);
  }, [title, content, visible]);

  const loadDrafts = async () => {
    try {
      const draftsData = await AsyncStorage.getItem(JOURNAL_DRAFTS_KEY);
      if (draftsData) {
        const parsedDrafts = JSON.parse(draftsData);
        setDrafts(parsedDrafts);
        
        // If there's a recent draft, load it
        if (parsedDrafts.length > 0 && !title && !content) {
          const latestDraft = parsedDrafts[0];
          setTitle(latestDraft.title);
          setContent(latestDraft.content);
          setCurrentDraftId(latestDraft.id);
        }
      }
    } catch (error) {
      console.error('Error loading drafts:', error);
    }
  };

  const saveAsDraft = async (silent = false) => {
    if (!title.trim() && !content.trim()) return;

    try {
      const draft: JournalDraft = {
        id: currentDraftId || Date.now().toString(),
        title: title.trim() || `Draft - ${new Date().toLocaleDateString()}`,
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };

      // Remove existing draft with same ID if updating
      const updatedDrafts = drafts.filter(d => d.id !== draft.id);
      updatedDrafts.unshift(draft); // Add to beginning

      // Keep only latest 5 drafts
      const trimmedDrafts = updatedDrafts.slice(0, 5);
      
      await AsyncStorage.setItem(JOURNAL_DRAFTS_KEY, JSON.stringify(trimmedDrafts));
      setDrafts(trimmedDrafts);
      setCurrentDraftId(draft.id);

      if (!silent) {
        Alert.alert('Draft Saved', 'Your entry has been saved as a draft');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      if (!silent) {
        Alert.alert('Error', 'Failed to save draft');
      }
    }
  };

  const saveEntry = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Error', 'Please write something for your journal entry');
      return;
    }

    setLoading(true);
    try {
      // Include title in content if provided
      const fullContent = title.trim() 
        ? `${title.trim()}\n\n${content.trim()}`
        : content.trim();

      await journalStorage.addEntry(fullContent);

      // Remove current draft if it exists
      if (currentDraftId) {
        const updatedDrafts = drafts.filter(d => d.id !== currentDraftId);
        await AsyncStorage.setItem(JOURNAL_DRAFTS_KEY, JSON.stringify(updatedDrafts));
        setDrafts(updatedDrafts);
      }

      // Clear form
      setTitle('');
      setContent('');
      setCurrentDraftId(null);
      
      onSave?.();
      Alert.alert('Success', 'Journal entry saved!');
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save journal entry');
    } finally {
      setLoading(false);
    }
  };

  const loadDraft = (draft: JournalDraft) => {
    setTitle(draft.title);
    setContent(draft.content);
    setCurrentDraftId(draft.id);
    setShowDraftMenu(false);
  };

  const deleteDraft = async (draftId: string) => {
    try {
      const updatedDrafts = drafts.filter(d => d.id !== draftId);
      await AsyncStorage.setItem(JOURNAL_DRAFTS_KEY, JSON.stringify(updatedDrafts));
      setDrafts(updatedDrafts);
      
      if (currentDraftId === draftId) {
        setCurrentDraftId(null);
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  const handleClose = () => {
    if (title.trim() || content.trim()) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Would you like to save as draft before closing?',
        [
          { text: 'Discard', style: 'destructive', onPress: onClose },
          { text: 'Save as Draft', onPress: () => { saveAsDraft(); onClose?.(); } },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      onClose?.();
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Journal Entry</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowDraftMenu(!showDraftMenu)}
            style={styles.draftButton}
          >
            <Text style={styles.draftButtonText}>📝</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={saveEntry}
            disabled={loading}
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDraftMenu && (
        <View style={styles.draftMenu}>
          <View style={styles.draftMenuHeader}>
            <Text style={styles.draftMenuTitle}>Drafts & Actions</Text>
          </View>
          <TouchableOpacity onPress={() => { saveAsDraft(); setShowDraftMenu(false); }} style={styles.draftMenuItem}>
            <Text style={styles.draftMenuItemText}>💾 Save as Draft</Text>
          </TouchableOpacity>
          {drafts.length > 0 && (
            <>
              <View style={styles.draftMenuDivider} />
              {drafts.map((draft) => (
                <View key={draft.id} style={styles.draftItem}>
                  <TouchableOpacity onPress={() => loadDraft(draft)} style={styles.draftItemContent}>
                    <Text style={styles.draftItemTitle}>{draft.title}</Text>
                    <Text style={styles.draftItemDate}>
                      {new Date(draft.createdAt).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteDraft(draft.id)} style={styles.draftDeleteButton}>
                    <Text style={styles.draftDeleteText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.inputSection}>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Entry title (optional)"
            placeholderTextColor={theme.colors.text.secondary}
            maxLength={100}
          />
          
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="What's on your mind today?"
            placeholderTextColor={theme.colors.text.secondary}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.statsText}>
            Words: {content.trim().split(/\s+/).filter(word => word.length > 0).length}
          </Text>
          {currentDraftId && (
            <Text style={styles.draftIndicator}>📝 Auto-saving as draft</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  closeButtonText: {
    color: theme.colors.text.secondary,
    fontSize: 18,
    fontWeight: '600',
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: theme.spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  draftButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  draftButtonText: {
    fontSize: 18,
  },
  saveButton: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.text.disabled,
  },
  saveButtonText: {
    color: theme.colors.background,
    fontWeight: '600',
    fontSize: 16,
  },
  draftMenu: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    maxHeight: 300,
  },
  draftMenuHeader: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  draftMenuTitle: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  draftMenuItem: {
    padding: theme.spacing.md,
  },
  draftMenuItemText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
  },
  draftMenuDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  draftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  draftItemContent: {
    flex: 1,
  },
  draftItemTitle: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  draftItemDate: {
    ...theme.typography.small,
    color: theme.colors.text.secondary,
  },
  draftDeleteButton: {
    padding: theme.spacing.sm,
  },
  draftDeleteText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
  },
  inputSection: {
    flex: 1,
  },
  titleInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  contentInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    color: theme.colors.text.primary,
    fontSize: 17,
    minHeight: 300,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statsText: {
    ...theme.typography.small,
    color: theme.colors.text.secondary,
  },
  draftIndicator: {
    ...theme.typography.small,
    color: theme.colors.secondary,
    fontStyle: 'italic',
  },
});