import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../config/theme';

// GoalInputScreen removed — redirecting to Dashboard to keep navigation safe.
export const GoalInputScreen: React.FC = () => {
  const nav = useNavigation<any>();

  useEffect(() => {
    const t = setTimeout(() => {
      try { nav.navigate('Dashboard'); } catch (e) { /* ignore */ }
    }, 200);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>Goal editor removed</Text>
      <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>This screen has been removed. Redirecting to Dashboard...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { marginTop: 8 },
});