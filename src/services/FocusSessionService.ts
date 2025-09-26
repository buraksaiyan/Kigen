import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStatsService } from './userStatsService';
import { generateUniqueId } from '../utils/uniqueId';

interface FocusSession {
  id: string;
  mode: {
    id: string;
    title: string;
    color: string;
  };
  goal?: {
    id: string;
    title: string;
  };
  startTime: string;
  endTime?: string;
  duration: number; // planned duration in minutes
  actualDuration: number; // actual time spent in minutes
  completed: boolean;
  completionType: 'completed' | 'early-finish' | 'aborted'; // Track how session ended
  pointsEarned: number;
  date: string; // YYYY-MM-DD format
}

interface SessionStats {
  totalSessions: number;
  totalMinutes: number;
  totalPoints: number;
  bestStreak: number;
  currentStreak: number;
  modeStats: {
    [modeId: string]: {
      sessions: number;
      minutes: number;
      points: number;
    };
  };
}

const STORAGE_KEYS = {
  FOCUS_SESSIONS: '@inzone_focus_sessions',
  SESSION_STATS: '@inzone_session_stats',
  DAILY_POINTS: '@inzone_daily_points',
  LAST_SESSION_DATE: '@inzone_last_session_date',
  GOAL_COMPLETION_LOGS: '@inzone_goal_completion_logs',
};

class FocusSessionService {
  // Calculate points based on session duration and completion
  private calculatePoints(actualMinutes: number, completed: boolean, mode: string): number {
    // Exception for meditation: every minute counts (no minimum threshold)
    if (mode === 'meditation') {
      // For meditation, use +2 points per minute (like ratingSystem.ts)
      const basePoints = actualMinutes * 2;
      const completionBonus = completed ? basePoints * 0.2 : 0;
      return Math.ceil(basePoints + completionBonus);
    }
    
    // Minimum threshold for other modes - must focus for at least 5 minutes to get any points
    if (actualMinutes < 5) {
      return 0;
    }

    // Use proportional calculation: +20 pts per 30 minutes (like ratingSystem.ts)
    const pointsPerMinute = 20 / 30; // 0.666... points per minute
    const basePoints = actualMinutes * pointsPerMinute;
    
    // Completion bonus: extra 20% if fully completed
    const completionBonus = completed ? basePoints * 0.2 : 0;
    
    const totalPoints = basePoints + completionBonus;
    
    // Round up to keep number as integer
    return Math.ceil(totalPoints);
  }

  // Start a new focus session
  async startSession(mode: any, duration: number, goal?: any): Promise<string> {
    try {
      const sessionId = generateUniqueId();
      const startTime = new Date().toISOString();
      // Use local date instead of UTC
      const today = new Date();
      const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
      const date = localDate.toISOString().split('T')[0] as string;

      const session: FocusSession = {
        id: sessionId,
        mode: {
          id: mode.id,
          title: mode.title,
          color: mode.color,
        },
        goal: goal ? {
          id: goal.id,
          title: goal.title,
        } : undefined,
        startTime,
        duration,
        actualDuration: 0, // Will be updated when session completes
        completed: false,
        completionType: 'aborted', // Default to aborted, will be updated on completion
        pointsEarned: 0,
        date,
      };

      // Store the current session
      await AsyncStorage.setItem('@inzone_current_session', JSON.stringify(session));
      
      console.log('Focus session started:', session);
      return sessionId;
    } catch (error) {
      console.error('Error starting focus session:', error);
      throw error;
    }
  }

  // Complete a focus session
  async completeSession(sessionId: string, completed: boolean = true, completionType: 'completed' | 'early-finish' | 'aborted' = 'completed'): Promise<void> {
    try {
      const currentSessionData = await AsyncStorage.getItem('@inzone_current_session');
      if (!currentSessionData) {
        console.error('No current session found');
        return;
      }

      const session: FocusSession = JSON.parse(currentSessionData);
      const endTime = new Date().toISOString();
      const actualMinutes = Math.floor(
        (new Date(endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60)
      );

      // Update session with actual time spent
      session.endTime = endTime;
      session.completed = completed;
      session.completionType = completionType; // Set completion type for display
      session.actualDuration = actualMinutes; // Set actual time spent
      
      // Calculate points (may be 0 if session is too short)
      session.pointsEarned = this.calculatePoints(actualMinutes, completed, session.mode.id);

      // Always save session for tracking purposes (users should see their attempts)
      await this.saveFocusSession(session);
      await this.updateSessionStats(session);
      
      // Only award points and update daily points if session meets minimum threshold OR is meditation
      if (actualMinutes >= 5 || session.mode.id === 'meditation') {
        if (session.pointsEarned > 0) {
          await this.updateDailyPoints(session.pointsEarned);
        }
        
        // Update UserStatsService with the completed session (only for truly completed sessions)
        if (completed) {
          await this.updateUserStats(session, actualMinutes);
        }
        
        console.log(`Focus session recorded: ${actualMinutes} minutes, ${session.pointsEarned} points earned${completed ? ' (completed)' : ' (not completed)'}`);
      } else {
        console.log(`Session recorded but too short (${actualMinutes} minutes), no points awarded`);
      }

      // Clear current session
      await AsyncStorage.removeItem('@inzone_current_session');
    } catch (error) {
      console.error('Error completing focus session:', error);
      throw error;
    }
  }

  // Early finish session (awards points based on time completed)
  async earlyFinishSession(sessionId: string): Promise<void> {
  console.log('Early finishing session:', sessionId);
    await this.completeSession(sessionId, false, 'early-finish'); // Mark as early finish with points
  console.log('Early finish completed for session:', sessionId);
  }

  // Abort session (no points awarded)
  async abortSession(_sessionId: string): Promise<void> {
    try {
      const currentSessionData = await AsyncStorage.getItem('@inzone_current_session');
      if (!currentSessionData) {
        console.error('No current session found');
        return;
      }

      const session: FocusSession = JSON.parse(currentSessionData);
      const endTime = new Date().toISOString();
      const actualMinutes = Math.floor(
        (new Date(endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60)
      );

      // Update session with actual time spent but no points
      session.endTime = endTime;
      session.completed = false;
      session.completionType = 'aborted'; // Mark as aborted
      session.actualDuration = actualMinutes;
      session.pointsEarned = 0; // No points for aborted sessions

      // Always save aborted sessions to history for tracking
      await this.saveFocusSession(session);
      
      // Update aborted sessions count in stats (negative impact on discipline)
      await this.updateSessionStats(session);
      
      console.log(`Focus session aborted: ${actualMinutes} minutes, no points earned`);

      // Clear current session
      await AsyncStorage.removeItem('@inzone_current_session');
    } catch (error) {
      console.error('Error aborting focus session:', error);
      throw error;
    }
  }

  // Save a focus session to history
  private async saveFocusSession(session: FocusSession): Promise<void> {
    try {
  console.log('Saving focus session:', {
        id: session.id,
        mode: session.mode.title,
        duration: session.actualDuration,
        completionType: session.completionType,
        points: session.pointsEarned
      });
      
      const existingSessions = await this.getFocusSessions();
      const updatedSessions = [session, ...existingSessions];
      
      // Keep only last 100 sessions to avoid storage bloat
      const limitedSessions = updatedSessions.slice(0, 100);
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.FOCUS_SESSIONS,
        JSON.stringify(limitedSessions)
      );
      
  console.log('Focus session saved successfully. Total sessions:', limitedSessions.length);
    } catch (error) {
  console.error('Error saving focus session:', error);
      throw error;
    }
  }

  // Get focus sessions
  async getFocusSessions(limit?: number): Promise<FocusSession[]> {
    try {
      const sessionsData = await AsyncStorage.getItem(STORAGE_KEYS.FOCUS_SESSIONS);
      if (!sessionsData) return [];
      
      const sessions: FocusSession[] = JSON.parse(sessionsData);
      return limit ? sessions.slice(0, limit) : sessions;
    } catch (error) {
      console.error('Error getting focus sessions:', error);
      return [];
    }
  }

  // Update daily points
  private async updateDailyPoints(points: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0] as string;
      const dailyPointsData = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_POINTS);
      
      let dailyPoints: { [date: string]: number } = {};
      if (dailyPointsData) {
        dailyPoints = JSON.parse(dailyPointsData);
      }

      dailyPoints[today] = (dailyPoints[today] || 0) + points;

      // Keep only last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0] as string;

      Object.keys(dailyPoints).forEach(date => {
        if (date < cutoffDate) {
          delete dailyPoints[date];
        }
      });

      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_POINTS, JSON.stringify(dailyPoints));
    } catch (error) {
      console.error('Error updating daily points:', error);
      throw error;
    }
  }

  // Get daily points (doesn't reset at midnight, persists)
  async getDailyPoints(date?: string): Promise<number> {
    try {
      const targetDate = date || (new Date().toISOString().split('T')[0] as string);
      const dailyPointsData = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_POINTS);
      
      if (!dailyPointsData) return 0;
      
      const dailyPoints: { [date: string]: number } = JSON.parse(dailyPointsData);
      return dailyPoints[targetDate] || 0;
    } catch (error) {
      console.error('Error getting daily points:', error);
      return 0;
    }
  }

  // Update session statistics
  private async updateSessionStats(session: FocusSession): Promise<void> {
    try {
      const statsData = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_STATS);
      let stats: SessionStats = {
        totalSessions: 0,
        totalMinutes: 0,
        totalPoints: 0,
        bestStreak: 0,
        currentStreak: 0,
        modeStats: {},
      };

      if (statsData) {
        stats = JSON.parse(statsData);
      }

      // Update totals
      stats.totalSessions += 1;
      stats.totalMinutes += session.actualDuration || session.duration;
      stats.totalPoints += session.pointsEarned;

      // Update mode stats
      const modeId = session.mode.id;
      if (!stats.modeStats[modeId]) {
        stats.modeStats[modeId] = { sessions: 0, minutes: 0, points: 0 };
      }
      stats.modeStats[modeId].sessions += 1;
      stats.modeStats[modeId].minutes += session.actualDuration || session.duration;
      stats.modeStats[modeId].points += session.pointsEarned;

      // Update streak
      if (session.completed) {
        const lastSessionDate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SESSION_DATE);
        const today = new Date().toISOString().split('T')[0] as string;
        
        if (lastSessionDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0] as string;
          
          if (lastSessionDate === yesterdayStr || lastSessionDate === today) {
            stats.currentStreak += 1;
          } else {
            stats.currentStreak = 1;
          }
        } else {
          stats.currentStreak = 1;
        }

        stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_SESSION_DATE, today);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.SESSION_STATS, JSON.stringify(stats));
    } catch (error) {
      console.error('Error updating session stats:', error);
      throw error;
    }
  }

  // Get session statistics
  async getSessionStats(): Promise<SessionStats> {
    try {
      const statsData = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_STATS);
      if (!statsData) {
        return {
          totalSessions: 0,
          totalMinutes: 0,
          totalPoints: 0,
          bestStreak: 0,
          currentStreak: 0,
          modeStats: {},
        };
      }
      return JSON.parse(statsData);
    } catch (error) {
      console.error('Error getting session stats:', error);
      return {
        totalSessions: 0,
        totalMinutes: 0,
        totalPoints: 0,
        bestStreak: 0,
        currentStreak: 0,
        modeStats: {},
      };
    }
  }

  // Get current active session
  async getCurrentSession(): Promise<FocusSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem('@inzone_current_session');
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  // Cancel current session
  async cancelSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem('@inzone_current_session');
      console.log('Focus session cancelled');
    } catch (error) {
      console.error('Error cancelling session:', error);
      throw error;
    }
  }

  // Get focus session logs formatted for inzone Stats display
  async getInzoneStatsLogs(limit: number = 50): Promise<Array<{
    id: string;
    action: string;
    points: string;
    date: string;
    type: 'gain' | 'loss';
  }>> {
    try {
      const sessions = await this.getFocusSessions(limit);
      
      return sessions.map(session => {
        const action = session.completed 
          ? `${session.mode.title} session completed${session.goal ? ` (${session.goal.title})` : ''}`
          : `${session.mode.title} session stopped${session.goal ? ` (${session.goal.title})` : ''}`;
        
        const points = session.pointsEarned > 0 ? `+${session.pointsEarned}` : '0';
        const type: 'gain' | 'loss' = session.pointsEarned > 0 ? 'gain' : 'loss';
        
        return {
          id: session.id,
          action,
          points,
          date: this.formatDate(session.startTime),
          type
        };
      }).filter(log => log.points !== '0'); // Only show logs where points were earned
    } catch (error) {
      console.error('Error getting inzone stats logs:', error);
      return [];
    }
  }

  // Helper method to format dates consistently
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  }
  async getTodaysSummary(): Promise<{
    sessions: number;
    minutes: number;
    points: number;
    completedSessions: number;
  }> {
    try {
      // Use local date instead of UTC
      const today = new Date();
      const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
      const todayString = localDate.toISOString().split('T')[0];
      const sessions = await this.getFocusSessions();
      
      const todaySessions = sessions.filter(session => session.date === todayString);
      const completedSessions = todaySessions.filter(session => session.completed);
      
      const summary = {
        sessions: todaySessions.length,
        minutes: todaySessions.reduce((sum, session) => sum + (session.actualDuration || session.duration), 0),
        points: todaySessions.reduce((sum, session) => sum + session.pointsEarned, 0),
        completedSessions: completedSessions.length,
      };

      return summary;
    } catch (error) {
      console.error('Error getting today\'s summary:', error);
      return { sessions: 0, minutes: 0, points: 0, completedSessions: 0 };
    }
  }

  // Update UserStatsService with completed session data
  private async updateUserStats(session: FocusSession, actualMinutes: number): Promise<void> {
    try {
      const today = await UserStatsService.getTodayActivity();
      
      // Update focus minutes for the specific mode
      switch(session.mode.id) {
        case 'flow':
          today.focusMinutes.flow += actualMinutes;
          break;
        case 'body':
          today.focusMinutes.body += actualMinutes;
          break;
        case 'meditation':
          today.focusMinutes.meditation += actualMinutes;
          break;
        case 'notech':
          today.focusMinutes.notech += actualMinutes;
          break;
      }
      
      // Update completed sessions count
      today.completedSessions += 1;
      
      // Save the updated activity
      await UserStatsService.updateTodayActivity(today);
      
      // Update monthly accumulation
      await UserStatsService.updateMonthlyStats();
      
      console.log(`UserStatsService updated: ${session.mode.id} +${actualMinutes} minutes`);
    } catch (error) {
      console.error('Error updating UserStatsService:', error);
    }
  }

  // Save a goal completion log
  async saveGoalCompletionLog(goalTitle: string, pointsEarned: number = 10): Promise<void> {
    try {
      const goalLog = {
        id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        goalTitle,
        pointsEarned,
        timestamp: new Date().toISOString(),
        type: 'goal_completion' as const
      };

      const existingLogs = await this.getGoalCompletionLogs();
      const updatedLogs = [goalLog, ...existingLogs];

      // Keep only last 100 goal completion logs
      const limitedLogs = updatedLogs.slice(0, 100);

      await AsyncStorage.setItem(
        STORAGE_KEYS.GOAL_COMPLETION_LOGS,
        JSON.stringify(limitedLogs)
      );

      console.log('🎯 Goal completion logged:', goalLog);
    } catch (error) {
      console.error('Error saving goal completion log:', error);
    }
  }

  // Get goal completion logs
  async getGoalCompletionLogs(limit: number = 50): Promise<Array<{
    id: string;
    goalTitle: string;
    pointsEarned: number;
    timestamp: string;
    type: 'goal_completion';
  }>> {
    try {
      const logsData = await AsyncStorage.getItem(STORAGE_KEYS.GOAL_COMPLETION_LOGS);
      if (!logsData) return [];

      const logs = JSON.parse(logsData);
      return logs.slice(0, limit);
    } catch (error) {
      console.error('Error getting goal completion logs:', error);
      return [];
    }
  }

  // Get journal entry logs for stats display
  async getJournalLogs(limit: number = 50): Promise<Array<{
    id: string;
    action: string;
    points: string;
    date: string;
    type: 'gain' | 'loss';
  }>> {
    try {
      const { UserStatsService } = await import('./userStatsService');
      return await UserStatsService.getJournalLogs(limit);
    } catch (error) {
      console.error('Error getting journal logs:', error);
      return [];
    }
  }
  async getCombinedInzoneStatsLogs(limit: number = 50): Promise<Array<{
    id: string;
    action: string;
    points: string;
    date: string;
    type: 'gain' | 'loss';
  }>> {
    try {
      const [focusLogs, goalLogs, journalLogs] = await Promise.all([
        this.getInzoneStatsLogs(limit),
        this.getGoalCompletionLogs(limit),
        this.getJournalLogs(limit)
      ]);

      console.log('📊 Combined stats logs:', {
        focusLogs: focusLogs.length,
        goalLogs: goalLogs.length,
        journalLogs: journalLogs.length
      });

      // Combine and sort by date (newest first)
      const combinedLogs = [
        ...focusLogs.map(log => ({
          ...log,
          sortDate: new Date(log.date).getTime()
        })),
        ...goalLogs.map(log => ({
          id: log.id,
          action: `Goal completed: ${log.goalTitle}`,
          points: `+${log.pointsEarned}`,
          date: this.formatDate(log.timestamp),
          type: 'gain' as const,
          sortDate: new Date(log.timestamp).getTime()
        })),
        ...journalLogs.map(log => ({
          ...log,
          sortDate: new Date(log.date).getTime()
        }))
      ].sort((a, b) => b.sortDate - a.sortDate);

      // Remove sortDate and limit results
      const result = combinedLogs.slice(0, limit).map(({ sortDate, ...log }) => log);
      console.log('📊 Final combined logs count:', result.length);
      return result;
    } catch (error) {
      console.error('Error getting combined inzone stats logs:', error);
      return [];
    }
  }
}

export const focusSessionService = new FocusSessionService();
export type { FocusSession, SessionStats };
