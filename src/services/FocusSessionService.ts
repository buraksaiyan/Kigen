import AsyncStorage from '@react-native-async-storage/async-storage';

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
  duration: number; // in minutes
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
  private calculatePoints(duration: number, completed: boolean, mode: string): number {
    const basePoints = Math.floor(duration / 5); // 1 point per 5 minutes
    const completionBonus = completed ? Math.floor(duration * 0.2) : 0;
    
    // Mode-specific multipliers
    const modeMultipliers = {
      'executioner': 1.5, // Higher reward for high-intensity mode
      'flow': 1.2,
      'meditation': 1.1,
      'body': 1.1,
      'notech': 1.0,
    };
    
    const multiplier = modeMultipliers[mode as keyof typeof modeMultipliers] || 1.0;
    return Math.floor((basePoints + completionBonus) * multiplier);
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
      const actualDuration = Math.floor(
        (new Date(endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60)
      );

      // Update session
      session.endTime = endTime;
      session.completed = completed;
      session.pointsEarned = this.calculatePoints(actualDuration, completed, session.mode.id);

      // Save to sessions history
      await this.saveFocusSession(session);

      // Update daily points
      await this.updateDailyPoints(session.pointsEarned);

      // Update stats
      await this.updateSessionStats(session);

      // Clear current session
      await AsyncStorage.removeItem('@kigen_current_session');

      console.log('Focus session completed:', session);
    } catch (error) {
      console.error('Error completing focus session:', error);
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
      stats.totalMinutes += session.duration;
      stats.totalPoints += session.pointsEarned;

      // Update mode stats
      const modeId = session.mode.id;
      if (!stats.modeStats[modeId]) {
        stats.modeStats[modeId] = { sessions: 0, minutes: 0, points: 0 };
      }
      stats.modeStats[modeId].sessions += 1;
      stats.modeStats[modeId].minutes += session.duration;
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

  // Get today's sessions summary
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
        minutes: todaySessions.reduce((sum, session) => sum + session.duration, 0),
        points: todaySessions.reduce((sum, session) => sum + session.pointsEarned, 0),
        completedSessions: completedSessions.length,
      };

      return summary;
    } catch (error) {
      console.error('Error getting today\'s summary:', error);
      return { sessions: 0, minutes: 0, points: 0, completedSessions: 0 };
    }
  }
}

export const focusSessionService = new FocusSessionService();
export type { FocusSession, SessionStats };
