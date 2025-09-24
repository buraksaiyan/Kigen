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
        console.error('Error syncing with global leaderboard:', error);
        return;
      }

      console.log('Successfully synced user data to global leaderboard');
      
      // Fetch updated global leaderboard and cache it
      const globalData = await this.fetchGlobalLeaderboardFromSupabase();
      await this.cacheLeaderboard(globalData);
      
    } catch (error) {
      console.error('Error syncing with global leaderboard:', error);
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
        console.error('Error fetching global leaderboard:', error);
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

  // Get global leaderboard (fetch from Supabase)
  static async getGlobalLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    try {
      // Try to fetch fresh data from Supabase
      const freshData = await this.fetchGlobalLeaderboardFromSupabase(limit);
      
      if (freshData.length > 0) {
        // Cache the fresh data
        await this.cacheLeaderboard(freshData);
        return freshData;
      }
      
      // If Supabase fails, fall back to cached data
      const cached = await this.getCachedLeaderboard();
      if (cached.length > 0) {
        return cached.slice(0, limit);
      }
      
      // If everything fails, generate mock data for testing
      console.warn('Using mock leaderboard data - check Supabase connection');
      const mockData = await this.getMockGlobalLeaderboard();
      await this.cacheLeaderboard(mockData);
      return mockData.slice(0, limit);
      
    } catch (error) {
      console.error('Error getting global leaderboard:', error);
      
      // Fall back to cached or mock data
      const cached = await this.getCachedLeaderboard();
      return cached.length > 0 ? cached.slice(0, limit) : [];
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

  // Mock global leaderboard for testing
  private static async getMockGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
    const mockNames = [
      'ZenMaster', 'FocusWarrior', 'MindfulSage', 'ProductivityNinja', 'FlowState',
      'DeepThinker', 'ConcentrationKing', 'MeditationGuru', 'TaskCrusher', 'MindfulWarrior'
    ];

    const mockCountries = ['US', 'JP', 'DE', 'CA', 'AU', 'UK', 'FR', 'NL', 'SE', 'NO'];
    const cardTiers = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

    return mockNames.map((name, index) => ({
      id: `mock_user_${index}`,
      username: name,
      totalPoints: Math.floor(Math.random() * 5000) + 1000,
      monthlyPoints: Math.floor(Math.random() * 1000) + 200,
      weeklyPoints: Math.floor(Math.random() * 300) + 50,
      overallRating: Math.floor(Math.random() * 100) + 50,
      cardTier: cardTiers[Math.floor(Math.random() * cardTiers.length)] || 'Bronze',
      country: mockCountries[Math.floor(Math.random() * mockCountries.length)],
      lastUpdated: new Date().toISOString(),
    })).sort((a, b) => b.totalPoints - a.totalPoints);
  }
}

export default LeaderboardService;
export type { LeaderboardEntry, UserLeaderboardData };
