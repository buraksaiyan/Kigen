import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

interface LeaderboardEntry {
  id: string;
  username: string;
  totalPoints: number;
  monthlyPoints: number;
  weeklyPoints: number;
  overallRating: number;
  cardTier: string;
  country?: string;
  lastUpdated: string;
  rank?: number; // Optional rank field for UI display
}

interface UserLeaderboardData {
  username: string;
  totalPoints: number;
  monthlyPoints: number;
  weeklyPoints: number;
  overallRating: number;
  cardTier: string;
  country?: string;
}

class LeaderboardService {
  private static readonly STORAGE_KEY = '@inzone_leaderboard_cache';
  private static readonly USER_DATA_KEY = '@inzone_user_leaderboard_data';

  // Get cached leaderboard data
  static async getCachedLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const cached = await AsyncStorage.getItem(this.STORAGE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error getting cached leaderboard:', error);
      return [];
    }
  }

  // Cache leaderboard data locally
  private static async cacheLeaderboard(data: LeaderboardEntry[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error caching leaderboard:', error);
    }
  }

  // Update user's leaderboard data
  static async updateUserData(userData: UserLeaderboardData): Promise<void> {
    try {
      const userEntry: LeaderboardEntry = {
        id: 'current_user', // In real implementation, use actual user ID
        ...userData,
        lastUpdated: new Date().toISOString(),
      };

      await AsyncStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userEntry));
      
      // TODO: Send to global leaderboard service (Supabase)
      await this.syncWithGlobalLeaderboard(userEntry);
      
    } catch (error) {
      console.error('Error updating user leaderboard data:', error);
    }
  }

  // Sync with global leaderboard (Supabase integration)
  private static async syncWithGlobalLeaderboard(userEntry: LeaderboardEntry): Promise<void> {
    try {
      // Upsert user data to Supabase leaderboard table
      const { error } = await supabase
        .from('leaderboard')
        .upsert([{
          user_id: userEntry.id,
          username: userEntry.username,
          total_points: userEntry.totalPoints,
          monthly_points: userEntry.monthlyPoints,
          weekly_points: userEntry.weeklyPoints,
          overall_rating: userEntry.overallRating,
          card_tier: userEntry.cardTier,
          country: userEntry.country,
          last_updated: userEntry.lastUpdated
        }], {
          onConflict: 'user_id'
        });

      if (error) {
        // Handle specific error codes
        if (error.code === '522' || error.message?.includes('522')) {
          console.warn('Supabase connection timeout (522). Leaderboard sync will retry later. Using local data for now.');
        } else {
          console.error('Error syncing with global leaderboard:', error);
        }
        return;
      }

      console.log('Successfully synced user data to global leaderboard');
      
      // Fetch updated global leaderboard and cache it
      const globalData = await this.fetchGlobalLeaderboardFromSupabase();
      await this.cacheLeaderboard(globalData);
      
    } catch (error: any) {
      // Handle network/connection errors specifically
      if (error.code === '522' || error.message?.includes('522') || error.message?.includes('timeout')) {
  console.warn('Network timeout while syncing leaderboard. Data will sync when connection improves.');
      } else {
        console.error('Error syncing with global leaderboard:', error);
      }
    }
  }

  // Fetch global leaderboard from Supabase
  private static async fetchGlobalLeaderboardFromSupabase(limit: number = 100): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(limit);

      if (error) {
        // Handle specific error codes
        if (error.code === '522' || error.message?.includes('522')) {
          console.warn('Supabase connection timeout (522). Using cached leaderboard data.');
        } else {
          console.error('Error fetching global leaderboard:', error);
        }
        return [];
      }

      // Transform Supabase data to LeaderboardEntry format
      return data.map(row => ({
        id: row.user_id,
        username: row.username,
        totalPoints: row.total_points,
        monthlyPoints: row.monthly_points,
        weeklyPoints: row.weekly_points,
        overallRating: row.overall_rating,
        cardTier: row.card_tier,
        country: row.country,
        lastUpdated: row.last_updated
      }));

    } catch (error) {
      console.error('Error fetching from Supabase:', error);
      return [];
    }
  }

  // Check if Supabase is available
  static async isSupabaseAvailable(): Promise<boolean> {
    try {
      const { error } = await supabase.from('leaderboard').select('count').limit(1).single();
      return !error;
    } catch {
      return false;
    }
  }

  // Get global leaderboard (fetch from Supabase)
  static async getGlobalLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    // Always try to include current user data
    const currentUserData = await AsyncStorage.getItem(this.USER_DATA_KEY);
    let currentUser: LeaderboardEntry | null = null;
    if (currentUserData) {
      currentUser = JSON.parse(currentUserData);
    }

    try {

      // Check if Supabase is available
      const isAvailable = await this.isSupabaseAvailable();

      if (!isAvailable) {
        console.warn('Supabase unavailable. Using cached leaderboard data.');
        const cached = await this.getCachedLeaderboard();

        // Merge current user with cached data
        let leaderboardData: LeaderboardEntry[] = [...cached];
        if (currentUser) {
          // Remove any existing entry for current user and add updated one
          leaderboardData = leaderboardData.filter((entry: LeaderboardEntry) => entry.id !== currentUser!.id);
          leaderboardData.push(currentUser);
          // Sort by total points
          leaderboardData.sort((a: LeaderboardEntry, b: LeaderboardEntry) => (b.totalPoints || 0) - (a.totalPoints || 0));
        }

        return leaderboardData.slice(0, limit);
      }

      // Try to fetch fresh data from Supabase
      const freshData = await this.fetchGlobalLeaderboardFromSupabase(limit);

      if (freshData.length > 0) {
        // Cache the fresh data
        await this.cacheLeaderboard(freshData);

        // Merge current user with fresh data
        let leaderboardData = [...freshData];
        if (currentUser) {
          // Remove any existing entry for current user and add updated one
          leaderboardData = leaderboardData.filter(entry => entry.id !== currentUser!.id);
          leaderboardData.push(currentUser);
          // Sort by total points
          leaderboardData.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
        }

        return leaderboardData.slice(0, limit);
      }

      // If Supabase fails, fall back to cached data
      const cached = await this.getCachedLeaderboard();
      if (cached.length > 0) {
        // Merge current user with cached data
        let leaderboardData = [...cached];
        if (currentUser) {
          leaderboardData = leaderboardData.filter(entry => entry.id !== currentUser!.id);
          leaderboardData.push(currentUser);
          leaderboardData.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
        }

        return leaderboardData.slice(0, limit);
      }
      
      // If everything fails, return empty array
      console.warn('No leaderboard data available - check Supabase connection');
      return currentUser ? [currentUser] : [];
      
    } catch (error) {
      console.error('Error getting global leaderboard:', error);
      
      // Fall back to cached data only
      const cached = await this.getCachedLeaderboard();

      // Merge current user with fallback data
      let leaderboardData = [...cached];
      if (currentUser) {
        leaderboardData = leaderboardData.filter(entry => entry.id !== currentUser!.id);
        leaderboardData.push(currentUser);
        leaderboardData.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
      }

      return leaderboardData.slice(0, limit);
    }
  }

  // Get user's rank in global leaderboard
  static async getUserRank(): Promise<number> {
    try {
      const userData = await AsyncStorage.getItem(this.USER_DATA_KEY);
      if (!userData) return -1;

      const user: LeaderboardEntry = JSON.parse(userData);
      const globalLeaderboard = await this.getGlobalLeaderboard();
      
      const rank = globalLeaderboard.findIndex(entry => entry.totalPoints <= user.totalPoints) + 1;
      return rank || globalLeaderboard.length + 1;
      
    } catch (error) {
      console.error('Error getting user rank:', error);
      return -1;
    }
  }

}

export default LeaderboardService;
export type { LeaderboardEntry, UserLeaderboardData };
