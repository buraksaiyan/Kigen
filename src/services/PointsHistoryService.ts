import AsyncStorage from '@react-native-async-storage/async-storage';

export type PointSource = 
  | 'journal' 
  | 'goal_completed' 
  | 'goal_created'
  | 'focus_session' 
  | 'reminder_completed'
  | 'todo_completed' 
  | 'todo_created'
  | 'social_interaction' 
  | 'time_outside'
  | 'time_with_friends'
  | 'habit_streak'
  | 'achievement_unlocked'
  | 'daily_bonus'
  | 'weekly_bonus'
  | 'monthly_bonus';

export interface PointHistoryEntry {
  id: string;
  source: PointSource;
  points: number;
  description: string;
  category: 'DET' | 'DIS' | 'FOC' | 'JOU' | 'MEN' | 'PHY' | 'PRD' | 'SOC';
  timestamp: string;
  metadata?: {
    sessionDuration?: number;
    taskTitle?: string;
    goalTitle?: string;
    entryContent?: string;
    socialType?: string;
    reminderTitle?: string;
    achievementId?: string;
    streakCount?: number;
    moodRating?: number;
    hoursSpent?: number;
    activityType?: string;
  };
}

export interface DailyPointsSummary {
  date: string; // 'YYYY-MM-DD'
  totalPoints: number;
  pointsByCategory: Record<string, number>;
  pointsBySource: Record<PointSource, number>;
  entryCount: number;
  topSource: PointSource;
}

export interface WeeklyPointsSummary {
  weekStart: string; // 'YYYY-MM-DD' of Monday
  totalPoints: number;
  dailyBreakdown: DailyPointsSummary[];
  averagePerDay: number;
  bestDay: string;
  worstDay: string;
}

export interface MonthlyPointsSummary {
  month: string; // 'YYYY-MM'
  totalPoints: number;
  weeklyBreakdown: WeeklyPointsSummary[];
  averagePerDay: number;
  averagePerWeek: number;
  bestWeek: string;
  categoryDistribution: Record<string, number>;
  sourceDistribution: Record<PointSource, number>;
}

export class PointsHistoryService {
  private static POINTS_HISTORY_KEY = '@inzone_points_history';
  private static DAILY_SUMMARIES_KEY = '@inzone_daily_summaries';
  private static WEEKLY_SUMMARIES_KEY = '@inzone_weekly_summaries';
  private static MONTHLY_SUMMARIES_KEY = '@inzone_monthly_summaries';

  // Record a point earning event
  static async recordPoints(
    source: PointSource,
    points: number,
    category: string,
    description: string,
    metadata?: PointHistoryEntry['metadata']
  ): Promise<void> {
    try {
      const entry: PointHistoryEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        source,
        points,
        description,
        category: category as any,
        timestamp: new Date().toISOString(),
        metadata,
      };

      // Add to history
      await this.addHistoryEntry(entry);
      
      // Update daily summary
      await this.updateDailySummary(entry);

      console.log(`📊 Points recorded: +${points} ${category} (${source}) - ${description}`);
    } catch (error) {
      console.error('Error recording points:', error);
    }
  }

  // Add entry to history
  private static async addHistoryEntry(entry: PointHistoryEntry): Promise<void> {
    const historyData = await AsyncStorage.getItem(this.POINTS_HISTORY_KEY);
    const history: PointHistoryEntry[] = historyData ? JSON.parse(historyData) : [];
    
    history.unshift(entry); // Add to beginning
    
    // Keep only last 1000 entries to prevent storage bloat
    const trimmedHistory = history.slice(0, 1000);
    
    await AsyncStorage.setItem(this.POINTS_HISTORY_KEY, JSON.stringify(trimmedHistory));
  }

  // Update daily summary
  private static async updateDailySummary(entry: PointHistoryEntry): Promise<void> {
    const date = entry.timestamp.split('T')[0];
    if (!date) return;
    
    const summariesData = await AsyncStorage.getItem(this.DAILY_SUMMARIES_KEY);
    const summaries: Record<string, DailyPointsSummary> = summariesData ? JSON.parse(summariesData) : {};

    if (!summaries[date]) {
      summaries[date] = {
        date,
        totalPoints: 0,
        pointsByCategory: {},
        pointsBySource: {} as Record<PointSource, number>,
        entryCount: 0,
        topSource: 'journal',
      };
    }

    const summary = summaries[date];
    summary.totalPoints += entry.points;
    summary.entryCount += 1;
    summary.pointsByCategory[entry.category] = (summary.pointsByCategory[entry.category] || 0) + entry.points;
    summary.pointsBySource[entry.source] = (summary.pointsBySource[entry.source] || 0) + entry.points;

    // Update top source
    const sortedSources = Object.entries(summary.pointsBySource).sort(([,a], [,b]) => (b as number) - (a as number));
    summary.topSource = sortedSources[0]?.[0] as PointSource || 'journal';

    await AsyncStorage.setItem(this.DAILY_SUMMARIES_KEY, JSON.stringify(summaries));
  }

  // Get points history with filtering
  static async getPointsHistory(
    limit: number = 50,
    source?: PointSource,
    category?: string,
    startDate?: string,
    endDate?: string
  ): Promise<PointHistoryEntry[]> {
    try {
      const historyData = await AsyncStorage.getItem(this.POINTS_HISTORY_KEY);
      let history: PointHistoryEntry[] = historyData ? JSON.parse(historyData) : [];

      // Apply filters
      if (source) {
        history = history.filter(entry => entry.source === source);
      }
      if (category) {
        history = history.filter(entry => entry.category === category);
      }
      if (startDate) {
        history = history.filter(entry => entry.timestamp >= startDate);
      }
      if (endDate) {
        history = history.filter(entry => entry.timestamp <= endDate + 'T23:59:59.999Z');
      }

      return history.slice(0, limit);
    } catch (error) {
      console.error('Error getting points history:', error);
      return [];
    }
  }

  // Get daily summary
  static async getDailySummary(date: string): Promise<DailyPointsSummary | null> {
    try {
      const summariesData = await AsyncStorage.getItem(this.DAILY_SUMMARIES_KEY);
      const summaries: Record<string, DailyPointsSummary> = summariesData ? JSON.parse(summariesData) : {};
      return summaries[date] || null;
    } catch (error) {
      console.error('Error getting daily summary:', error);
      return null;
    }
  }

  // Get recent daily summaries
  static async getRecentDailySummaries(days: number = 7): Promise<DailyPointsSummary[]> {
    try {
      const summariesData = await AsyncStorage.getItem(this.DAILY_SUMMARIES_KEY);
      const summaries: Record<string, DailyPointsSummary> = summariesData ? JSON.parse(summariesData) : {};
      
      const sortedSummaries = Object.values(summaries)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, days);
        
      return sortedSummaries;
    } catch (error) {
      console.error('Error getting recent daily summaries:', error);
      return [];
    }
  }

  // Generate weekly summary
  static async generateWeeklySummary(weekStart: string): Promise<WeeklyPointsSummary> {
    const weekDays = [];
    const startDate = new Date(weekStart);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      if (dateString) {
        weekDays.push(dateString);
      }
    }

    const dailySummaries = await Promise.all(
      weekDays.map(date => this.getDailySummary(date))
    );

    const validSummaries = dailySummaries.filter(Boolean) as DailyPointsSummary[];
    const totalPoints = validSummaries.reduce((sum, summary) => sum + summary.totalPoints, 0);
    const averagePerDay = validSummaries.length > 0 ? totalPoints / 7 : 0;

    const bestDay = validSummaries.reduce((best, current) => 
      current.totalPoints > (best?.totalPoints || 0) ? current : best, validSummaries[0]);
    const worstDay = validSummaries.reduce((worst, current) => 
      current.totalPoints < (worst?.totalPoints || Infinity) ? current : worst, validSummaries[0]);

    return {
      weekStart,
      totalPoints,
      dailyBreakdown: validSummaries,
      averagePerDay,
      bestDay: bestDay?.date || weekStart,
      worstDay: worstDay?.date || weekStart,
    };
  }

  // Get total points for a date range
  static async getTotalPointsForRange(startDate: string, endDate: string): Promise<number> {
    const history = await this.getPointsHistory(1000, undefined, undefined, startDate, endDate);
    return history.reduce((sum, entry) => sum + entry.points, 0);
  }

  // Get category breakdown for a date range
  static async getCategoryBreakdown(startDate: string, endDate: string): Promise<Record<string, number>> {
    const history = await this.getPointsHistory(1000, undefined, undefined, startDate, endDate);
    const breakdown: Record<string, number> = {};
    
    history.forEach(entry => {
      breakdown[entry.category] = (breakdown[entry.category] || 0) + entry.points;
    });
    
    return breakdown;
  }

  // Get source breakdown for a date range
  static async getSourceBreakdown(startDate: string, endDate: string): Promise<Record<PointSource, number>> {
    const history = await this.getPointsHistory(1000, undefined, undefined, startDate, endDate);
    const breakdown: Record<PointSource, number> = {} as Record<PointSource, number>;
    
    history.forEach(entry => {
      breakdown[entry.source] = (breakdown[entry.source] || 0) + entry.points;
    });
    
    return breakdown;
  }

  // Get streak information
  static async getPointsStreak(): Promise<{ current: number; best: number; lastDate: string }> {
    try {
      const summariesData = await AsyncStorage.getItem(this.DAILY_SUMMARIES_KEY);
      const summaries: Record<string, DailyPointsSummary> = summariesData ? JSON.parse(summariesData) : {};
      
      const sortedDates = Object.keys(summaries).sort().reverse();
      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;
      let lastDate = '';

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];

      if (!today || !yesterdayString) {
        return { current: 0, best: 0, lastDate: '' };
      }

      // Check for current streak
      let streakDate = today;
      if (!summaries[today] || summaries[today]?.totalPoints === 0) {
        streakDate = yesterdayString;
      }

      for (const date of sortedDates) {
        const summary = summaries[date];
        if (summary && summary.totalPoints > 0) {
          if (date === streakDate) {
            currentStreak++;
            lastDate = date;
            const prevDate = new Date(date);
            prevDate.setDate(prevDate.getDate() - 1);
            streakDate = prevDate.toISOString().split('T')[0] || '';
          } else {
            break;
          }
        } else {
          break;
        }
      }

      // Calculate best streak
      for (const date of sortedDates.reverse()) {
        const summary = summaries[date];
        if (summary && summary.totalPoints > 0) {
          tempStreak++;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }

      return { current: currentStreak, best: bestStreak, lastDate };
    } catch (error) {
      console.error('Error calculating points streak:', error);
      return { current: 0, best: 0, lastDate: '' };
    }
  }

  // Clear all history (for testing/reset)
  static async clearAllHistory(): Promise<void> {
    await AsyncStorage.multiRemove([
      this.POINTS_HISTORY_KEY,
      this.DAILY_SUMMARIES_KEY,
      this.WEEKLY_SUMMARIES_KEY,
      this.MONTHLY_SUMMARIES_KEY,
    ]);
    console.log('🗑️ Points history cleared');
  }
}