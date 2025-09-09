import AsyncStorage from '@react-native-async-storage/async-storage';

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
  private static readonly STORAGE_KEY = '@kigen_leaderboard_cache';
  private static readonly USER_DATA_KEY = '@kigen_user_leaderboard_data';

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

  // Sync with global leaderboard (placeholder for Supabase integration)
  private static async syncWithGlobalLeaderboard(userEntry: LeaderboardEntry): Promise<void> {
    try {
      // TODO: Implement Supabase integration
      console.log('Syncing with global leaderboard:', userEntry);
      
      // For now, just simulate global leaderboard with mock data
      const mockGlobalData = await this.getMockGlobalLeaderboard();
      await this.cacheLeaderboard(mockGlobalData);
      
    } catch (error) {
      console.error('Error syncing with global leaderboard:', error);
    }
  }

  // Get global leaderboard (fetch from server)
  static async getGlobalLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    try {
      // TODO: Replace with actual Supabase call
      // For now, return cached data with some mock entries
      const cached = await this.getCachedLeaderboard();
      if (cached.length > 0) {
        return cached.slice(0, limit);
      }
      
      // Generate mock data for testing
      const mockData = await this.getMockGlobalLeaderboard();
      await this.cacheLeaderboard(mockData);
      return mockData.slice(0, limit);
      
    } catch (error) {
      console.error('Error getting global leaderboard:', error);
      return [];
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
