import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Settings {
  timerSoundsEnabled: boolean;
  soundVolume: number;
}

const DEFAULT_SETTINGS: Settings = {
  timerSoundsEnabled: false,
  soundVolume: 0.5,
};

const SETTINGS_STORAGE_KEY = 'kigen_app_settings';

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from AsyncStorage
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const toggleTimerSounds = () => {
    updateSettings({ timerSoundsEnabled: !settings.timerSoundsEnabled });
  };

  const updateVolume = (volume: number) => {
    updateSettings({ soundVolume: Math.max(0, Math.min(1, volume)) });
  };

  return {
    settings,
    isLoading,
    updateSettings,
    toggleTimerSounds,
    updateVolume,
  };
};

export type { Settings };
