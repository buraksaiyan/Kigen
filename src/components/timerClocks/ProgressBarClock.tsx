import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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

export default function ProgressBarClock({
  duration,
  elapsed,
  onComplete,
  size = 120,
  strokeWidth = 12,
  color
}: Props) {
  const { theme: currentTheme } = useTheme();
  const timeLeft = Math.max(duration - elapsed, 0);
  const progress = duration > 0 ? (timeLeft / duration) : 0;
  
  const progressWidth = new Animated.Value(progress);
  const barWidth = size * 1.5;

  useEffect(() => {
    if (elapsed >= duration && onComplete) {
      onComplete();
    }
  }, [elapsed, duration, onComplete]);

  // Animate progress bar width
  useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, progressWidth]);

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      width: barWidth,
      height: size,
    },
    timeText: {
      fontSize: size * 0.2,
      fontFamily: 'monospace',
      fontWeight: 'bold',
      color: color || currentTheme.colors.primary,
      textAlign: 'center',
      marginBottom: 16,
    },
    progressContainer: {
      width: barWidth,
      height: strokeWidth,
      backgroundColor: currentTheme.colors.surfaceSecondary,
      borderRadius: strokeWidth / 2,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius: strokeWidth / 2,
    },
    label: {
      fontSize: 10,
      color: currentTheme.colors.text.secondary,
      marginTop: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });

  // Create gradient colors based on the primary color
  const primaryColor = color || currentTheme.colors.primary;
  const gradientColors = [primaryColor, `${primaryColor}80`]; // Second color is more transparent

  return (
    <View style={styles.container}>
      <Text style={styles.timeText}>
        {formatTime(timeLeft)}
      </Text>
      
      <View style={styles.progressContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progressWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressBar}
          />
        </Animated.View>
      </View>
      
      <Text style={styles.label}>Progress</Text>
    </View>
  );
}