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
  flipFace: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 6 },
  flipText: { color: '#fff', fontWeight: '800' },
  row: { alignItems: 'center', flexDirection: 'row' },
  tile: { backgroundColor: '#0f172a', borderRadius: 6, marginHorizontal: 4, overflow: 'hidden' }
});
