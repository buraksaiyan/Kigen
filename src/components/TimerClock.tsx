import React from 'react';
import ClassicCircular from './timerClocks/ClassicCircular';
import MinimalDigital from './timerClocks/MinimalDigital';
import FlipClock from './timerClocks/FlipClock';
import PomodoroRing from './timerClocks/PomodoroRing';
import GradientBar from './timerClocks/GradientBar';
import ArcClock from './timerClocks/ArcClock';
import CustomClock from './timerClocks/CustomClock';

interface Props {
  styleId?: string;
  progress?: number;
  timeString?: string;
}

export default function TimerClock({ styleId = 'classic', progress = 0.5, timeString = '25:00' }: Props) {
  switch (styleId) {
    case 'minimal':
      return <MinimalDigital timeString={timeString} />;
    case 'flip':
      return <FlipClock timeString={timeString} />;
    case 'pomodoro':
      return <PomodoroRing focusProgress={progress} />;
    case 'gradient':
      return <GradientBar progress={progress} />;
    case 'arc':
      return <ArcClock progress={progress} />;
    case 'custom':
      return <CustomClock timeString={timeString} />;
    case 'classic':
    default:
      return <ClassicCircular progress={progress} />;
  }
}
