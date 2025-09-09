import { Audio } from 'expo-av';

export interface MeditationSound {
  id: string;
  name: string;
  type: 'preset' | 'custom';
  uri?: string; // For custom sounds
  description?: string;
}

// Predefined meditation sounds (placeholders for now)
export const PRESET_MEDITATION_SOUNDS: MeditationSound[] = [
  {
    id: 'rain',
    name: 'Gentle Rain',
    type: 'preset',
    description: 'Soft rain sounds for deep relaxation'
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    type: 'preset', 
    description: 'Calming ocean waves and gentle surf'
  },
  {
    id: 'forest',
    name: 'Forest Ambience',
    type: 'preset',
    description: 'Birds chirping and rustling leaves'
  },
  {
    id: 'tibetan',
    name: 'Tibetan Bowls',
    type: 'preset',
    description: 'Traditional singing bowls and chimes'
  },
  {
    id: 'white-noise',
    name: 'White Noise',
    type: 'preset',
    description: 'Gentle white noise for focus'
  }
];

class MeditationSoundService {
  private static instance: MeditationSoundService;
  private currentSound: Audio.Sound | null = null;
  private isPlaying = false;

  public static getInstance(): MeditationSoundService {
    if (!MeditationSoundService.instance) {
      MeditationSoundService.instance = new MeditationSoundService();
    }
    return MeditationSoundService.instance;
  }

  public async initialize() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });
    } catch (error) {
      console.log('Meditation sound initialization failed:', error);
    }
  }

  public async playSound(sound: MeditationSound, volume: number = 0.5) {
    try {
      // Stop current sound if playing
      await this.stopSound();

      if (sound.type === 'preset') {
        // For now, we'll use placeholder logic
        // In production, these would load actual meditation sound files
        console.log(`Playing meditation sound: ${sound.name}`);
        // TODO: Load actual sound file based on sound.id
        // const { sound: audioSound } = await Audio.Sound.createAsync(
        //   require(`../../assets/sounds/meditation/${sound.id}.mp3`)
        // );
      } else if (sound.type === 'custom' && sound.uri) {
        // Load custom sound from URI
        const { sound: audioSound } = await Audio.Sound.createAsync(
          { uri: sound.uri },
          { shouldPlay: false, volume, isLooping: true }
        );
        this.currentSound = audioSound;
      }

      if (this.currentSound) {
        await this.currentSound.setVolumeAsync(volume);
        await this.currentSound.setIsLoopingAsync(true);
        await this.currentSound.playAsync();
        this.isPlaying = true;
      }
    } catch (error) {
      console.log('Failed to play meditation sound:', error);
    }
  }

  public async stopSound() {
    try {
      if (this.currentSound && this.isPlaying) {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
        this.currentSound = null;
        this.isPlaying = false;
      }
    } catch (error) {
      console.log('Failed to stop meditation sound:', error);
    }
  }

  public async pauseSound() {
    try {
      if (this.currentSound && this.isPlaying) {
        await this.currentSound.pauseAsync();
        this.isPlaying = false;
      }
    } catch (error) {
      console.log('Failed to pause meditation sound:', error);
    }
  }

  public async resumeSound() {
    try {
      if (this.currentSound && !this.isPlaying) {
        await this.currentSound.playAsync();
        this.isPlaying = true;
      }
    } catch (error) {
      console.log('Failed to resume meditation sound:', error);
    }
  }

  public async setVolume(volume: number) {
    try {
      if (this.currentSound) {
        await this.currentSound.setVolumeAsync(volume);
      }
    } catch (error) {
      console.log('Failed to set meditation sound volume:', error);
    }
  }

  public isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  public async cleanup() {
    await this.stopSound();
  }
}

export default MeditationSoundService.getInstance();
