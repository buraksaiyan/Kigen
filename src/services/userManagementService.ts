import { supabase } from './supabase';
import { env } from '../config/env';

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  user_metadata?: {
    name?: string;
    [key: string]: any;
  };
}

export interface UserStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  activeUsersToday: number;
  emailConfirmedCount: number;
}

class UserManagementService {
  private static instance: UserManagementService;

  static getInstance(): UserManagementService {
    if (!UserManagementService.instance) {
      UserManagementService.instance = new UserManagementService();
    }
    return UserManagementService.instance;
  }

  /**
   * Check if we're using real Supabase or mock mode
   */
  isUsingRealSupabase(): boolean {
    return !env.supabaseUrl.includes('placeholder');
  }

  /**
   * Get all users (admin function - requires service role key)
   * Note: This requires a service role key, not the anon key
   */
  async getAllUsers(): Promise<User[]> {
    if (!this.isUsingRealSupabase()) {
      console.log('Supabase not configured - no user data available');
      return [];
    }

    try {
      // Try to use admin API first
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        // If admin API fails (AuthApiError), try to get users from user_stats table
        console.log('Admin API not available, trying alternative approach');
        const { data: userStatsData, error: statsError } = await supabase
          .from('user_stats')
          .select('user_id, username, created_at')
          .limit(100);
        
        if (statsError) {
          console.log('Cannot access user data - insufficient permissions');
          return [];
        }
        
        // Convert user_stats data to User format
        return (userStatsData || []).map((userStat: any) => ({
          id: userStat.user_id,
          email: 'N/A', // Not available without admin access
          name: userStat.username,
          created_at: userStat.created_at,
          last_sign_in_at: undefined,
          email_confirmed_at: undefined,
          user_metadata: {}
        }));
      }
      
      return data.users.map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
        user_metadata: user.user_metadata
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      // Return empty array instead of throwing to prevent crashes
      return [];
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    if (!this.isUsingRealSupabase()) {
      console.log('Supabase not configured - returning empty stats');
      return {
        totalUsers: 0,
        newUsersToday: 0,
        newUsersThisWeek: 0,
        newUsersThisMonth: 0,
        activeUsersToday: 0,
        emailConfirmedCount: 0
      };
    }

    try {
      // Try to get stats from user_stats table instead of admin API
      // This avoids AuthApiError for non-admin users
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .limit(1000); // Get sample of recent users

      if (statsError) {
        console.log('Unable to access user_stats table, falling back to basic stats');
        // Return minimal stats to avoid AuthApiError
        return {
          totalUsers: 1, // At least current user
          newUsersToday: 0,
          newUsersThisWeek: 0,
          newUsersThisMonth: 0,
          activeUsersToday: 1, // At least current user
          emailConfirmedCount: 1
        };
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Calculate stats from available data
      const stats = statsData || [];
      
      return {
        totalUsers: stats.length,
        newUsersToday: stats.filter((s: any) => 
          new Date(s.created_at) >= today
        ).length,
        newUsersThisWeek: stats.filter((s: any) => 
          new Date(s.created_at) >= weekAgo
        ).length,
        newUsersThisMonth: stats.filter((s: any) => 
          new Date(s.created_at) >= monthAgo
        ).length,
        activeUsersToday: stats.filter((s: any) => 
          s.last_active && new Date(s.last_active) >= today
        ).length,
        emailConfirmedCount: stats.length // Assume confirmed if in stats
      };
    } catch (error) {
      console.error('Error calculating user stats:', error);
      // Return safe fallback instead of throwing
      return {
        totalUsers: 0,
        newUsersToday: 0,
        newUsersThisWeek: 0,
        newUsersThisMonth: 0,
        activeUsersToday: 0,
        emailConfirmedCount: 0
      };
    }
  }

  /**
   * Export users to CSV format
   */
  async exportUsersCSV(): Promise<string> {
    const users = await this.getAllUsers();
    
    const headers = ['ID', 'Email', 'Name', 'Created At', 'Last Sign In', 'Email Confirmed'];
    const rows = users.map(user => [
      user.id,
      user.email,
      user.name || '',
      user.created_at,
      user.last_sign_in_at || '',
      user.email_confirmed_at || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Search users by email or name
   */
  async searchUsers(query: string): Promise<User[]> {
    const users = await this.getAllUsers();
    const lowerQuery = query.toLowerCase();
    
    return users.filter(user => 
      user.email.toLowerCase().includes(lowerQuery) ||
      (user.name && user.name.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const users = await this.getAllUsers();
    return users.find(user => user.id === userId) || null;
  }

  /**
   * Delete user (admin function)
   */
  async deleteUser(userId: string): Promise<boolean> {
    if (!this.isUsingRealSupabase()) {
      console.log('Mock: Would delete user:', userId);
      return true;
    }

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  /**
   * Send promotional email to all users
   * Note: This is a placeholder - you'd integrate with your email service
   */
  async sendPromotionalEmail(subject: string, message: string): Promise<{
    sent: number;
    failed: number;
    emails: string[];
  }> {
    const users = await this.getAllUsers();
    const confirmedUsers = users.filter(user => user.email_confirmed_at);
    const emails = confirmedUsers.map(user => user.email);

    // This is where you'd integrate with your email service
    // (SendGrid, Mailgun, AWS SES, etc.)
    console.log('Would send promotional email to:', emails);
    console.log('Subject:', subject);
    console.log('Message:', message);

    return {
      sent: emails.length,
      failed: 0,
      emails
    };
  }
}

export const userManagementService = UserManagementService.getInstance();
