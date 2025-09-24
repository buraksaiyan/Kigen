import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStatsService } from './userStatsService';

export interface JournalEntry {
  id: string;
  content: string;
  date: string; // ISO date string
}

const STORAGE_KEY = '@inzone_journal_entries';

export const journalStorage = {
  // Get all journal entries
  getAllEntries: async (): Promise<JournalEntry[]> => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const entries: JournalEntry[] = JSON.parse(stored);
      // Sort by date, newest first
      return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error loading journal entries:', error);
      return [];
    }
  },

  // Add new journal entry
  addEntry: async (content: string): Promise<void> => {
    try {
      const entries = await journalStorage.getAllEntries();
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        content: content.trim(),
        date: new Date().toISOString(),
      };
      
      entries.unshift(newEntry); // Add to beginning
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      
      // Record journal entry in rating system
      await UserStatsService.recordJournalEntry();
    } catch (error) {
      console.error('Error adding journal entry:', error);
      throw error;
    }
  },

  // Update existing entry
  updateEntry: async (id: string, content: string): Promise<void> => {
    const entries = await journalStorage.getAllEntries();
    const updatedEntries = entries.map(entry => 
      entry.id === id ? { ...entry, content} : entry
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
  },

  // Delete entry
  deleteEntry: async (id: string): Promise<void> => {
    const entries = await journalStorage.getAllEntries();
    const filteredEntries = entries.filter(entry => entry.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredEntries));
  },

  // Get entries for specific date
  getEntriesForDate: async (date: string): Promise<JournalEntry[]> => {
    try {
      const allEntries = await journalStorage.getAllEntries();
      return allEntries.filter(entry => entry.date === date);
    } catch (error) {
      console.error('Error getting entries for date:', error);
      return [];
    }
  },

  // Get entry stats
  getStats: async (): Promise<{ totalEntries: number; streak: number; thisMonth: number }> => {
    try {
      const entries = await journalStorage.getAllEntries();
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      const thisMonthEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getMonth() === thisMonth && entryDate.getFullYear() === thisYear;
      });

      // Calculate streak (consecutive days with entries)
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateString = checkDate.toISOString().split('T')[0];
        
        const hasEntry = entries.some(entry => entry.date === dateString);
        if (hasEntry) {
          streak++;
        } else {
          break;
        }
      }

      return {
        totalEntries: entries.length,
        streak,
        thisMonth: thisMonthEntries.length,
      };
    } catch (error) {
      console.error('Error getting journal stats:', error);
      return { totalEntries: 0, streak: 0, thisMonth: 0 };
    }
  }
};
