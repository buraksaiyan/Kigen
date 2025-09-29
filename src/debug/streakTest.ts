/* Quick debug script to run in-app (import and call from a debug screen or run in node with ts-node if available)
   It will simulate completing sessions for various modes and durations, then print today's daily activity and daily streak.
*/
import { focusSessionService } from '../services/FocusSessionService';
import { UserStatsService } from '../services/userStatsService';

export async function runStreakDebug() {
  console.log('Running streak debug...');
  const modes = ['pomodoro','clock','custom','meditation','flow','executioner','body'];

  for (const modeId of modes) {
    // Start session, then artificially set startTime to 31 minutes ago and complete
    const sessionId = await focusSessionService.startSession({ id: modeId, title: modeId, color: '#000' }, 30);
    // Manually modify stored session to set startTime earlier
    const current = await (async () => {
      const data = await (await import('@react-native-async-storage/async-storage')).default.getItem('@inzone_current_session');
      return data ? JSON.parse(data) : null;
    })();
    if (!current) continue;
    const past = new Date(Date.now() - 31 * 60 * 1000).toISOString();
    current.startTime = past;
    await (await import('@react-native-async-storage/async-storage')).default.setItem('@inzone_current_session', JSON.stringify(current));

    await focusSessionService.completeSession(sessionId, true, 'completed');

    const today = await UserStatsService.getTodayActivity();
    console.log(`Mode ${modeId} -> today's focus totals:`, today.focusMinutes);
    const streak = await UserStatsService.getDailyStreak();
    console.log('Current daily streak:', streak);
  }
}

// Expose default for quick import
export default runStreakDebug;
