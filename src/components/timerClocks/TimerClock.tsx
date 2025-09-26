import React from 'react';
import ClassicClock from './ClassicClock';
import FlipClock from './FlipClock';
import GradientBarClock from './GradientBarClock';

interface Props {
  clockStyle: 'classic' | 'flip' | 'gradient';
  duration: number; // Total duration in seconds
  elapsed: number; // Elapsed time in seconds
  onComplete?: () => void;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export default function TimerClock({ 
  clockStyle, 
  duration, 
  elapsed, 
  onComplete,
  size,
  strokeWidth,
  color
}: Props) {
  switch (clockStyle) {
    case 'classic':
      return (
        <ClassicClock
          duration={duration}
          elapsed={elapsed}
          onComplete={onComplete}
          size={size}
          strokeWidth={strokeWidth}
          color={color}
        />
      );
    case 'flip':
      return (
        <FlipClock
          duration={duration}
          elapsed={elapsed}
          onComplete={onComplete}
          size={size}
          strokeWidth={strokeWidth}
          color={color}
        />
      );
    case 'gradient':
      return (
        <GradientBarClock
          duration={duration}
          elapsed={elapsed}
          onComplete={onComplete}
          width={size}
          height={strokeWidth}
          color={color}
        />
      );
    default:
      return (
        <ClassicClock
          duration={duration}
          elapsed={elapsed}
          onComplete={onComplete}
          size={size}
          strokeWidth={strokeWidth}
          color={color}
        />
      );
  }
}