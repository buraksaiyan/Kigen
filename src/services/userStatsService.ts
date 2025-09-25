import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStats, UserRating, CardTier, RatingSystem } from './ratingSystem';
import LeaderboardService from './LeaderboardService';
import { generateUniqueId } from '../utils/uniqueId';
import { nativeUsageTracker } from './nativeUsageTracker';
import { PointsHistoryService } from './PointsHistoryService';

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
  // New counters needed for Determination (DET)
  achievementsUnlocked?: number;
  habitStreakWeeks?: number;
  completedTodoBullets?: number;
  focusMinutes: {
    flow: number;
    meditation: number;
    body: number;
    notech: number;
  };
  phoneUsageMinutes: number;
  socialMediaMinutes: number;
}

export class UserStatsService {
  private static USER_PROFILE_KEY = '@inzone_user_profile';
  private static USER_STATS_KEY = '@inzone_user_stats';
  private static MONTHLY_RECORDS_KEY = '@inzone_monthly_records';
  private static DAILY_ACTIVITY_KEY = '@inzone_daily_activity';
  private static CURRENT_RATING_CACHE_KEY = '@inzone_current_rating_cache';
  private static CACHE_EXPIRY_HOURS = 24; // Cache for 24 hours

  // User Profile Management
  static async createUserProfile(username: string, profileImage?: string): Promise<UserProfile> {
    const profile: UserProfile = {
      id: generateUniqueId(),
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
      const defaultUsername = `User${Date.now().toString().slice(-6)}`;
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
    // Use local date instead of UTC to avoid timezone issues
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
    const dateString = localDate.toISOString().substring(0, 10);
    return this.getDailyActivity(dateString);
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
        achievementsUnlocked: 0,
        habitStreakWeeks: 0,
        completedTodoBullets: 0,
        focusMinutes: {
          flow: 0,
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
      // Use local date for consistency
      const todayDate = new Date();
      const localDate = new Date(todayDate.getTime() - todayDate.getTimezoneOffset() * 60000);
      
      const today = await this.getTodayActivity();
      
      // Get total focus minutes
      const totalFocusMinutes = Object.values(today.focusMinutes).reduce((sum, minutes) => sum + minutes, 0);
      const flowFocusMinutes = today.focusMinutes.flow;
      const bodyFocusMinutes = today.focusMinutes.body;
      const meditationMinutes = today.focusMinutes.meditation;
      const noPhoneFocusMinutes = today.focusMinutes.notech;

      // Compute DET supporting inputs for today's stats
      const achievementsUnlocked = await this.getTotalUnlockedAchievements();
      const habitStreakWeeks = Math.floor((await this.getDailyStreak()) / 7);
      const completedTodoBullets = await this.getTotalCompletedTodoBullets();

      // Get today's social activities
      const todayString = localDate.toISOString().slice(0, 10);
      const todayTimeOutsideEntries = await PointsHistoryService.getPointsHistory(
        100, // Reasonable limit
        'time_outside',
        undefined,
        todayString,
        todayString
      );
      
      const todayTimeWithFriendsEntries = await PointsHistoryService.getPointsHistory(
        100, // Reasonable limit
        'time_with_friends',
        undefined,
        todayString,
        todayString
      );
      
      const todayHoursOutside = todayTimeOutsideEntries.reduce((sum, entry) => 
        sum + (entry.metadata?.hoursSpent || 0), 0
      );
      
      const todayHoursWithFriends = todayTimeWithFriendsEntries.reduce((sum, entry) => 
        sum + (entry.metadata?.hoursSpent || 0), 0
      );

      const stats: UserStats = {
        DIS: RatingSystem.calculateDisciplinePoints(
          today.completedSessions,
          today.completedGoals,
          today.journalEntries,
          bodyFocusMinutes / 60,
          today.abortedSessions
        ),
        FOC: RatingSystem.calculateFocusPoints(totalFocusMinutes, flowFocusMinutes),
        JOU: RatingSystem.calculateJournalingPoints(today.journalEntries),
        DET: RatingSystem.calculateDeterminationPoints(
          today.completedGoals,
          today.journalEntries,
          today.completedSessions,
          achievementsUnlocked,
          habitStreakWeeks,
          completedTodoBullets,
          today.phoneUsageMinutes,
          noPhoneFocusMinutes,
          await this.hasUsageAccess()
        ),
        MEN: RatingSystem.calculateMentalityPoints(meditationMinutes),
        PHY: RatingSystem.calculatePhysicalPoints(bodyFocusMinutes),
        SOC: RatingSystem.calculateSocialPoints(todayHoursOutside, todayHoursWithFriends),
        PRD: RatingSystem.calculateProductivityPoints(today.completedGoals, today.journalEntries, totalFocusMinutes)
      };

      return stats;
    } catch (error) {
      console.error('Error calculating current stats:', error);
  return { DIS: 0, FOC: 0, JOU: 0, DET: 0, MEN: 0, PHY: 0, SOC: 0, PRD: 0 };
    }
  }

  // Calculate stats for the entire current month (all days so far)
  static async calculateCurrentMonthStats(): Promise<UserStats> {
    try {
      // Use local date to get current month
      const today = new Date();
      const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
      const currentMonth = localDate.toISOString().slice(0, 7); // YYYY-MM
      const currentYear = localDate.getFullYear();
      const currentMonthNum = localDate.getMonth(); // 0-based month

      // Get all days in current month
      const daysInMonth = new Date(currentYear, currentMonthNum + 1, 0).getDate();

  let totalStats: UserStats = { DIS: 0, FOC: 0, JOU: 0, DET: 0, MEN: 0, PHY: 0, SOC: 0, PRD: 0 };
      let totalJournalEntries = 0;
      let totalCompletedSessions = 0;
      let totalAbortedSessions = 0;
      let totalCompletedGoals = 0;
      let totalFocusMinutes = {
        flow: 0,
        meditation: 0,
        body: 0,
        notech: 0
      };
      let totalPhoneUsageMinutes = 0;
      let totalSocialMediaMinutes = 0;
      let hasUsagePermission = await this.hasUsageAccess();

      // Aggregate all days in current month
      for (let day = 1; day <= daysInMonth; day++) {
        const dayString = `${currentMonth}-${day.toString().padStart(2, '0')}`;

        // Only process days up to today
        if (dayString <= localDate.toISOString().slice(0, 10)) {
          try {
            const dayActivity = await this.getDailyActivity(dayString);

            totalJournalEntries += dayActivity.journalEntries;
            totalCompletedSessions += dayActivity.completedSessions;
            totalAbortedSessions += dayActivity.abortedSessions;
            totalCompletedGoals += dayActivity.completedGoals;
            totalPhoneUsageMinutes += dayActivity.phoneUsageMinutes;
            totalSocialMediaMinutes += dayActivity.socialMediaMinutes;

            // Sum focus minutes by type
            totalFocusMinutes.flow += dayActivity.focusMinutes.flow;
            totalFocusMinutes.meditation += dayActivity.focusMinutes.meditation;
            totalFocusMinutes.body += dayActivity.focusMinutes.body;
            totalFocusMinutes.notech += dayActivity.focusMinutes.notech;
          } catch (error) {
            // Day might not exist yet, skip
            console.log(`📅 No data for ${dayString}, skipping`);
          }
        }
      }

      // Compute aggregated supporting inputs for DET over the month
      const achievementsUnlocked = await this.getTotalUnlockedAchievements();
      const habitStreakWeeks = Math.floor((await this.getDailyStreak()) / 7);
      const completedTodoBullets = await this.getTotalCompletedTodoBullets();

      // Calculate stats using aggregated monthly data
      const totalAllFocusMinutes = Object.values(totalFocusMinutes).reduce((sum, minutes) => sum + minutes, 0);

      // Calculate social points from monthly social activities
      const monthStartDate = `${currentMonth}-01`;
      const monthEndDate = `${currentMonth}-${daysInMonth.toString().padStart(2, '0')}`;
      
      const timeOutsideEntries = await PointsHistoryService.getPointsHistory(
        1000, // Large limit to get all entries
        'time_outside',
        undefined,
        monthStartDate,
        monthEndDate
      );
      
      const timeWithFriendsEntries = await PointsHistoryService.getPointsHistory(
        1000, // Large limit to get all entries
        'time_with_friends',
        undefined,
        monthStartDate,
        monthEndDate
      );
      
      const totalHoursOutside = timeOutsideEntries.reduce((sum, entry) => 
        sum + (entry.metadata?.hoursSpent || 0), 0
      );
      
      const totalHoursWithFriends = timeWithFriendsEntries.reduce((sum, entry) => 
        sum + (entry.metadata?.hoursSpent || 0), 0
      );

      const productivityPoints = RatingSystem.calculateProductivityPoints(totalCompletedGoals, totalJournalEntries, totalAllFocusMinutes);
      const socialPoints = RatingSystem.calculateSocialPoints(totalHoursOutside, totalHoursWithFriends);

      totalStats = {
        DIS: RatingSystem.calculateDisciplinePoints(
          totalCompletedSessions,
          totalCompletedGoals,
          totalJournalEntries,
          totalFocusMinutes.body / 60,
          totalAbortedSessions
        ),
        FOC: RatingSystem.calculateFocusPoints(totalAllFocusMinutes, totalFocusMinutes.flow),
        JOU: RatingSystem.calculateJournalingPoints(totalJournalEntries),
        DET: RatingSystem.calculateDeterminationPoints(
          totalCompletedGoals,
          totalJournalEntries,
          totalCompletedSessions,
          achievementsUnlocked,
          habitStreakWeeks,
          completedTodoBullets,
          totalPhoneUsageMinutes,
          totalFocusMinutes.notech,
          hasUsagePermission
        ),
        MEN: RatingSystem.calculateMentalityPoints(totalFocusMinutes.meditation),
        PHY: RatingSystem.calculatePhysicalPoints(totalFocusMinutes.body),
        SOC: socialPoints,
        PRD: productivityPoints
      };

      console.log('📅 Current month stats calculated:', totalStats, {
        productivityPoints,
        socialPoints,
        totalFocusMinutes,
        totalPhoneUsageMinutes,
      });

      return totalStats;
    } catch (error) {
      console.error('Error calculating current month stats:', error);
  return { DIS: 0, FOC: 0, JOU: 0, DET: 0, MEN: 0, PHY: 0, SOC: 0, PRD: 0 };
    }
  }

  // Helper: get total unlocked achievements using achievementService
  static async getTotalUnlockedAchievements(): Promise<number> {
    try {
      const { achievementService } = await import('./achievementService');
      return await achievementService.getUnlockedCount();
    } catch (error) {
      console.error('Error getting unlocked achievements count:', error);
      return 0;
    }
  }

  // Helper: count completed todo bullets from tasks storage (best-effort)
  static async getTotalCompletedTodoBullets(): Promise<number> {
    try {
      const TASKS_STORAGE_KEY = '@inzone_tasks';
      const data = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
      if (!data) return 0;
      const tasks = JSON.parse(data) as Array<{ completed?: boolean }>;
      return tasks.filter(t => t.completed).length;
    } catch (error) {
      console.error('Error counting completed todo bullets:', error);
      return 0;
    }
  }

  // Helper: increment today's completed todo bullets counter (used when a task is marked complete)
  static async incrementCompletedTodoBullets(count: number = 1): Promise<void> {
    try {
      const today = await this.getTodayActivity();
      today.completedTodoBullets = (today.completedTodoBullets || 0) + count;
      await this.saveDailyActivity(today);
      await this.updateMonthlyStats();
      // sync leaderboard asynchronously
      this.syncUserToLeaderboard().catch(e => console.error('Background leaderboard sync failed:', e));
    } catch (error) {
      console.error('Error incrementing completed todo bullets:', error);
    }
  }

  static async getCurrentRating(): Promise<UserRating> {
    try {
      // Try to get cached rating first
      const cachedData = await AsyncStorage.getItem(this.CURRENT_RATING_CACHE_KEY);
      if (cachedData) {
        const { rating, timestamp } = JSON.parse(cachedData);
        const cacheAge = Date.now() - timestamp;
        const cacheExpiryMs = this.CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

        // Use cache if it's less than CACHE_EXPIRY_HOURS old
        if (cacheAge < cacheExpiryMs) {
          console.log('📊 Using cached rating data (age:', Math.round(cacheAge / 1000 / 60), 'minutes)');
          return rating;
        }
      }

      // Cache miss or expired - calculate fresh rating
      console.log('📊 Calculating fresh rating data...');
      const monthlyStats = await this.calculateCurrentMonthStats();
      const monthlyPoints = RatingSystem.calculateTotalPoints(monthlyStats);
      const cardTier = RatingSystem.getCardTier(monthlyPoints);
      const overallRating = RatingSystem.calculateOverallRating(monthlyStats);

      const freshRating: UserRating = {
        stats: monthlyStats,
        overallRating,
        totalPoints: monthlyPoints,
        monthlyPoints,
        cardTier
      };

      // Cache the fresh rating
      const cacheData = {
        rating: freshRating,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(this.CURRENT_RATING_CACHE_KEY, JSON.stringify(cacheData));

      console.log('📊 Cached fresh rating data');
      return freshRating;
    } catch (error) {
      console.error('Error getting current rating:', error);
      // Return default rating on error
      return {
        stats: { DIS: 0, FOC: 0, JOU: 0, DET: 0, MEN: 0, PHY: 0, SOC: 0, PRD: 0 },
        overallRating: 0,
        totalPoints: 0,
        monthlyPoints: 0,
        cardTier: CardTier.Bronze
      };
    }
  }

  // Method to properly update monthly stats when activities occur
  static async updateMonthlyStats(): Promise<void> {
    // Use local date instead of UTC
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
    const currentMonth = localDate.toISOString().slice(0, 7);
    const todayString = localDate.toISOString().slice(0, 10);
    const lastUpdateKey = `@inzone_monthly_last_update_${currentMonth}`;
    const lastUpdate = await AsyncStorage.getItem(lastUpdateKey);
    
    // Only update if we haven't updated today
    if (lastUpdate !== todayString) {
      const todayStats = await this.calculateCurrentStats();
      const todayPoints = RatingSystem.calculateTotalPoints(todayStats);
      
      let monthlyRecord = await this.getMonthlyRecord(currentMonth);
      
      if (!monthlyRecord) {
        // First day of the month - create new record
        monthlyRecord = {
          month: currentMonth,
          stats: { ...todayStats },
          totalPoints: todayPoints,
          cardTier: RatingSystem.getCardTier(todayPoints)
        };
        console.log('📅 New month detected - created fresh monthly record for', currentMonth);
      } else {
        // Add today's stats to monthly accumulation
        const updatedStats = {
          DIS: monthlyRecord.stats.DIS + todayStats.DIS,
          FOC: monthlyRecord.stats.FOC + todayStats.FOC,
          JOU: monthlyRecord.stats.JOU + todayStats.JOU,
          DET: monthlyRecord.stats.DET + todayStats.DET,
          MEN: monthlyRecord.stats.MEN + todayStats.MEN,
          PHY: monthlyRecord.stats.PHY + todayStats.PHY,
          SOC: (monthlyRecord.stats.SOC || 0) + (todayStats.SOC || 0),
          PRD: (monthlyRecord.stats.PRD || 0) + (todayStats.PRD || 0)
        };
        
        const updatedTotalPoints = RatingSystem.calculateTotalPoints(updatedStats);
        
        monthlyRecord = {
          month: currentMonth,
          stats: updatedStats,
          totalPoints: updatedTotalPoints,
          cardTier: RatingSystem.getCardTier(updatedTotalPoints)
        };
      }
      
      const previousPoints = monthlyRecord ? monthlyRecord.totalPoints : 0;
      
      await this.saveMonthlyRecord(monthlyRecord);
      await AsyncStorage.setItem(lastUpdateKey, todayString);
      console.log('📅 Updated monthly stats for', currentMonth, 'total points:', monthlyRecord.totalPoints);
      
      // Invalidate cached rating since stats changed
      await this.invalidateRatingCache();
      
      // Only sync to leaderboard if points actually increased
      if (monthlyRecord.totalPoints > previousPoints) {
        console.log('📈 Points increased, syncing to leaderboard');
        this.syncUserToLeaderboard().catch(e => console.error('Background leaderboard sync failed:', e));
      }
    }
  }

  // Clear cached rating data (call when stats change)
  static async invalidateRatingCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CURRENT_RATING_CACHE_KEY);
      console.log('🗑️ Cleared rating cache');
    } catch (error) {
      console.error('Error clearing rating cache:', error);
    }
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

  // Calculate all-time stats (aggregate of all monthly records plus current month if not saved)
  static async calculateAllTimeStats(): Promise<UserStats> {
    try {
      const monthlyRecords = await this.getMonthlyRecords();
      const currentMonth = new Date().toISOString().slice(0, 7);

      // If no monthly records exist, return the current month's live stats
      if (!monthlyRecords || monthlyRecords.length === 0) {
        const currentStats = await this.calculateCurrentMonthStats();
        return { ...currentStats };
      }

      // If current month record exists, use all saved monthly records
      const currentMonthRecord = monthlyRecords.find(r => r.month === currentMonth);

      let agg: UserStats = { DIS: 0, FOC: 0, JOU: 0, DET: 0, MEN: 0, PHY: 0, SOC: 0, PRD: 0 };

      if (currentMonthRecord) {
        monthlyRecords.forEach(record => {
          agg.DIS += record.stats.DIS;
          agg.FOC += record.stats.FOC;
          agg.JOU += record.stats.JOU;
          agg.DET += record.stats.DET;
          agg.MEN += record.stats.MEN;
          agg.PHY += record.stats.PHY;
          agg.SOC += (record.stats.SOC || 0);
          agg.PRD += (record.stats.PRD || 0);
        });
      } else {
        // Sum historical records (excluding current month) and add live current month stats
        const historical = monthlyRecords.filter(r => r.month !== currentMonth);
        historical.forEach(record => {
          agg.DIS += record.stats.DIS;
          agg.FOC += record.stats.FOC;
          agg.JOU += record.stats.JOU;
          agg.DET += record.stats.DET;
          agg.MEN += record.stats.MEN;
          agg.PHY += record.stats.PHY;
          agg.SOC += (record.stats.SOC || 0);
          agg.PRD += (record.stats.PRD || 0);
        });

        // Add live current month
        const currentStats = await this.calculateCurrentMonthStats();
        agg.DIS += currentStats.DIS;
        agg.FOC += currentStats.FOC;
        agg.JOU += currentStats.JOU;
        agg.DET += currentStats.DET;
        agg.MEN += currentStats.MEN;
        agg.PHY += currentStats.PHY;
        agg.SOC += (currentStats.SOC || 0);
        agg.PRD += (currentStats.PRD || 0);
      }

      return agg;
    } catch (error) {
      console.error('Error calculating all-time stats:', error);
      return { DIS: 0, FOC: 0, JOU: 0, DET: 0, MEN: 0, PHY: 0, SOC: 0, PRD: 0 };
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

      // Calculate and record points for focus session - matches determination and productivity calculations
      const sessionPoints = 5; // 5 points per session (determination: per 10 sessions = 50 points)
      const hourlyPoints = Math.ceil(minutes / 60) * 5; // 5 points per hour (productivity)
      const totalPoints = sessionPoints + hourlyPoints;
      
      await PointsHistoryService.recordPoints(
        'focus_session',
        totalPoints,
        'DET', // Determination for session completion
        `${type} focus session completed (${minutes} min)`,
        { sessionDuration: minutes, taskTitle: `${type} session` }
      );
    } else {
      today.abortedSessions += 1;
    }

    await this.saveDailyActivity(today);
    
    // Update monthly accumulation
    await this.updateMonthlyStats();
    
    // Check for new achievements
    if (completed) {
      const { achievementService } = await import('./achievementService');
      await achievementService.checkAchievements();
    }
    
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

    // Calculate points for journal entry - matches productivity calculation (+10 per entry)
    const points = 10;
    
    // Record points in history
    await PointsHistoryService.recordPoints(
      'journal',
      points,
      'PRD',
      'Journal entry completed',
      { entryContent: 'Journal entry' }
    );

    // Update monthly accumulation
    await this.updateMonthlyStats();

    // Check for new achievements
    const { achievementService } = await import('./achievementService');
    await achievementService.checkAchievements();

    // Sync with leaderboard asynchronously (don't block journal saving)
    this.syncUserToLeaderboard().catch(error => {
      console.error('Background leaderboard sync failed:', error);
    });
  }

  static async recordGoalCompletion(): Promise<void> {
    // Ensure user profile exists
    await this.ensureUserProfile();
    
    const today = await this.getTodayActivity();
    today.completedGoals += 1;
    await this.saveDailyActivity(today);
    
    // Calculate points for goal completion - matches productivity calculation (+10 per goal)
    const points = 10;
    
    // Record points in history
    await PointsHistoryService.recordPoints(
      'goal_completed',
      points,
      'PRD',
      'Goal completed',
      { goalTitle: 'Goal completion' }
    );
    
    // Update monthly accumulation
    await this.updateMonthlyStats();
    
    // Check for new achievements
    const { achievementService } = await import('./achievementService');
    await achievementService.checkAchievements();
    
    // Sync with leaderboard asynchronously (don't block goal completion)
    this.syncUserToLeaderboard().catch(error => {
      console.error('Background leaderboard sync failed:', error);
    });
  }

  static async recordTodoCompletion(title: string): Promise<void> {
    // Ensure user profile exists
    await this.ensureUserProfile();
    
    const today = await this.getTodayActivity();
    today.completedTodoBullets = (today.completedTodoBullets || 0) + 1;
    await this.saveDailyActivity(today);
    
    // Calculate points for todo completion
    const points = 5; // 5 points per todo completion (determination)
    
    // Record points in history
    await PointsHistoryService.recordPoints(
      'todo_completed',
      points,
      'DET',
      'Todo completed',
      { taskTitle: title }
    );
    
    // Update monthly accumulation
    await this.updateMonthlyStats();
    
    // Sync with leaderboard asynchronously
    this.syncUserToLeaderboard().catch(error => {
      console.error('Background leaderboard sync failed:', error);
    });
  }

  static async recordTodoCreation(title: string): Promise<void> {
    // Ensure user profile exists
    await this.ensureUserProfile();
    
    // Record points for creating a todo
    const points = 1; // Small reward for planning/organizing
    
    // Record points in history
    await PointsHistoryService.recordPoints(
      'todo_created',
      points,
      'DET',
      'Todo created',
      { taskTitle: title }
    );
    
    // Update monthly accumulation
    await this.updateMonthlyStats();
  }

  static async recordReminderCompletion(title: string): Promise<void> {
    // Ensure user profile exists
    await this.ensureUserProfile();
    
    // Record points for completing a reminder
    const points = 2; // Points for following through on reminders
    
    // Record points in history
    await PointsHistoryService.recordPoints(
      'reminder_completed',
      points,
      'DET',
      'Reminder completed',
      { reminderTitle: title }
    );
    
    // Update monthly accumulation
    await this.updateMonthlyStats();
    
    // Sync with leaderboard asynchronously
    this.syncUserToLeaderboard().catch(error => {
      console.error('Background leaderboard sync failed:', error);
    });
  }

  static async recordGoalCreation(title: string): Promise<void> {
    // Ensure user profile exists
    await this.ensureUserProfile();
    
    // Record points for creating a goal
    const points = 2; // Points for goal setting
    
    // Record points in history
    await PointsHistoryService.recordPoints(
      'goal_created',
      points,
      'DIS',
      'Goal created',
      { goalTitle: title }
    );
    
    // Update monthly accumulation
    await this.updateMonthlyStats();
  }

  static async recordTimeSpentOutside(hours: number): Promise<void> {
    // Ensure user profile exists
    await this.ensureUserProfile();
    
    // Calculate points for time spent outside - matches social calculation (+15 per hour)
    const points = hours * 15;
    
    // Record points in history
    await PointsHistoryService.recordPoints(
      'time_outside',
      points,
      'SOC',
      `Spent ${hours} hour(s) outside`,
      { hoursSpent: hours, activityType: 'time_outside' }
    );
    
    // Update monthly accumulation
    await this.updateMonthlyStats();
    
    // Sync with leaderboard asynchronously
    this.syncUserToLeaderboard().catch(error => {
      console.error('Background leaderboard sync failed:', error);
    });
  }

  static async recordTimeSpentWithFriends(hours: number): Promise<void> {
    // Ensure user profile exists
    await this.ensureUserProfile();
    
    // Calculate points for time spent with friends - matches social calculation (+20 per hour)
    const points = hours * 20;
    
    // Record points in history
    await PointsHistoryService.recordPoints(
      'time_with_friends',
      points,
      'SOC',
      `Spent ${hours} hour(s) with friends`,
      { hoursSpent: hours, activityType: 'time_with_friends' }
    );
    
    // Update monthly accumulation
    await this.updateMonthlyStats();
    
    // Sync with leaderboard asynchronously
    this.syncUserToLeaderboard().catch(error => {
      console.error('Background leaderboard sync failed:', error);
    });
  }

  static async recordHabitStreak(streakCount: number): Promise<void> {
    // Ensure user profile exists
    await this.ensureUserProfile();
    
    // Progressive points for streak milestones
    let points = 0;
    if (streakCount >= 7) points += 10; // Weekly milestone
    if (streakCount >= 30) points += 25; // Monthly milestone
    if (streakCount >= 100) points += 50; // 100-day milestone
    
    if (points > 0) {
      // Record points in history
      await PointsHistoryService.recordPoints(
        'habit_streak',
        points,
        'DET',
        `Habit streak milestone: ${streakCount} days`,
        { streakCount }
      );
      
      // Update monthly accumulation
      await this.updateMonthlyStats();
    }
  }

  static async recordAchievementUnlock(achievementId: string, achievementName: string, points: number): Promise<void> {
    // Ensure user profile exists
    await this.ensureUserProfile();
    
    const today = await this.getTodayActivity();
    today.achievementsUnlocked = (today.achievementsUnlocked || 0) + 1;
    await this.saveDailyActivity(today);
    
    // Record points in history
    await PointsHistoryService.recordPoints(
      'achievement_unlocked',
      points,
      'DET',
      `Achievement unlocked: ${achievementName}`,
      { achievementId }
    );
    
    // Update monthly accumulation
    await this.updateMonthlyStats();
    
    // Sync with leaderboard asynchronously
    this.syncUserToLeaderboard().catch(error => {
      console.error('Background leaderboard sync failed:', error);
    });
  }

  static async recordDailyBonus(): Promise<void> {
    // Ensure user profile exists
    await this.ensureUserProfile();
    
    const points = 10; // Daily login bonus
    
    // Record points in history
    await PointsHistoryService.recordPoints(
      'daily_bonus',
      points,
      'DET',
      'Daily login bonus',
    );
    
    // Update monthly accumulation
    await this.updateMonthlyStats();
  }

  static async hasUsageAccess(): Promise<boolean> {
    return await nativeUsageTracker.hasUsageAccessPermission();
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
    // For now, return current user data with proper lifetime calculation
    const profile = await this.getUserProfile();
    
      const achievementsUnlocked = await this.getTotalUnlockedAchievements();
      const habitStreakWeeks = Math.floor((await this.getDailyStreak()) / 7);
      const completedTodoBullets = await this.getTotalCompletedTodoBullets();

    if (profile) {
      // Calculate lifetime stats using centralized helper (includes saved months + live current month)
      const lifetimeStats = await this.calculateAllTimeStats();
      const totalPoints = RatingSystem.calculateTotalPoints(lifetimeStats);
      const cardTier = RatingSystem.getCardTier(totalPoints);

      return [{
        userId: profile.id,
        username: profile.username,
        totalPoints,
        cardTier
      }];
    }
    
    return [];
  }

  static async getMonthlyLeaderboard(month?: string): Promise<Array<{ userId: string; username: string; monthlyPoints: number; cardTier: CardTier }>> {
    // This would typically fetch from a backend service
    // For now, return current user data
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const profile = await this.getUserProfile();
    
    if (!profile) return [];
    
    // If requesting current month and no record exists, use live monthly stats
    if (targetMonth === currentMonth) {
      const monthlyRecord = await this.getMonthlyRecord(targetMonth);
      
      if (monthlyRecord) {
        // Use saved record
        return [{
          userId: profile.id,
          username: profile.username,
          monthlyPoints: monthlyRecord.totalPoints,
          cardTier: monthlyRecord.cardTier
        }];
      } else {
        // No saved record, use live monthly stats
        const monthlyStats = await this.calculateCurrentMonthStats();
        const monthlyPoints = RatingSystem.calculateTotalPoints(monthlyStats);
        const cardTier = RatingSystem.getCardTier(monthlyPoints);
        
        return [{
          userId: profile.id,
          username: profile.username,
          monthlyPoints,
          cardTier
        }];
      }
    } else {
      // For historical months, only return if record exists
      const monthlyRecord = await this.getMonthlyRecord(targetMonth);
      if (monthlyRecord) {
        return [{
          userId: profile.id,
          username: profile.username,
          monthlyPoints: monthlyRecord.totalPoints,
          cardTier: monthlyRecord.cardTier
        }];
      }
    }
    
    return [];
  }

  // Get total completed goals across all time
  static async getTotalCompletedGoals(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const activityKeys = keys.filter(key => key.startsWith(`${this.DAILY_ACTIVITY_KEY}_`));
      
      let totalGoals = 0;
      for (const key of activityKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const activity: DailyActivity = JSON.parse(data);
            totalGoals += activity.completedGoals;
          }
        } catch (error) {
          console.error('Error parsing daily activity:', error);
        }
      }
      
      return totalGoals;
    } catch (error) {
      console.error('Error getting total completed goals:', error);
      return 0;
    }
  }

  // Development/Debug utility methods
  static async clearAllData(): Promise<void> {
    try {
      // Get all keys
      const keys = await AsyncStorage.getAllKeys();
      
      // Filter for inzone-related keys but EXCLUDE important user data
      const inzoneKeys = keys.filter(key => 
        (key.includes('@inzone') || 
         key.includes('daily_activity') ||
         key.includes('monthly_records')) &&
        !key.includes('user_profile') && // Keep user profile (username, etc)
        !key.includes('goals') // Keep goals data
      );
      
      // Remove selected inzone data but preserve user profile and goals
      await AsyncStorage.multiRemove(inzoneKeys);
      console.log('🗑️ Cleared inzone stats data from AsyncStorage (preserved username and goals)');
      
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  // Get journal entry logs for stats display
  static async getJournalLogs(limit: number = 50): Promise<Array<{
    id: string;
    action: string;
    points: string;
    date: string;
    type: 'gain' | 'loss';
  }>> {
    try {
      const { journalStorage } = await import('../services/journalStorage');
      const entries = await journalStorage.getAllEntries();
      
      console.log('📔 Found journal entries:', entries.length);
      
      // Sort by date (newest first) and limit
      const recentEntries = entries
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
      
      console.log('📔 Recent journal entries for logs:', recentEntries.length);
      
      return recentEntries.map(entry => ({
        id: entry.id,
        action: 'Journal entry written',
        points: '+20', // Journal entries award 20 points each
        date: new Date(entry.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        type: 'gain' as const
      }));
    } catch (error) {
      console.error('Error getting journal logs:', error);
      return [];
    }
  }

  static async getDailyStreak(): Promise<number> {
    try {
      const activities = await this.getAllDailyActivities();
      
      if (activities.length === 0) {
        return 0;
      }

      // Sort activities by date (most recent first)
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      let streak = 0;
      const todayStr = new Date().toISOString().split('T')[0];
      let currentDate = new Date(todayStr!);
      
      // Check if today has both journal entry AND completed focus session
      const todayActivity = activities.find(a => a.date === todayStr);
      const hasTodayValidStreak = todayActivity && (
        todayActivity.journalEntries > 0 &&
        todayActivity.completedSessions > 0
      );
      
      if (!hasTodayValidStreak) {
        // If no valid streak activity today, check yesterday
        currentDate.setDate(currentDate.getDate() - 1);
      }
      
      // Count consecutive days with both journal entries AND completed focus sessions
      while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const activity = activities.find(a => a.date === dateStr);
        
        const hasValidStreakActivity = activity && (
          activity.journalEntries > 0 &&
          activity.completedSessions > 0
        );
        
        if (hasValidStreakActivity) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating daily streak:', error);
      return 0;
    }
  }

  private static async getAllDailyActivities(): Promise<DailyActivity[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const activityKeys = keys.filter(key => key.startsWith(`${this.DAILY_ACTIVITY_KEY}_`));
      
      const activities: DailyActivity[] = [];
      for (const key of activityKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const activity: DailyActivity = JSON.parse(data);
            activities.push(activity);
          }
        } catch (error) {
          console.error('Error parsing daily activity:', error);
        }
      }
      
      return activities;
    } catch (error) {
      console.error('Error getting daily activities:', error);
      return [];
    }
  }

  // Sync current user data to leaderboard
  static async syncUserToLeaderboard(): Promise<void> {
    try {
      const profile = await this.getUserProfile();
      if (!profile) {
        console.log('No user profile found, skipping leaderboard sync');
        return;
      }

      const currentRating = await this.getCurrentRating();
      
      const userLeaderboardData = {
        username: profile.username,
        totalPoints: currentRating.totalPoints,
        monthlyPoints: currentRating.monthlyPoints,
        weeklyPoints: 0, // TODO: Implement weekly calculation if needed
        overallRating: currentRating.overallRating,
        cardTier: currentRating.cardTier,
        country: undefined // TODO: Add country support if needed
      };

      await LeaderboardService.updateUserData(userLeaderboardData);
      console.log('✅ Synced user data to leaderboard:', userLeaderboardData);
    } catch (error) {
      console.error('Error syncing user to leaderboard:', error);
    }
  }

  // Achievement stats methods
  static async getTotalCompletedHabits(): Promise<number> {
    try {
      const completedHabitsData = await AsyncStorage.getItem('@inzone_completed_habits');
      const completedHabits = completedHabitsData ? JSON.parse(completedHabitsData) : [];
      return completedHabits.length;
    } catch (error) {
      console.error('Error getting total completed habits:', error);
      return 0;
    }
  }

  static async getTotalCompletedTodos(): Promise<number> {
    try {
      const completedTodosData = await AsyncStorage.getItem('@inzone_completed_todos');
      const completedTodos = completedTodosData ? JSON.parse(completedTodosData) : [];
      return completedTodos.length;
    } catch (error) {
      console.error('Error getting total completed todos:', error);
      return 0;
    }
  }

  static async getTotalActiveReminders(): Promise<number> {
    try {
      const remindersData = await AsyncStorage.getItem('@inzone_reminders');
      const reminders = remindersData ? JSON.parse(remindersData) : [];
      const activeReminders = reminders.filter((r: any) => r.isActive);
      return activeReminders.length;
    } catch (error) {
      console.error('Error getting total active reminders:', error);
      return 0;
    }
  }

  static async getTotalSocialReductionHours(): Promise<number> {
    try {
      const monthlyStats = await this.calculateCurrentMonthStats();
      return Math.floor(monthlyStats.SOC / 60); // Convert minutes to hours
    } catch (error) {
      console.error('Error getting total social reduction hours:', error);
      return 0;
    }
  }
}
