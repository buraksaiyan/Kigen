import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../config/theme';

// Journals entry screen removed per user instruction. Redirect users to History.
export const JournalsEntryScreen: React.FC = () => {
  const nav = useNavigation<any>();

  useEffect(() => {
    const t = setTimeout(() => {
      try { nav.navigate('History'); } catch (e) { /* ignore */ }
    }, 300);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>Journals entry removed</Text>
      <Text style={[styles.subtitle, { color: theme.colors.text.secondary, marginTop: 8 }]}>This feature has been removed. Redirecting to History...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { marginTop: 8 },
});
