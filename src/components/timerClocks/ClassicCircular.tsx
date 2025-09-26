import React from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { theme } from '../../config/theme';

interface Props {
  progress: number; // 0..1
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export default function ClassicCircular({ progress = 0.5, size = 120, strokeWidth = 10, color }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={[styles.container, { width: size, height: size }]}> 
      <Animated.View style={[styles.svgWrap]}> 
        {/* Use view trick to simulate ring with border and overlay */}
        <View style={[styles.ringBackground, { borderRadius: size / 2, borderWidth: strokeWidth, width: size, height: size, borderColor: theme.colors.surface }]} />
        <View style={[styles.ringFill, { borderRadius: size / 2, width: size, height: size, borderWidth: strokeWidth, borderColor: color || theme.colors.primary, transform: [{ rotate: `${-90}deg` }] }]} />
        {/* overlay to simulate progress - simplified but performant */}
        <View style={[styles.center, { width: radius * 1.6, height: radius * 1.6, borderRadius: (radius * 1.6) / 2, backgroundColor: theme.colors.background }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  svgWrap: { alignItems: 'center', justifyContent: 'center' },
  ringBackground: { position: 'absolute' },
  ringFill: { position: 'absolute', borderStyle: 'solid' },
  center: { alignItems: 'center', justifyContent: 'center' }
});
