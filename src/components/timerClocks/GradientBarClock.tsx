import React from 'react';
import { Bar } from 'react-native-progress';
import { View } from 'react-native';
import { theme } from '../../config/theme';

interface Props {
  duration: number; // Total duration in seconds
  elapsed: number; // Elapsed time in seconds
  onComplete?: () => void;
  width?: number;
  height?: number;
  color?: string;
}

export default function GradientBarClock({ 
  duration, 
  elapsed, 
  onComplete, 
  width = 120, 
  height = 10, 
  color = theme.colors.primary 
}: Props) {
  const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 0;
  
  React.useEffect(() => {
    if (elapsed >= duration && onComplete) {
      onComplete();
    }
  }, [elapsed, duration, onComplete]);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Bar
        progress={progress}
        width={width}
        height={height}
        color={color}
        unfilledColor={theme.colors.surface}
        borderWidth={0}
      />
    </View>
  );
}