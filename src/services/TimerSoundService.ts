import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

class TimerSoundService {
  private static instance: TimerSoundService;
  private isLoaded = false;

  public static getInstance(): TimerSoundService {
    if (!TimerSoundService.instance) {
      TimerSoundService.instance = new TimerSoundService();
    }
    return TimerSoundService.instance;
  }

  public async initialize() {
    if (this.isLoaded) return;

    try {
      // Set audio mode for playing sounds
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
      });
      
      this.isLoaded = true;
    } catch (error) {
      console.log('Timer sound initialization failed:', error);
    }
  }

  public async playTick(volume: number = 0.3, useHaptics: boolean = false) {
    try {
      if (!this.isLoaded) {
        await this.initialize();
      }

      if (useHaptics) {
        // Use subtle haptic feedback instead of sound
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        // Play a very brief and soft system sound
        // For a simple tick, we'll use a short beep sound
        const { sound } = await Audio.Sound.createAsync(
          // Simple beep sound data
          { 
            uri: 'data:audio/wav;base64,UklGRiQEAABXQVZFZm10IBAAAAABAAEAgD4AAIA+AAABAAgAZGF0YQAEAAD//+3/9v/+/wEAAgD//wAA8f8AAPj//f8CAAAA/v8+AIAA7+/q7wEAAgD//wAA8f8AAPj//f8CAAEA8f/+//z/AAD//w=='
          },
          { shouldPlay: false, volume: volume * 0.5, isLooping: false }
        );

        // Play very briefly
        await sound.playAsync();
        
        // Clean up quickly
        setTimeout(async () => {
          try {
            await sound.unloadAsync();
          } catch (err) {
            console.log('Cleanup error:', err);
          }
        }, 200);
      }

    } catch (error) {
      console.log('Failed to play tick sound:', error);
      // Fallback to haptic if sound fails
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (hapticsError) {
        console.log('Haptics also failed:', hapticsError);
      }
    }
  }

  public async cleanup() {
    this.isLoaded = false;
  }
}

export default TimerSoundService.getInstance();
