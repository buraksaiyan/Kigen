import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../config/theme';

// Stubbed journal edit screen: removed per user request. Keeps route but redirects users.
export const JournalEditScreen: React.FC = () => {
  const nav = useNavigation<any>();

  useEffect(() => {
    // Give user a short moment, then redirect to Dashboard to avoid breaking navigation
    const t = setTimeout(() => {
      try { nav.navigate('Dashboard'); } catch (e) {}
    }, 600);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>Journal editor removed</Text>
      <Text style={{ color: theme.colors.text.secondary, marginTop: 8 }}>We're rebuilding this feature. Redirecting you back to Dashboard...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: '700' },
});