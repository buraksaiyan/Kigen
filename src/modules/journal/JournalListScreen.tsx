import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useAppStore } from '../../state/store';
import { JOURNAL_PAGE_SIZE } from '../../config/constants';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { journalStorage } from '../../services/journalStorage';

export const JournalListScreen: React.FC = () => {
  const { journal, setJournal } = useAppStore();
  const nav = useNavigation<any>();
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const entries = await journalStorage.getAllEntries();
      // If the app store expects a richer shape, normalize minimally
      setJournal(
        entries.map((e) => ({
          id: e.id,
          user_id: 'local',
          created_at: e.date,
          updated_at: e.date,
          title: e.content.split('\n\n')[0] || '',
          body: e.content.split('\n\n').slice(1).join('\n\n') || '',
        }))
      );
    } catch (err) {
      console.warn('Failed to load local journal entries', err);
    }
    setLoading(false);
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  useEffect(() => {
    // Optional subscription for realtime changes if enabled later.
  }, []);

  return (
    <FlatList
      data={journal}
      keyExtractor={(i) => i.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={{ padding: 16, borderBottomWidth: 1, borderColor: '#222' }}
          onPress={() => nav.navigate('JournalEdit', { id: item.id })}
        >
          <Text style={{ fontWeight: '600' }}>{item.title || '(Untitled)'}</Text>
          <Text numberOfLines={2} style={{ opacity: 0.7 }}>
            {item.body}
          </Text>
        </TouchableOpacity>
      )}
      ListHeaderComponent={
        <TouchableOpacity
          style={{ padding: 16, backgroundColor: '#111' }}
          onPress={() => nav.navigate('JournalEdit', { id: 'new' })}
        >
          <Text style={{ color: '#0af' }}>+ New Entry</Text>
        </TouchableOpacity>
      }
    />
  );
};