import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../state/store';
import { journalStorage } from '../../services/journalStorage';

export const JournalEditScreen: React.FC = () => {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const { upsertEntry, journal } = useAppStore();

  const editingId = route.params?.id as string;
  const existing = journal.find((j) => j.id === editingId);
  const [title, setTitle] = useState(existing?.title || '');
  const [body, setBody] = useState(existing?.body || '');
  const [saving, setSaving] = useState(false);

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

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        style={{ fontSize: 18, fontWeight: '600', padding: 8, backgroundColor: '#111' }}
      />
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder="Write..."
        multiline
        style={{ flex: 1, textAlignVertical: 'top', padding: 8, backgroundColor: '#111' }}
      />
      <Button title={saving ? 'Saving...' : 'Save'} disabled={saving} onPress={save} />
    </View>
  );
};