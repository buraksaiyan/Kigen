import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../config/theme';

// Journal list UI removed — redirect to History to keep journal access.
export const JournalListScreen: React.FC = () => {
  const nav = useNavigation<any>();
  useEffect(() => {
    const t = setTimeout(() => {
      try { nav.navigate('History'); } catch (e) {}
    }, 300);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>Journal list removed</Text>
      <Text style={{ color: theme.colors.text.secondary, marginTop: 8 }}>Redirecting to History...</Text>
    </View>
  );
};

const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }, title: { fontSize: 18, fontWeight: '700' } });