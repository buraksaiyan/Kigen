import AsyncStorage from '@react-native-async-storage/async-storage';

export type DashboardSectionType = 
  | 'userCard'
  | 'activeGoals' 
  | 'activeHabits'
  | 'activeTodos'
  | 'activeReminders'
  | 'phoneUsage';

export interface DashboardSection {
  id: DashboardSectionType;
  title: string;
  description: string;
  enabled: boolean;
  order: number;
  icon: string; // MaterialIcons icon name
  category: 'core' | 'productivity' | 'wellness' | 'analytics';
}

export interface DashboardLayout {
  sections: DashboardSection[];
  version: number;
  lastUpdated: string;
}

export class DashboardCustomizationService {
  private static DASHBOARD_LAYOUT_KEY = '@inzone_dashboard_layout';
  
  // Default dashboard configuration
  private static DEFAULT_SECTIONS: DashboardSection[] = [
    {
      id: 'userCard',
      title: 'User Progress Card',
      description: 'Your current rank, stats, and progress overview',
      enabled: true,
      order: 0,
      icon: 'person',
      category: 'core',
    },
    {
      id: 'activeGoals',
      title: 'Active Goals',
      description: 'View and manage your current goals',
      enabled: true,
      order: 1,
      icon: 'flag',
      category: 'productivity',
    },
    {
      id: 'activeHabits',
      title: 'Active Habits',
      description: 'Track your daily habit progress',
      enabled: true,
      order: 2,
      icon: 'repeat',
      category: 'wellness',
    },
    {
      id: 'activeTodos',
      title: 'Active Todos',
      description: 'Manage your task list and priorities',
      enabled: true,
      order: 3,
      icon: 'check-circle',
      category: 'productivity',
    },
    {
      id: 'activeReminders',
      title: 'Active Reminders',
      description: 'View your upcoming reminders and notifications',
      enabled: true,
      order: 4,
      icon: 'notifications',
      category: 'productivity',
    },
    {
      id: 'phoneUsage',
      title: 'Digital Wellness',
      description: 'Monitor your phone usage and screen time',
      enabled: true,
      order: 5,
      icon: 'phone-android',
      category: 'analytics',
    },
  ];

  // Get current dashboard layout
  static async getDashboardLayout(): Promise<DashboardLayout> {
    try {
      const stored = await AsyncStorage.getItem(this.DASHBOARD_LAYOUT_KEY);
      if (stored) {
        const layout: DashboardLayout = JSON.parse(stored);
        
        // Migrate or validate layout if needed
        const migratedLayout = this.migrateDashboardLayout(layout);
        if (migratedLayout.version !== layout.version) {
          await this.saveDashboardLayout(migratedLayout);
          return migratedLayout;
        }
        
        return layout;
      }
      
      // Create default layout if none exists
      const defaultLayout: DashboardLayout = {
        sections: [...this.DEFAULT_SECTIONS],
        version: 1,
        lastUpdated: new Date().toISOString(),
      };
      
      await this.saveDashboardLayout(defaultLayout);
      return defaultLayout;
    } catch (error) {
      console.error('Error loading dashboard layout:', error);
      return {
        sections: [...this.DEFAULT_SECTIONS],
        version: 1,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  // Save dashboard layout
  static async saveDashboardLayout(layout: DashboardLayout): Promise<void> {
    try {
      layout.lastUpdated = new Date().toISOString();
      await AsyncStorage.setItem(this.DASHBOARD_LAYOUT_KEY, JSON.stringify(layout));
      console.log('✅ Dashboard layout saved');
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
      throw error;
    }
  }

  // Get enabled sections in order
  static async getEnabledSections(): Promise<DashboardSection[]> {
    const layout = await this.getDashboardLayout();
    return layout.sections
      .filter(section => section.enabled)
      .sort((a, b) => a.order - b.order);
  }

  // Get disabled sections
  static async getDisabledSections(): Promise<DashboardSection[]> {
    const layout = await this.getDashboardLayout();
    return layout.sections
      .filter(section => !section.enabled)
      .sort((a, b) => a.order - b.order);
  }

  // Toggle section enabled/disabled
  static async toggleSection(sectionId: DashboardSectionType): Promise<void> {
    const layout = await this.getDashboardLayout();
    const section = layout.sections.find(s => s.id === sectionId);
    
    if (section) {
      section.enabled = !section.enabled;
      
      // If disabling, move to end of order
      if (!section.enabled) {
        section.order = Math.max(...layout.sections.map(s => s.order)) + 1;
      } else {
        // If enabling, place in appropriate position
        const enabledSections = layout.sections.filter(s => s.enabled && s.id !== sectionId);
        section.order = enabledSections.length;
        
        // Reorder all sections to maintain sequence
        this.normalizeOrder(layout.sections);
      }
      
      await this.saveDashboardLayout(layout);
    }
  }

  // Reorder sections
  static async reorderSections(newOrder: DashboardSectionType[]): Promise<void> {
    const layout = await this.getDashboardLayout();
    
    // Update order based on new array
    newOrder.forEach((sectionId, index) => {
      const section = layout.sections.find(s => s.id === sectionId);
      if (section) {
        section.order = index;
      }
    });
    
    await this.saveDashboardLayout(layout);
  }

  // Reset to default layout
  static async resetToDefault(): Promise<void> {
    const defaultLayout: DashboardLayout = {
      sections: [...this.DEFAULT_SECTIONS],
      version: 1,
      lastUpdated: new Date().toISOString(),
    };
    
    await this.saveDashboardLayout(defaultLayout);
  }

  // Get section by ID
  static async getSection(sectionId: DashboardSectionType): Promise<DashboardSection | null> {
    const layout = await this.getDashboardLayout();
    return layout.sections.find(s => s.id === sectionId) || null;
  }

  // Update section settings
  static async updateSection(sectionId: DashboardSectionType, updates: Partial<DashboardSection>): Promise<void> {
    const layout = await this.getDashboardLayout();
    const section = layout.sections.find(s => s.id === sectionId);
    
    if (section) {
      Object.assign(section, updates);
      await this.saveDashboardLayout(layout);
    }
  }

  // Get sections by category
  static async getSectionsByCategory(category: DashboardSection['category']): Promise<DashboardSection[]> {
    const layout = await this.getDashboardLayout();
    return layout.sections
      .filter(section => section.category === category)
      .sort((a, b) => a.order - b.order);
  }

  // Private helper to reorder sections maintaining sequence
  private static normalizeOrder(sections: DashboardSection[]): void {
    const enabled = sections
      .filter(s => s.enabled)
      .sort((a, b) => a.order - b.order);
    
    const disabled = sections
      .filter(s => !s.enabled)
      .sort((a, b) => a.order - b.order);
    
    // Reassign orders
    enabled.forEach((section, index) => {
      section.order = index;
    });
    
    disabled.forEach((section, index) => {
      section.order = enabled.length + index;
    });
  }

  // Private helper for layout migration
  private static migrateDashboardLayout(layout: DashboardLayout): DashboardLayout {
    // Future migrations can be added here
    // For now, just ensure all default sections exist
    const currentIds = layout.sections.map(s => s.id);
    const missingDefaults = this.DEFAULT_SECTIONS.filter(
      defaultSection => !currentIds.includes(defaultSection.id)
    );
    
    if (missingDefaults.length > 0) {
      // Add missing sections to the end
      const maxOrder = Math.max(...layout.sections.map(s => s.order), -1);
      missingDefaults.forEach((section, index) => {
        layout.sections.push({
          ...section,
          order: maxOrder + index + 1,
        });
      });
      
      layout.version = 1;
    }
    
    return layout;
  }

  // Export layout for backup
  static async exportLayout(): Promise<string> {
    const layout = await this.getDashboardLayout();
    return JSON.stringify(layout, null, 2);
  }

  // Import layout from backup
  static async importLayout(jsonString: string): Promise<void> {
    try {
      const layout: DashboardLayout = JSON.parse(jsonString);
      
      // Validate the layout
      if (!layout.sections || !Array.isArray(layout.sections)) {
        throw new Error('Invalid layout format');
      }
      
      // Ensure all sections have required properties
      const validatedLayout: DashboardLayout = {
        sections: layout.sections.map((section, index) => ({
          id: section.id,
          title: section.title || `Section ${index + 1}`,
          description: section.description || '',
          enabled: section.enabled !== false,
          order: typeof section.order === 'number' ? section.order : index,
          icon: section.icon || 'widgets',
          category: section.category || 'core',
        })),
        version: layout.version || 1,
        lastUpdated: new Date().toISOString(),
      };
      
      await this.saveDashboardLayout(validatedLayout);
    } catch (error) {
      console.error('Error importing layout:', error);
      throw new Error('Invalid layout file');
    }
  }

  // Get usage statistics
  static async getUsageStats(): Promise<{
    totalSections: number;
    enabledSections: number;
    disabledSections: number;
    lastCustomized: string;
    categories: Record<string, number>;
  }> {
    const layout = await this.getDashboardLayout();
    const enabled = layout.sections.filter(s => s.enabled);
    const disabled = layout.sections.filter(s => !s.enabled);
    
    const categories: Record<string, number> = {};
    enabled.forEach(section => {
      categories[section.category] = (categories[section.category] || 0) + 1;
    });
    
    return {
      totalSections: layout.sections.length,
      enabledSections: enabled.length,
      disabledSections: disabled.length,
      lastCustomized: layout.lastUpdated,
      categories,
    };
  }
}