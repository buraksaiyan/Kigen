import React from 'react';
import ClassicClock from './ClassicClock';
import DigitalClock from './DigitalClock';
import CircularClock from './CircularClock';
import ArcClock from './ArcClock';
import ProgressBarClock from './ProgressBarClock';
import CustomFlipClock from './CustomFlipClock';

interface Props {
  clockStyle: 'classic' | 'digital' | 'circular' | 'arc' | 'progress' | 'flip';
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
    case 'digital':
      return (
        <DigitalClock
          duration={duration}
          elapsed={elapsed}
          onComplete={onComplete}
          size={size}
          strokeWidth={strokeWidth}
          color={color}
        />
      );
    case 'circular':
      return (
        <CircularClock
          duration={duration}
          elapsed={elapsed}
          onComplete={onComplete}
          size={size}
          strokeWidth={strokeWidth}
          color={color}
        />
      );
    case 'arc':
      return (
        <ArcClock
          duration={duration}
          elapsed={elapsed}
          onComplete={onComplete}
          size={size}
          strokeWidth={strokeWidth}
          color={color}
        />
      );
    case 'progress':
      return (
        <ProgressBarClock
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
        <CustomFlipClock
          duration={duration}
          elapsed={elapsed}
          onComplete={onComplete}
          size={size}
          strokeWidth={strokeWidth}
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