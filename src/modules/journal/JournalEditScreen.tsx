import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, Alert, TouchableOpacity, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../state/store';
import { journalStorage } from '../../services/journalStorage';
import { theme } from '../../config/theme';

export const JournalEditScreen: React.FC = () => {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const { upsertEntry, journal } = useAppStore();

  const editingId = route.params?.id as string;
  const existing = journal.find((j) => j.id === editingId);
  const [title, setTitle] = useState(existing?.title || '');
  const [body, setBody] = useState(existing?.body || '');
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setBody(existing.body);
    }
  }, [existing]);

  async function save() {
    setSaving(true);
    try {
      if (editingId === 'new') {
        await journalStorage.addEntry(`${title}\n\n${body}`);
        // Reload/notify via global store - upsertEntry will be called elsewhere when list reloads
      } else {
        await journalStorage.updateEntry(editingId, `${title}\n\n${body}`);
        // Optionally update local store - provide minimal required shape
        const now = new Date().toISOString();
        upsertEntry({ id: editingId, user_id: 'local', created_at: now, updated_at: now, title, body });
      }
      nav.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save entry');
    }
    setSaving(false);
  }

  const saveAsDraft = async () => {
    const draft = { id: Date.now().toString(), title, body, date: new Date().toISOString() };
    try {
      const existing = await AsyncStorage.getItem('journalDrafts');
      const arr = existing ? JSON.parse(existing) : [];
      arr.unshift(draft);
      await AsyncStorage.setItem('journalDrafts', JSON.stringify(arr));
      setMenuOpen(false);
      Alert.alert('Saved', 'Draft saved and will be available when you return');
    } catch (err) {
      Alert.alert('Error', 'Failed to save draft');
    }
  };

  const loadDrafts = async () => {
    try {
      const existing = await AsyncStorage.getItem('journalDrafts');
      if (existing) setDrafts(JSON.parse(existing));
    } catch (err) {
      console.warn('Failed to load drafts', err);
    }
  };

  const loadDraft = (d: any) => {
    setTitle(d.title);
    setBody(d.body);
    setMenuOpen(false);
  };

  const deleteDraft = async (id: string) => {
    try {
      const existing = await AsyncStorage.getItem('journalDrafts');
      const arr = existing ? JSON.parse(existing) : [];
      const updated = arr.filter((x: any) => x.id !== id);
      await AsyncStorage.setItem('journalDrafts', JSON.stringify(updated));
      setDrafts(updated);
    } catch (err) {
      console.warn('Failed to delete draft', err);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={save} style={styles.saveButton} disabled={saving}>
            <Text style={{ color: theme.colors.background, fontWeight: '700' }}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)} style={styles.menuToggle}>
            <Text style={{ color: theme.colors.text.primary, fontSize: 18 }}>{menuOpen ? '▴' : '▾'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>New Entry</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.cancelButton}>
            <Text style={{ color: theme.colors.text.secondary }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        style={{ fontSize: 18, fontWeight: '600', padding: 8, backgroundColor: theme.colors.surface, color: theme.colors.text.primary, borderRadius: 8 }}
      />
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder="Write..."
        multiline
        style={{ flex: 1, textAlignVertical: 'top', padding: 8, backgroundColor: theme.colors.surface, color: theme.colors.text.primary, borderRadius: 8 }}
      />

      {/* Bottom buttons removed - actions are in header for the new UI */}

      {/* Draft dropdown (simple list) */}
      {menuOpen && drafts.length > 0 && (
        <View style={styles.draftList}>
          {drafts.map((d) => (
            <View key={d.id} style={styles.draftRow}>
              <TouchableOpacity onPress={() => loadDraft(d)} style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text.primary, fontWeight: '600' }}>{d.title || '(Untitled)'}</Text>
                <Text style={{ color: theme.colors.text.secondary }}>{(d.body || '').substring(0, 60)}...</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteDraft(d.id)} style={{ padding: 8 }}>
                <Text style={{ color: theme.colors.text.secondary }}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerLeft: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  saveButton: { backgroundColor: theme.colors.secondary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  saveAsDraftButton: { backgroundColor: theme.colors.surface, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  menuToggle: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 6 },
  cancelButton: { paddingHorizontal: 8, paddingVertical: 6 },
  draftList: { marginTop: 8, borderTopWidth: 1, borderColor: '#222', paddingTop: 8 },
  draftRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
});