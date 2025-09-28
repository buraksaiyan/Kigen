import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
};

export default function ArcClock({
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
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Arc goes from -90 degrees to +90 degrees (180 degree arc)
  const startAngle = -90;
  const endAngle = 90;
  const progressAngle = startAngle + (endAngle - startAngle) * progress;

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
      height: size * 0.7, // Shorter since it's a semi-circle
    },
    svg: {
      position: 'absolute',
    },
    timeText: {
      fontSize: size * 0.18,
      fontFamily: 'monospace',
      fontWeight: 'bold',
      color: color || currentTheme.colors.primary,
      textAlign: 'center',
      marginTop: size * 0.1,
    },
    label: {
      fontSize: 10,
      color: currentTheme.colors.text.secondary,
      marginTop: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });

  // Background arc (full 180 degrees)
  const backgroundPath = describeArc(centerX, centerY, radius, startAngle, endAngle);
  
  // Progress arc (from start to current progress)
  const progressPath = describeArc(centerX, centerY, radius, startAngle, progressAngle);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size * 0.7} style={styles.svg}>
        {/* Background arc */}
        <Path
          d={backgroundPath}
          stroke={currentTheme.colors.surfaceSecondary}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <Path
          d={progressPath}
          stroke={color || currentTheme.colors.primary}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={styles.timeText}>
          {formatTime(timeLeft)}
        </Text>
        <Text style={styles.label}>Remaining</Text>
      </View>
    </View>
  );
}