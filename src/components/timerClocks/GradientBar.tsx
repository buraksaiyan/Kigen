import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../config/theme';

interface Props { progress?: number; vertical?: boolean; width?: number; height?: number }

export default function GradientBar({ progress = 0.4, vertical = false, width = 160, height = 18 }: Props) {
  const filled = Math.max(0, Math.min(1, progress));
  return (
    <View style={[styles.container, { width: width, height: height, borderRadius: height / 2, backgroundColor: theme.colors.surface }]}> 
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.accent || '#8b5cf6']}
        start={[0,0]}
        end={[1,0]}
        style={{ width: width * filled, height, borderRadius: height / 2 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({ container: { overflow: 'hidden' } });
