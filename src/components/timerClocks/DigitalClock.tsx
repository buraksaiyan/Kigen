import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  duration: number; // Total duration in seconds
  elapsed: number; // Elapsed time in seconds
  onComplete?: () => void;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function DigitalClock({
  duration,
  elapsed,
  onComplete,
  size = 120,
  color
}: Props) {
  const { theme: currentTheme } = useTheme();
  const timeLeft = Math.max(duration - elapsed, 0);
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    if (elapsed >= duration && onComplete) {
      onComplete();
    }
  }, [elapsed, duration, onComplete]);

  // Pulse animation every second
  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    };

    if (timeLeft > 0) {
      pulse();
    }
  }, [elapsed, fadeAnim, timeLeft]);

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: currentTheme.colors.surface,
      borderRadius: 16,
      padding: 24,
      width: size * 1.5,
      height: size,
    },
    timeText: {
      fontSize: size * 0.25,
      fontFamily: 'monospace',
      fontWeight: 'bold',
      color: color || currentTheme.colors.primary,
      textAlign: 'center',
    },
    label: {
      fontSize: 12,
      color: currentTheme.colors.text.secondary,
      marginTop: 8,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
  });

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.timeText, { opacity: fadeAnim }]}>
        {formatTime(timeLeft)}
      </Animated.Text>
      <Text style={styles.label}>Time Left</Text>
    </View>
  );
}