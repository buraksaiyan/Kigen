import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';

export interface CustomMeditationSound {
  id: string;
  name: string;
  filePath: string;
  originalName: string;
  duration?: number;
  createdAt: string;
  fileSize?: number;
}

class CustomMeditationSoundService {
  private static STORAGE_KEY = '@kigen_custom_meditation_sounds';

  // Import custom sound from device storage
  static async importCustomSound(): Promise<CustomMeditationSound | null> {
    try {
      // Open document picker for audio files
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true, // Use cache directory for now
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      
      // Validate asset exists
      if (!asset) {
        return null;
      }
      
      // Validate file type and size
      const maxSizeInMB = 50; // 50MB limit
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      
      if (asset.size && asset.size > maxSizeInBytes) {
        Alert.alert(
          'File Too Large', 
          `Audio file must be under ${maxSizeInMB}MB. Selected file is ${(asset.size / 1024 / 1024).toFixed(1)}MB.`
        );
        return null;
      }

      // Generate unique ID
      const soundId = Date.now().toString();

      // Get audio duration if possible
      let duration: number | undefined;
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: asset.uri }, { shouldPlay: false });
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          duration = Math.floor(status.durationMillis / 1000);
        }
        await sound.unloadAsync();
      } catch (error) {
        console.log('Could not get audio duration:', error);
      }

      const customSound: CustomMeditationSound = {
        id: soundId,
        name: asset.name?.replace(/\.[^/.]+$/, '') || `Sound ${soundId}`, // Remove file extension
        filePath: asset.uri, // Store the original URI for now
        originalName: asset.name || `sound_${soundId}`,
        duration: duration,
        createdAt: new Date().toISOString(),
        fileSize: asset.size,
      };

      await this.saveCustomSound(customSound);
      return customSound;
    } catch (error) {
      console.error('Error importing custom sound:', error);
      Alert.alert('Import Error', 'Failed to import audio file. Please try again.');
      return null;
    }
  }

  // Create custom sound entry (for legacy compatibility)
  static async createCustomSound(name: string, description?: string): Promise<CustomMeditationSound> {
    const customSound: CustomMeditationSound = {
      id: Date.now().toString(),
      name: name,
      filePath: 'placeholder', // Legacy placeholder
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

  // Get all custom sounds (no validation needed since we use original URIs)
  static async getCustomSoundsWithValidation(): Promise<CustomMeditationSound[]> {
    try {
      return await this.getCustomSounds();
    } catch (error) {
      console.error('Error getting custom sounds:', error);
      return [];
    }
  }

  // Play custom sound (utility method)
  static async playCustomSound(sound: CustomMeditationSound): Promise<Audio.Sound | null> {
    try {
      if (sound.filePath === 'placeholder') {
        Alert.alert('Placeholder Sound', 'This is a placeholder. Import real audio files to play sounds.');
        return null;
      }
      
      const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri: sound.filePath },
        { shouldPlay: true, isLooping: true }
      );
      
      return audioSound;
    } catch (error) {
      console.error('Error playing custom sound:', error);
      Alert.alert('Playback Error', 'Failed to play the selected sound.');
      return null;
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
