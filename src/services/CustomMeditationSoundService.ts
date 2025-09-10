import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CustomMeditationSound {
  id: string;
  name: string;
  filePath: string;
  originalName: string;
  duration?: number;
  createdAt: string;
}

class CustomMeditationSoundService {
  private static STORAGE_KEY = '@kigen_custom_meditation_sounds';

  // For now, we'll implement a placeholder system
  // In a future update, we can add full file import functionality
  static async createCustomSound(name: string, description?: string): Promise<CustomMeditationSound> {
    const customSound: CustomMeditationSound = {
      id: Date.now().toString(),
      name: name,
      filePath: 'placeholder', // Future implementation will handle actual files
      originalName: name,
      duration: 300, // Default 5 minutes
      createdAt: new Date().toISOString(),
    };

    await this.saveCustomSound(customSound);
    return customSound;
  }

  // Save custom sound to storage
  private static async saveCustomSound(sound: CustomMeditationSound): Promise<void> {
    try {
      const existingSounds = await this.getCustomSounds();
      const updatedSounds = [...existingSounds, sound];
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedSounds));
    } catch (error) {
      console.error('Error saving custom sound:', error);
      throw error;
    }
  }

  // Get all custom sounds
  static async getCustomSounds(): Promise<CustomMeditationSound[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting custom sounds:', error);
      return [];
    }
  }

  // Update sound name
  static async updateSoundName(soundId: string, newName: string): Promise<void> {
    try {
      const sounds = await this.getCustomSounds();
      const updatedSounds = sounds.map(sound =>
        sound.id === soundId ? { ...sound, name: newName } : sound
      );
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedSounds));
    } catch (error) {
      console.error('Error updating sound name:', error);
      throw error;
    }
  }

  // Delete custom sound
  static async deleteCustomSound(soundId: string): Promise<void> {
    try {
      const sounds = await this.getCustomSounds();
      const updatedSounds = sounds.filter(s => s.id !== soundId);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedSounds));
    } catch (error) {
      console.error('Error deleting custom sound:', error);
      throw error;
    }
  }

  // Format duration in minutes and seconds
  static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

export default CustomMeditationSoundService;
