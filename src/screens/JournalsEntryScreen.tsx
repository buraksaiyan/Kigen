import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { journalStorage } from '../services/journalStorage';
import { useNavigation } from '@react-navigation/native';

export const JournalsEntryScreen: React.FC = () => {
  const [text, setText] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const navigation = useNavigation();

  const onSave = async () => {
    if (!text || text.trim().length === 0) {
      Alert.alert('Empty entry', 'Please write something before saving.');
      return;
    }
    setSaving(true);
    try {
      await journalStorage.addEntry(text.trim());
      navigation.goBack();
    } catch (e) {
      console.error('Failed to save journal entry', e);
      Alert.alert('Save failed', 'Could not save the entry. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>New Journal Entry</Text>
      </View>

      <View style={styles.editorContainer}>
        <TextInput
          placeholder="Write about your day..."
          placeholderTextColor={theme.colors.text.secondary}
          multiline
          value={text}
          onChangeText={setText}
          editable={!saving}
          style={styles.textInput}
        />
        <TouchableOpacity style={styles.saveButton} onPress={onSave} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Entry'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: 16 },
  title: { color: theme.colors.text.primary, fontSize: 20, fontWeight: '700' },
  editorContainer: { flex: 1, padding: 16 },
  textInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    color: theme.colors.text.primary,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});
