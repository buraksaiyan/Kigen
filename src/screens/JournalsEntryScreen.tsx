import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';

export const JournalsEntryScreen: React.FC = () => {
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
          style={styles.textInput}
        />
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Entry</Text>
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
