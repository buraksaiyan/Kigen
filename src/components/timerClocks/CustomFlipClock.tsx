import React, { useEffect, useState } from 'react';
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
  return {
    minutes: mins.toString().padStart(2, '0'),
    seconds: secs.toString().padStart(2, '0'),
  };
};

interface FlipDigitProps {
  digit: string;
  previousDigit: string;
  size: number;
  color: string;
}

const FlipDigit: React.FC<FlipDigitProps> = ({ digit, previousDigit, size, color }) => {
  const { theme: currentTheme } = useTheme();
  const flipAnim = new Animated.Value(0);

  useEffect(() => {
    if (digit !== previousDigit) {
      // Reset and animate flip
      flipAnim.setValue(0);
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [digit, previousDigit, flipAnim]);

  const styles = StyleSheet.create({
    digitContainer: {
      width: size * 0.4,
      height: size * 0.6,
      marginHorizontal: 2,
      position: 'relative',
      backgroundColor: currentTheme.colors.surface,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    digitHalf: {
      position: 'absolute',
      width: '100%',
      height: '50%',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: currentTheme.colors.surface,
      overflow: 'hidden',
    },
    topHalf: {
      top: 0,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.border,
    },
    bottomHalf: {
      bottom: 0,
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      borderTopWidth: 1,
      borderTopColor: currentTheme.colors.border,
    },
    digitText: {
      fontSize: size * 0.25,
      fontFamily: 'monospace',
      fontWeight: 'bold',
      color: color,
    },
    flippingHalf: {
      position: 'absolute',
      width: '100%',
      height: '50%',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: currentTheme.colors.surface,
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      top: '50%',
    },
  });

  return (
    <View style={styles.digitContainer}>
      {/* Top half - shows current digit */}
      <View style={[styles.digitHalf, styles.topHalf]}>
        <Text style={styles.digitText}>{digit}</Text>
      </View>
      
      {/* Bottom half - shows current digit */}
      <View style={[styles.digitHalf, styles.bottomHalf]}>
        <Text style={styles.digitText}>{digit}</Text>
      </View>
      
      {/* Animated flipping half - shows previous digit flipping to current */}
      <Animated.View
        style={[
          styles.flippingHalf,
          {
            transform: [
              {
                rotateX: flipAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: ['0deg', '90deg', '0deg'],
                }),
              },
            ],
            opacity: flipAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 1, 0],
            }),
          },
        ]}
      >
        <Text style={styles.digitText}>{previousDigit}</Text>
      </Animated.View>
    </View>
  );
};

export default function FlipClock({
  duration,
  elapsed,
  onComplete,
  size = 120,
  color
}: Props) {
  const { theme: currentTheme } = useTheme();
  const timeLeft = Math.max(duration - elapsed, 0);
  const currentTime = formatTime(timeLeft);
  const [previousTime, setPreviousTime] = useState(currentTime);

  useEffect(() => {
    if (elapsed >= duration && onComplete) {
      onComplete();
    }
  }, [elapsed, duration, onComplete]);

  useEffect(() => {
    setPreviousTime(currentTime);
  }, [elapsed]);

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      width: size * 1.8,
      height: size,
    },
    flipContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    separator: {
      fontSize: size * 0.3,
      fontWeight: 'bold',
      color: color || currentTheme.colors.primary,
      marginHorizontal: 8,
    },
    label: {
      fontSize: 10,
      color: currentTheme.colors.text.secondary,
      marginTop: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.flipContainer}>
        <FlipDigit
          digit={currentTime.minutes[0] || '0'}
          previousDigit={previousTime.minutes[0] || '0'}
          size={size}
          color={color || currentTheme.colors.primary}
        />
        <FlipDigit
          digit={currentTime.minutes[1] || '0'}
          previousDigit={previousTime.minutes[1] || '0'}
          size={size}
          color={color || currentTheme.colors.primary}
        />
        <Text style={styles.separator}>:</Text>
        <FlipDigit
          digit={currentTime.seconds[0] || '0'}
          previousDigit={previousTime.seconds[0] || '0'}
          size={size}
          color={color || currentTheme.colors.primary}
        />
        <FlipDigit
          digit={currentTime.seconds[1] || '0'}
          previousDigit={previousTime.seconds[1] || '0'}
          size={size}
          color={color || currentTheme.colors.primary}
        />
      </View>
      <Text style={styles.label}>Time Left</Text>
    </View>
  );
}