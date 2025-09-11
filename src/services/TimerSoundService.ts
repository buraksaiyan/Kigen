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
    this.isLoaded = true;
  }

  public async playTick(volume: number = 0.3, useHaptics: boolean = true) {
    try {
      if (!this.isLoaded) {
        await this.initialize();
      }

      // Use subtle haptic feedback for timer ticks
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    } catch (error) {
      console.log('Failed to play tick haptic:', error);
    }
  }

  public async cleanup() {
    this.isLoaded = false;
  }
}

export default TimerSoundService.getInstance();
