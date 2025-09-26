import React from 'react';
import { CircularProgress } from 'react-native-circular-progress';
import { theme } from '../../config/theme';

interface Props {
  duration: number; // Total duration in seconds
  elapsed: number; // Elapsed time in seconds
  onComplete?: () => void;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export default function ClassicClock({ 
  duration, 
  elapsed, 
  onComplete, 
  size = 120, 
  strokeWidth = 10, 
  color = theme.colors.primary 
}: Props) {
  const progress = duration > 0 ? Math.min((elapsed / duration) * 100, 100) : 0;
  
  React.useEffect(() => {
    if (elapsed >= duration && onComplete) {
      onComplete();
    }
  }, [elapsed, duration, onComplete]);

  return (
    <CircularProgress
      size={size}
      width={strokeWidth}
      fill={progress}
      tintColor={color}
      backgroundColor={theme.colors.surface}
      rotation={0}
    />
  );
}