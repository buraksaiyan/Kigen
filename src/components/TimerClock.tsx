import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NewTimerClock from './timerClocks/TimerClock';

interface Props {
  styleId?: string;
  progress?: number; // 0..1
  timeString?: string; // e.g. '25:00' or '01:30:00'
}

function parseTimeString(ts?: string): number {
  if (!ts) return 0;
  const parts = ts.split(':').map(p => parseInt(p, 10) || 0);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const s = parts[2] ?? 0;
  if (parts.length >= 3) {
    return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) {
    return h * 60 + m;
  }
  return h || 0;
}

// Backwards-compatible wrapper: map old styleId/progress/timeString to the new TimerClock API
export default function TimerClock({ styleId = 'classic', progress = 0.5, timeString = '25:00' }: Props) {
  const duration = Math.max(parseTimeString(timeString), 1); // seconds
  // elapsed should reflect the progress: if progress==0.5 and duration=1500 => elapsed=750
  const elapsed = Math.round(duration * Math.min(Math.max(progress ?? 0, 0), 1));

  switch (styleId) {
    case 'minimal':
      // Minimal digital was just a text preview — keep a simple fallback
      return (
        <View style={styles.minimalWrap}>
          <Text style={styles.minimalText}>{timeString}</Text>
        </View>
      );
    case 'flip':
      return <NewTimerClock clockStyle="flip" duration={duration} elapsed={elapsed} />;
    case 'pomodoro':
      return <NewTimerClock clockStyle="classic" duration={duration} elapsed={elapsed} />;
    case 'gradient':
      return <NewTimerClock clockStyle="gradient" duration={duration} elapsed={elapsed} />;
    case 'arc':
      return <NewTimerClock clockStyle="classic" duration={duration} elapsed={elapsed} />;
    case 'custom':
      return (
        <View style={styles.minimalWrap}>
          <Text style={styles.minimalText}>{timeString}</Text>
        </View>
      );
    case 'classic':
    default:
      return <NewTimerClock clockStyle="classic" duration={duration} elapsed={elapsed} />;
  }
}

const styles = StyleSheet.create({
  minimalWrap: { alignItems: 'center', justifyContent: 'center' },
  minimalText: { fontWeight: '700', fontSize: 16 },
});
