import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '../i18n';

interface Settings {
  timerSoundsEnabled: boolean;
  soundVolume: number;
  focusRemindersEnabled: boolean;
  digitalWellbeingAlertsEnabled: boolean;
  defaultFocusDuration: number; // in minutes
  keepScreenOnEnabled: boolean;
  selectedLanguage: Language;
}

const DEFAULT_SETTINGS: Settings = {
  timerSoundsEnabled: false,
  soundVolume: 0.5,
  focusRemindersEnabled: false,
  digitalWellbeingAlertsEnabled: true,
  defaultFocusDuration: 25, // 25 minutes default
  keepScreenOnEnabled: true,
  selectedLanguage: 'en' as Language,
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

  const toggleFocusReminders = () => {
    updateSettings({ focusRemindersEnabled: !settings.focusRemindersEnabled });
  };

  const toggleDigitalWellbeingAlerts = () => {
    updateSettings({ digitalWellbeingAlertsEnabled: !settings.digitalWellbeingAlertsEnabled });
  };

  const updateDefaultFocusDuration = (duration: number) => {
    updateSettings({ defaultFocusDuration: Math.max(5, Math.min(180, duration)) }); // 5 to 180 minutes
  };

  const toggleKeepScreenOn = () => {
    updateSettings({ keepScreenOnEnabled: !settings.keepScreenOnEnabled });
  };

  const updateLanguage = (language: Language) => {
    updateSettings({ selectedLanguage: language });
  };

  return {
    settings,
    isLoading,
    updateSettings,
    toggleTimerSounds,
    updateVolume,
    toggleFocusReminders,
    toggleDigitalWellbeingAlerts,
    updateDefaultFocusDuration,
    toggleKeepScreenOn,
    updateLanguage,
  };
};

export type { Settings };
