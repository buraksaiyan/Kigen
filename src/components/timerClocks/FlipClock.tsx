import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../config/theme';

interface Props { timeString?: string; size?: number }

export default function FlipClock({ timeString = '00:25:00', size = 36 }: Props) {
  // This is a lightweight visual simulation of a flip clock for preview.
  const parts = timeString.split(':');
  return (
    <View style={styles.row}>
      {parts.map((p, i) => (
        <View key={i} style={[styles.tile, { height: size * 1.4 }]}> 
          <View style={styles.flipFace}>
            <Text style={[styles.flipText, { fontSize: size }]}>{p}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  tile: { marginHorizontal: 4, borderRadius: 6, overflow: 'hidden', backgroundColor: '#0f172a' },
  flipFace: { paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', justifyContent: 'center' },
  flipText: { color: '#fff', fontWeight: '800' }
});
