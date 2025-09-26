import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../config/theme';

interface Props { timeString?: string; size?: number; color?: string; }

export default function MinimalDigital({ timeString = '00:25:00', size = 40, color }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.time, { fontSize: size, color: color || theme.colors.text.primary }]}>{timeString}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  time: { fontWeight: '700', letterSpacing: 1 }
});
