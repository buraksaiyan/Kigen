import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStatsService } from './userStatsService';

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
  FOCUS_SESSIONS: '@kigen_focus_sessions',
  SESSION_STATS: '@kigen_session_stats',
  DAILY_POINTS: '@kigen_daily_points',
  LAST_SESSION_DATE: '@kigen_last_session_date',
};

class FocusSessionService {
  // Calculate points based on session duration and completion
  private calculatePoints(actualMinutes: number, completed: boolean, mode: string): number {
    // Minimum threshold - must focus for at least 5 minutes to get any points
    if (actualMinutes < 5) {
      return 0;
    }

    const basePoints = Math.floor(actualMinutes / 5); // 1 point per 5 minutes
    const completionBonus = completed ? Math.floor(actualMinutes * 0.2) : 0;
    
    // Mode-specific multipliers
    const modeMultipliers = {
      'executioner': 1.5, // Higher reward for high-intensity mode
      'flow': 1.2,
      'meditation': 1.1,
      'body': 1.1,
      'notech': 1.0,
    };
    
    const multiplier = modeMultipliers[mode as keyof typeof modeMultipliers] || 1.0;
    const totalPoints = (basePoints + completionBonus) * multiplier;
    
    // Round up to keep number as integer
    return Math.ceil(totalPoints);
  }

  // Start a new focus session
  async startSession(mode: any, duration: number, goal?: any): Promise<string> {
    try {
      const sessionId = Date.now().toString();
      const startTime = new Date().toISOString();
      const date = new Date().toISOString().split('T')[0] as string;

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
        pointsEarned: 0,
        date,
      };

      // Store the current session
      await AsyncStorage.setItem('@kigen_current_session', JSON.stringify(session));
      
      console.log('Focus session started:', session);
      return sessionId;
    } catch (error) {
      console.error('Error starting focus session:', error);
      throw error;
    }
  }

  // Complete a focus session
  async completeSession(sessionId: string, completed: boolean = true): Promise<void> {
    try {
      const currentSessionData = await AsyncStorage.getItem('@kigen_current_session');
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
      session.actualDuration = actualMinutes; // Set actual time spent
      session.pointsEarned = this.calculatePoints(actualMinutes, completed, session.mode.id);

      // Only save to history if minimum time threshold is met
      if (actualMinutes >= 5) {
        await this.saveFocusSession(session);
        await this.updateDailyPoints(session.pointsEarned);
        await this.updateSessionStats(session);
        
        // Update UserStatsService with the completed session
        await this.updateUserStats(session, actualMinutes);
        
        console.log(`Focus session recorded: ${actualMinutes} minutes, ${session.pointsEarned} points earned`);
      } else {
        console.log(`Session too short (${actualMinutes} minutes), no points awarded`);
      }

      // Clear current session
      await AsyncStorage.removeItem('@kigen_current_session');
    } catch (error) {
      console.error('Error completing focus session:', error);
      throw error;
    }
  }

  // Early finish session (awards points based on time completed)
  async earlyFinishSession(sessionId: string): Promise<void> {
    await this.completeSession(sessionId, false); // Mark as not fully completed but award points
  }

  // Abort session (no points awarded)
  async abortSession(sessionId: string): Promise<void> {
    try {
      const currentSessionData = await AsyncStorage.getItem('@kigen_current_session');
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
      session.actualDuration = actualMinutes;
      session.pointsEarned = 0; // No points for aborted sessions

      // Always save aborted sessions to history for tracking
      await this.saveFocusSession(session);
      
      // Update aborted sessions count in stats (negative impact on discipline)
      await this.updateSessionStats(session);
      
      console.log(`Focus session aborted: ${actualMinutes} minutes, no points earned`);

      // Clear current session
      await AsyncStorage.removeItem('@kigen_current_session');
    } catch (error) {
      console.error('Error aborting focus session:', error);
      throw error;
    }
  }

  // Save a focus session to history
  private async saveFocusSession(session: FocusSession): Promise<void> {
    try {
      const existingSessions = await this.getFocusSessions();
      const updatedSessions = [session, ...existingSessions];
      
      // Keep only last 100 sessions to avoid storage bloat
      const limitedSessions = updatedSessions.slice(0, 100);
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.FOCUS_SESSIONS,
        JSON.stringify(limitedSessions)
      );
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
      const sessionData = await AsyncStorage.getItem('@kigen_current_session');
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  // Cancel current session
  async cancelSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem('@kigen_current_session');
      console.log('Focus session cancelled');
    } catch (error) {
      console.error('Error cancelling session:', error);
      throw error;
    }
  }

  // Get focus session logs formatted for Kigen Stats display
  async getKigenStatsLogs(limit: number = 50): Promise<Array<{
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
      console.error('Error getting Kigen stats logs:', error);
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
      const today = new Date().toISOString().split('T')[0];
      const sessions = await this.getFocusSessions();
      
      const todaySessions = sessions.filter(session => session.date === today);
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
        case 'executioner':
          today.focusMinutes.executioner += actualMinutes;
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
      
      console.log(`UserStatsService updated: ${session.mode.id} +${actualMinutes} minutes`);
    } catch (error) {
      console.error('Error updating UserStatsService:', error);
    }
  }
}

export const focusSessionService = new FocusSessionService();
export type { FocusSession, SessionStats };
