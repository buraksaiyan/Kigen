import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { focusSessionService } from '../services/FocusSessionService';

export default function SimPomodoroTest() {
  const [log, setLog] = useState<string[]>([]);
  const append = (s: string) => setLog(prev => [s, ...prev]);

  const runSim = async () => {
    append('Starting simulation: 50-minute work session (should count as 2 pomodoros).');
    try {
      // Start a session but manipulate the stored session startTime so completion measures 50 minutes
      const sessionId = await focusSessionService.startSession({ id: 'pomodoro', title: 'Pomodoro', color: '#FF66B2' }, 50);
      append(`Started session ${sessionId}`);

      // Retrieve the raw session, modify its startTime to 50 minutes ago, and save back to storage
      const raw = await focusSessionService.getCurrentSession();
      if (!raw) {
        append('Failed to read current session');
        return;
      }

      const startDate = new Date(Date.now() - 50 * 60 * 1000).toISOString();
      raw.startTime = startDate;
      // Save back into AsyncStorage the updated session
      // Direct access to storage key is internal; use startSession's storage key name
      // But focusSessionService stores session under '@inzone_current_session', so reuse that
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('@inzone_current_session', JSON.stringify(raw));
      append('Adjusted session start time to 50 minutes ago.');

      // Now complete the session
      await focusSessionService.completeSession(sessionId, true, 'completed');
      append('Completed simulated session.');

      // Read pomodoro run state and today's points
      const run = await focusSessionService.getPomodoroRun();
      append(`Pomodoro run state: consecutive=${run?.consecutive || 0} lastEndAt=${run?.lastEndAt || 'n/a'}`);

      const summary = await focusSessionService.getTodaysSummary();
      append(`Today's summary: minutes=${summary.minutes} points=${summary.points} sessions=${summary.sessions}`);
    } catch (e) {
      append('Simulation error: ' + String(e));
      console.error(e);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Simulated Pomodoro Test</Text>
      <Button title="Run 50-minute simulation (50/10)" onPress={runSim} />

      <View style={styles.logContainer}>
        {log.map((l, i) => (
          <Text key={i} style={styles.logLine}>{l}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  logContainer: {
    marginTop: 20,
  },
  logLine: {
    marginBottom: 6,
    fontSize: 14,
  },
});
