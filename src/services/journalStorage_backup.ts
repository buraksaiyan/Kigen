import AsyncStorage from '@react-native-async-storage/async-storage';

export interface JournalEntry {
  id: string;
  content: string;
  date: string; // ISO string
  createdAt: string; // ISO string
  mood?: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
}

const STORAGE_KEY = '@kigen_journal_entries';

export const journalStorage = {
  // Get all journal entries
  async getAllEntries(): Promise<JournalEntry[]> {
    try {
      const entriesJson = await AsyncStorage.getItem(STORAGE_KEY);
      if (!entriesJson) return [];
      const entries = JSON.parse(entriesJson) as JournalEntry[];
      return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error loading journal entries:', error);
      return [];
    }
  },

  // Add new journal entry
  async addEntry(content: string, mood?: JournalEntry['mood']): Promise<JournalEntry> {
    try {
      const now = new Date();
      const newEntry: JournalEntry = {
        id: `entry_${now.getTime()}`,
        content: content.trim(),
        date: now.toISOString().split('T')[0]!, // YYYY-MM-DD
        createdAt: now.toISOString(),
        mood,
      };

      const existingEntries = await this.getAllEntries();
      const updatedEntries = [newEntry, ...existingEntries];
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
      return newEntry;
    } catch (error) {
      console.error('Error adding journal entry:', error);
      throw error;
    }
  },

  // Update existing entry
  updateEntry: async (id: string, content: string, mood: JournalEntry['mood']): Promise<void> => {
    const entries = await journalStorage.getAllEntries();
    const updatedEntries = entries.map(entry => 
      entry.id === id ? { ...entry, content, mood } : entry
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
  },

  deleteEntry: async (id: string): Promise<void> => {
    const entries = await journalStorage.getAllEntries();
    const filteredEntries = entries.filter(entry => entry.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredEntries));
  },
      throw error;
    }
  },

  // Get entries for specific date
  async getEntriesForDate(date: string): Promise<JournalEntry[]> {
    try {
      const allEntries = await this.getAllEntries();
      return allEntries.filter(entry => entry.date === date);
    } catch (error) {
      console.error('Error getting entries for date:', error);
      return [];
    }
  },

  // Get entry stats
  async getStats(): Promise<{ totalEntries: number; streak: number; thisMonth: number }> {
    try {
      const entries = await this.getAllEntries();
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
