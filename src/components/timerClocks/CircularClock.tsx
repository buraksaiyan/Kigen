import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
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

export default function CircularClock({
  duration,
  elapsed,
  onComplete,
  size = 120,
  strokeWidth = 8,
  color
}: Props) {
  const { theme: currentTheme } = useTheme();
  const timeLeft = Math.max(duration - elapsed, 0);
  const progress = duration > 0 ? (timeLeft / duration) : 0;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  useEffect(() => {
    if (elapsed >= duration && onComplete) {
      onComplete();
    }
  }, [elapsed, duration, onComplete]);

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
    },
    svg: {
      position: 'absolute',
      transform: [{ rotate: '-90deg' }],
    },
    timeText: {
      fontSize: size * 0.2,
      fontFamily: 'monospace',
      fontWeight: 'bold',
      color: color || currentTheme.colors.primary,
      textAlign: 'center',
    },
    label: {
      fontSize: 10,
      color: currentTheme.colors.text.secondary,
      marginTop: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={currentTheme.colors.surfaceSecondary}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color || currentTheme.colors.primary}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={styles.timeText}>
          {formatTime(timeLeft)}
        </Text>
        <Text style={styles.label}>Left</Text>
      </View>
    </View>
  );
}