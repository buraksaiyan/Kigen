import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../config/theme';

// Journal editor removed. Redirect to Dashboard to avoid broken navigation.
export const JournalEditScreen: React.FC = () => {
  const nav = useNavigation<any>();
  useEffect(() => {
    const t = setTimeout(() => {
      try { nav.navigate('Dashboard'); } catch (e) {}
    }, 400);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>Journal editor removed</Text>
      <Text style={{ color: theme.colors.text.secondary, marginTop: 8 }}>Redirecting to Dashboard...</Text>
    </View>
  );
};

const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }, title: { fontSize: 18, fontWeight: '700' } });