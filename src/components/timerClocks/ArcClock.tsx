import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../config/theme';

interface Props { progress?: number; width?: number; height?: number }

export default function ArcClock({ progress = 0.5, width = 200, height = 100 }: Props) {
  return (
    <View style={[styles.container, { width, height }]}> 
      <View style={[styles.arcBase, { borderBottomLeftRadius: width / 2, borderBottomRightRadius: width / 2, backgroundColor: theme.colors.surface }]} />
      <View style={[styles.arcFill, { width: width * progress, height: height * 0.6, backgroundColor: theme.colors.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  arcBase: { position: 'absolute', bottom: 0, height: '70%', width: '100%' },
  arcFill: { position: 'absolute', bottom: 8, left: '10%', borderRadius: 8 }
});
