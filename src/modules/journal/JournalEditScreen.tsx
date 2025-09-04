import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { supabase } from '../../services/supabase';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../state/store';

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
    let payload: any = { title, body };
    let result;
    if (editingId === 'new') {
      result = await supabase.from('journal_entries').insert(payload).select().single();
    } else {
      result = await supabase.from('journal_entries').update(payload).eq('id', editingId).select().single();
    }
    if (result.error) {
      Alert.alert('Error', result.error.message);
    } else if (result.data) {
      upsertEntry(result.data);
      nav.goBack();
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