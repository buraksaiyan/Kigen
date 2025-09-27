import React from 'react';
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer';
import { theme } from '../../config/theme';

interface Props {
  duration: number;
  elapsed: number;
  onComplete?: () => void;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export default function FlipClock({
  duration,
  elapsed,
  onComplete,
  size = 120,
  strokeWidth = 10,
  color = theme.colors.primary,
}: Props) {
  const remainingTime = Math.max(duration - elapsed, 0);

  return (
    <CountdownCircleTimer
      isPlaying={remainingTime > 0}
      duration={duration}
      initialRemainingTime={remainingTime}
      colors={color as any}
      size={size}
      strokeWidth={strokeWidth}
      trailColor={theme.colors.surfaceSecondary as any}
      onComplete={() => {
        if (onComplete) onComplete();
        return { shouldRepeat: false };
      }}
    />
  );
}
