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
      // Return mock users for development
      return [
        {
          id: 'mock-user-1',
          email: 'developer@kigen.app',
          name: 'Development User',
          created_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          user_metadata: { name: 'Development User' }
        },
        {
          id: 'mock-user-2', 
          email: 'test@example.com',
          name: 'Test User',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          user_metadata: { name: 'Test User' }
        }
      ];
    }

    try {
      // This requires admin privileges
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) throw error;
      
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
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    if (!this.isUsingRealSupabase()) {
      // Return mock stats for development
      return {
        totalUsers: 2,
        newUsersToday: 1,
        newUsersThisWeek: 2,
        newUsersThisMonth: 2,
        activeUsersToday: 1,
        emailConfirmedCount: 1
      };
    }

    try {
      const users = await this.getAllUsers();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      return {
        totalUsers: users.length,
        newUsersToday: users.filter(u => 
          new Date(u.created_at) >= today
        ).length,
        newUsersThisWeek: users.filter(u => 
          new Date(u.created_at) >= weekAgo
        ).length,
        newUsersThisMonth: users.filter(u => 
          new Date(u.created_at) >= monthAgo
        ).length,
        activeUsersToday: users.filter(u => 
          u.last_sign_in_at && new Date(u.last_sign_in_at) >= today
        ).length,
        emailConfirmedCount: users.filter(u => 
          u.email_confirmed_at !== null
        ).length
      };
    } catch (error) {
      console.error('Error calculating user stats:', error);
      throw error;
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
