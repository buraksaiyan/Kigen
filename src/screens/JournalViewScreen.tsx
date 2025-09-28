import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, BackHandler, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { journalStorage, JournalEntry } from '../services/journalStorage';
import { theme } from '../config/theme';

interface RouteParams {
  id: string;
}

export const JournalViewScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as RouteParams | undefined;
  const [entry, setEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return;
      const all = await journalStorage.getAllEntries();
      const e = all.find(x => x.id === params.id) || null;
      setEntry(e);
    };

    load();
  }, [params?.id]);

  // Ensure hardware back closes this screen when focused
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.goBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Journal</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {entry ? (
          <>
            <Text style={styles.title}>{entry.content.split('\n')[0] || 'Journal Entry'}</Text>
            <Text style={styles.date}>{entry.date}</Text>
            <Text style={styles.body}>{entry.content}</Text>
          </>
        ) : (
          <Text style={styles.missing}>Entry not found.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
  },
  closeButton: { padding: theme.spacing.sm },
  closeText: { color: theme.colors.primary, fontWeight: '600' },
  headerTitle: { ...theme.typography.h4, color: theme.colors.text.primary },
  placeholder: { width: 48 },
  content: { padding: theme.spacing.lg },
  title: { ...theme.typography.h3, marginBottom: theme.spacing.sm },
  date: { color: theme.colors.text.secondary, marginBottom: theme.spacing.md },
  body: { ...theme.typography.body, color: theme.colors.text.primary, lineHeight: 22 },
  missing: { color: theme.colors.text.secondary },
});

export default JournalViewScreen;
