import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../config/theme';

interface Props { focusProgress?: number; breakProgress?: number; size?: number }

export default function PomodoroRing({ focusProgress = 0.6, breakProgress = 0.2, size = 120 }: Props) {
  return (
    <View style={[styles.container, { width: size, height: size }]}> 
      <View style={[styles.outer, { borderRadius: size / 2, borderWidth: 10, borderColor: theme.colors.primary, opacity: 0.2 }]} />
      <View style={[styles.inner, { borderRadius: (size * 0.6) / 2, width: size * 0.6, height: size * 0.6, borderWidth: 8, borderColor: theme.colors.secondary, opacity: 0.25 }]} />
      <View style={[styles.centerOverlay, { width: size * 0.5, height: size * 0.5, borderRadius: (size * 0.5) / 2, backgroundColor: theme.colors.background }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  centerOverlay: { alignItems: 'center', justifyContent: 'center', position: 'absolute' },
  container: { alignItems: 'center', justifyContent: 'center' },
  inner: { position: 'absolute' },
  outer: { position: 'absolute' }
});
