import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStats, UserRating, CardTier, RatingSystem } from './ratingSystem';
import LeaderboardService from './LeaderboardService';

interface UserProfile {
  id: string;
  username: string;
  profileImage?: string;
  createdAt: Date;
  lastUpdated: Date;
}

interface MonthlyRecord {
  month: string; // Format: 'YYYY-MM'
  stats: UserStats;
  totalPoints: number;
  cardTier: CardTier;
}

interface DailyActivity {
  date: string; // Format: 'YYYY-MM-DD'
  journalEntries: number;
  completedSessions: number;
  abortedSessions: number;
  completedGoals: number;
  focusMinutes: {
    flow: number;
    executioner: number;
    meditation: number;
    body: number;
    notech: number;
  };
  phoneUsageMinutes: number;
  socialMediaMinutes: number;
}

export class UserStatsService {
  private static USER_PROFILE_KEY = '@kigen_user_profile';
  private static USER_STATS_KEY = '@kigen_user_stats';
  private static MONTHLY_RECORDS_KEY = '@kigen_monthly_records';
  private static DAILY_ACTIVITY_KEY = '@kigen_daily_activity';

  // User Profile Management
  static async createUserProfile(username: string, profileImage?: string): Promise<UserProfile> {
    const profile: UserProfile = {
      id: Date.now().toString(),
      username,
      profileImage,
      createdAt: new Date(),
      lastUpdated: new Date()
    };
    
    await AsyncStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(profile));
    
    // Immediately sync to leaderboard after creating profile
    await this.syncUserToLeaderboard();
    
    return profile;
  }

  // Ensure user is logged in and has profile
  static async ensureUserProfile(): Promise<UserProfile> {
    let profile = await this.getUserProfile();
    if (!profile) {
      // Create default profile if none exists
      const defaultUsername = `Player${Date.now().toString().slice(-6)}`;
      profile = await this.createUserProfile(defaultUsername);
      console.log('✅ Created default user profile:', defaultUsername);
    }
    return profile;
  }  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const profileData = await AsyncStorage.getItem(this.USER_PROFILE_KEY);
      if (profileData) {
        const profile = JSON.parse(profileData);
        profile.createdAt = new Date(profile.createdAt);
        profile.lastUpdated = new Date(profile.lastUpdated);
        return profile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  static async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    const profile = await this.getUserProfile();
    if (profile) {
      const updatedProfile = {
        ...profile,
        ...updates,
        lastUpdated: new Date()
      };
      await AsyncStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(updatedProfile));
    }
  }

  // Daily Activity Tracking
  static async getTodayActivity(): Promise<DailyActivity> {
    const today = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
    return this.getDailyActivity(today);
  }

  static async getDailyActivity(date: string): Promise<DailyActivity> {
    try {
      const key = `${this.DAILY_ACTIVITY_KEY}_${date}`;
      const activityData = await AsyncStorage.getItem(key);
      
      if (activityData) {
        return JSON.parse(activityData);
      }

      // Return default activity for new day
      const defaultActivity: DailyActivity = {
        date,
        journalEntries: 0,
        completedSessions: 0,
        abortedSessions: 0,
        completedGoals: 0,
        focusMinutes: {
          flow: 0,
          executioner: 0,
          meditation: 0,
          body: 0,
          notech: 0
        },
        phoneUsageMinutes: 0,
        socialMediaMinutes: 0
      };

      await this.saveDailyActivity(defaultActivity);
      return defaultActivity;
    } catch (error) {
      console.error('Error getting daily activity:', error);
      throw error;
    }
  }

  static async saveDailyActivity(activity: DailyActivity): Promise<void> {
    try {
      const key = `${this.DAILY_ACTIVITY_KEY}_${activity.date}`;
      await AsyncStorage.setItem(key, JSON.stringify(activity));
    } catch (error) {
      console.error('Error saving daily activity:', error);
      throw error;
    }
  }

  static async updateTodayActivity(updates: Partial<Omit<DailyActivity, 'date'>>): Promise<void> {
    const today = await this.getTodayActivity();
    const updatedActivity = { ...today, ...updates };
    await this.saveDailyActivity(updatedActivity);
  }

  // Stats Calculation and Management
  static async calculateCurrentStats(): Promise<UserStats> {
    try {
      const today = await this.getTodayActivity();
      
      // Get total focus minutes
      const totalFocusMinutes = Object.values(today.focusMinutes).reduce((sum, minutes) => sum + minutes, 0);
      const flowFocusMinutes = today.focusMinutes.flow;
      const executionMinutes = today.focusMinutes.executioner;
      const bodyFocusMinutes = today.focusMinutes.body;
      const meditationMinutes = today.focusMinutes.meditation;
      const noPhoneFocusMinutes = today.focusMinutes.notech;

      const stats: UserStats = {
        DIS: RatingSystem.calculateDisciplinePoints(
          today.completedSessions,
          today.completedGoals,
          today.journalEntries,
          executionMinutes / 60,
          bodyFocusMinutes / 60,
          today.abortedSessions,
          today.socialMediaMinutes
        ),
        FOC: RatingSystem.calculateFocusPoints(totalFocusMinutes, flowFocusMinutes),
        JOU: RatingSystem.calculateJournalingPoints(today.journalEntries),
        USA: RatingSystem.calculateUsagePoints(today.phoneUsageMinutes, noPhoneFocusMinutes),
        MEN: RatingSystem.calculateMentalityPoints(meditationMinutes),
        PHY: RatingSystem.calculatePhysicalPoints(bodyFocusMinutes)
      };

      return stats;
    } catch (error) {
      console.error('Error calculating current stats:', error);
      return { DIS: 0, FOC: 0, JOU: 0, USA: 0, MEN: 0, PHY: 0 };
    }
  }

  static async getCurrentRating(): Promise<UserRating> {
    const stats = await this.calculateCurrentStats();
    const totalPoints = RatingSystem.calculateTotalPoints(stats);
    const overallRating = RatingSystem.calculateOverallRating(stats);
    const cardTier = RatingSystem.getCardTier(totalPoints);

    // Get monthly points (for current month only)
    const currentMonth = new Date().toISOString().slice(0, 7);
    let monthlyRecord = await this.getMonthlyRecord(currentMonth);
    
    // If no monthly record exists for current month, create one
    if (!monthlyRecord) {
      monthlyRecord = {
        month: currentMonth,
        stats,
        totalPoints,
        cardTier
      };
      await this.saveMonthlyRecord(monthlyRecord);
      console.log('📅 Created monthly record for', currentMonth);
    }
    
    const monthlyPoints = monthlyRecord.totalPoints;

    return {
      stats,
      overallRating,
      totalPoints,
      monthlyPoints,
      cardTier
    };
  }

  // Monthly Records Management
  static async getMonthlyRecord(month: string): Promise<MonthlyRecord | null> {
    try {
      const records = await this.getMonthlyRecords();
      return records.find(record => record.month === month) || null;
    } catch (error) {
      console.error('Error getting monthly record:', error);
      return null;
    }
  }

  static async getMonthlyRecords(): Promise<MonthlyRecord[]> {
    try {
      const recordsData = await AsyncStorage.getItem(this.MONTHLY_RECORDS_KEY);
      return recordsData ? JSON.parse(recordsData) : [];
    } catch (error) {
      console.error('Error getting monthly records:', error);
      return [];
    }
  }

  static async saveMonthlyRecord(record: MonthlyRecord): Promise<void> {
    try {
      const records = await this.getMonthlyRecords();
      const existingIndex = records.findIndex(r => r.month === record.month);
      
      if (existingIndex >= 0) {
        records[existingIndex] = record;
      } else {
        records.push(record);
      }

      await AsyncStorage.setItem(this.MONTHLY_RECORDS_KEY, JSON.stringify(records));
    } catch (error) {
      console.error('Error saving monthly record:', error);
      throw error;
    }
  }

  // Activity Recording Methods
  static async recordFocusSession(type: string, minutes: number, completed: boolean = true): Promise<void> {
    // Ensure user profile exists
    await this.ensureUserProfile();
    
    const today = await this.getTodayActivity();
    
    if (completed) {
      today.completedSessions += 1;
      
      // Add focus minutes by type
      switch (type) {
        case 'free':
          today.focusMinutes.flow += minutes;
          break;
        case 'executioner':
          today.focusMinutes.executioner += minutes;
          break;
        case 'meditation':
          today.focusMinutes.meditation += minutes;
          break;
        case 'body':
          today.focusMinutes.body += minutes;
          break;
        case 'notech':
          today.focusMinutes.notech += minutes;
          break;
      }
    } else {
      today.abortedSessions += 1;
    }

    await this.saveDailyActivity(today);
    
    // Sync with leaderboard after focus session
    if (completed) {
      await this.syncUserToLeaderboard();
    }
  }

  static async recordJournalEntry(): Promise<void> {
    // Ensure user profile exists
    await this.ensureUserProfile();
    
    const today = await this.getTodayActivity();
    today.journalEntries += 1;
    await this.saveDailyActivity(today);
    
    // Sync with leaderboard after updating journal entry
    await this.syncUserToLeaderboard();
  }

  static async recordGoalCompletion(): Promise<void> {
    // Ensure user profile exists
    await this.ensureUserProfile();
    
    const today = await this.getTodayActivity();
    today.completedGoals += 1;
    await this.saveDailyActivity(today);
    
    // Sync with leaderboard after completing a goal
    await this.syncUserToLeaderboard();
  }

  static async updatePhoneUsage(minutes: number, socialMediaMinutes: number = 0): Promise<void> {
    const today = await this.getTodayActivity();
    today.phoneUsageMinutes = minutes;
    today.socialMediaMinutes = socialMediaMinutes;
    await this.saveDailyActivity(today);
  }

  // End of month processing
  static async processMonthEnd(): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const stats = await this.calculateCurrentStats();
    const totalPoints = RatingSystem.calculateTotalPoints(stats);
    const cardTier = RatingSystem.getCardTier(totalPoints);

    const monthlyRecord: MonthlyRecord = {
      month: currentMonth,
      stats,
      totalPoints,
      cardTier
    };

    await this.saveMonthlyRecord(monthlyRecord);
  }

  // Leaderboard data
  static async getLifetimeLeaderboard(): Promise<Array<{ userId: string; username: string; totalPoints: number; cardTier: CardTier }>> {
    // This would typically fetch from a backend service
    // For now, return current user data
    const profile = await this.getUserProfile();
    const rating = await this.getCurrentRating();
    
    if (profile) {
      return [{
        userId: profile.id,
        username: profile.username,
        totalPoints: rating.totalPoints,
        cardTier: rating.cardTier
      }];
    }
    
    return [];
  }

  static async getMonthlyLeaderboard(month?: string): Promise<Array<{ userId: string; username: string; monthlyPoints: number; cardTier: CardTier }>> {
    // This would typically fetch from a backend service
    // For now, return current user data
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const profile = await this.getUserProfile();
    const monthlyRecord = await this.getMonthlyRecord(targetMonth);
    
    if (profile && monthlyRecord) {
      return [{
        userId: profile.id,
        username: profile.username,
        monthlyPoints: monthlyRecord.totalPoints,
        cardTier: monthlyRecord.cardTier
      }];
    }
    
    return [];
  }

  // Sync user data to leaderboard
  static async syncUserToLeaderboard(): Promise<void> {
    try {
      const profile = await this.getUserProfile();
      const rating = await this.getCurrentRating();
      
      if (!profile) {
        console.warn('No user profile found, cannot sync to leaderboard');
        return;
      }

      const userData = {
        username: profile.username,
        totalPoints: rating.totalPoints,
        monthlyPoints: rating.monthlyPoints,
        weeklyPoints: rating.totalPoints, // TODO: Calculate proper weekly points
        overallRating: rating.overallRating,
        cardTier: rating.cardTier,
        country: 'Unknown' // TODO: Get from user profile
      };

      await LeaderboardService.updateUserData(userData);
      console.log('✅ Synced user data to leaderboard:', userData);
      
    } catch (error) {
      console.error('❌ Error syncing user to leaderboard:', error);
    }
  }
}
