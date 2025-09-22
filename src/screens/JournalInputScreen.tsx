import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../config/theme';

// JournalInputScreen removed. Redirect to History.
export const JournalInputScreen: React.FC = () => {
  const nav = useNavigation<any>();
  useEffect(() => {
    const t = setTimeout(() => {
      try { nav.navigate('History'); } catch (e) { /* ignore */ }
    }, 300);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>Journal input removed</Text>
      <Text style={[styles.subtitle, { color: theme.colors.text.secondary, marginTop: 8 }]}>Redirecting to History...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { marginTop: 8 },
});