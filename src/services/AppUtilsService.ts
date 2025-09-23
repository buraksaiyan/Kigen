import { NativeModules } from 'react-native';

export interface InstalledApp {
  packageName: string;
  appName: string;
  icon: string; // Base64 encoded image
  category: 'social' | 'communication' | 'entertainment' | 'productivity' | 'gaming' | 'other';
  isSystemApp: boolean;
}

const { AppUtilsModule } = NativeModules;

class AppUtilsService {
  private static cachedApps: InstalledApp[] | null = null;

  /**
   * Get all installed apps (cached for performance)
   */
  static async getInstalledApps(forceRefresh: boolean = false): Promise<InstalledApp[]> {
    if (!this.cachedApps || forceRefresh) {
      try {
        this.cachedApps = await AppUtilsModule.getInstalledApps();
      } catch (error) {
        console.error('Error getting installed apps:', error);
        return [];
      }
    }
    return this.cachedApps || [];
  }

  /**
   * Get user-installed apps only (filter out system apps)
   */
  static async getUserApps(): Promise<InstalledApp[]> {
    const allApps = await this.getInstalledApps();
    return allApps.filter(app => !app.isSystemApp);
  }

  /**
   * Get social media apps specifically
   */
  static async getSocialMediaApps(): Promise<InstalledApp[]> {
    const allApps = await this.getInstalledApps();
    return allApps.filter(app => app.category === 'social');
  }

  /**
   * Get apps by category
   */
  static async getAppsByCategory(category: InstalledApp['category']): Promise<InstalledApp[]> {
    const allApps = await this.getInstalledApps();
    return allApps.filter(app => app.category === category);
  }

  /**
   * Get specific app icon
   */
  static async getAppIcon(packageName: string): Promise<string | null> {
    try {
      return await AppUtilsModule.getAppIcon(packageName);
    } catch (error) {
      console.error('Error getting app icon:', error);
      return null;
    }
  }

  /**
   * Get specific app info
   */
  static async getAppInfo(packageName: string): Promise<InstalledApp | null> {
    try {
      return await AppUtilsModule.getAppInfo(packageName);
    } catch (error) {
      console.error('Error getting app info:', error);
      return null;
    }
  }

  /**
   * Search apps by name
   */
  static async searchApps(query: string): Promise<InstalledApp[]> {
    const allApps = await this.getInstalledApps();
    const lowercaseQuery = query.toLowerCase();
    
    return allApps.filter(app => 
      app.appName.toLowerCase().includes(lowercaseQuery) ||
      app.packageName.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Check if app is installed
   */
  static async isAppInstalled(packageName: string): Promise<boolean> {
    try {
      const appInfo = await AppUtilsModule.getAppInfo(packageName);
      return !!appInfo;
    } catch {
      return false;
    }
  }

  /**
   * Get monitored apps (social media + communication)
   */
  static async getMonitoredApps(): Promise<InstalledApp[]> {
    const allApps = await this.getInstalledApps();
    return allApps.filter(app => 
      app.category === 'social' || 
      app.category === 'communication' ||
      app.category === 'entertainment'
    );
  }
}

export default AppUtilsService;
export { AppUtilsModule };
