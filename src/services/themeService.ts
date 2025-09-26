import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../config/theme';

const COLOR_PRESET_KEY = '@kigen_color_preset';

export interface ColorPreset {
  id: string;
  title: string;
  description?: string;
  colors: Partial<typeof theme.colors>;
}

// Dark, non-colliding presets (kept intentionally deeper than focus colors)
const PRESETS: ColorPreset[] = [
  // Include the app default theme as an explicit selectable preset
  {
    id: 'default',
    title: 'Default (Deep Blue)',
    description: 'The app default deep-blue theme',
    colors: {
      primary: theme.colors.primary,
      secondary: theme.colors.secondary,
      accent: theme.colors.accent,
      background: theme.colors.background,
      surface: theme.colors.surface,
      surfaceSecondary: theme.colors.surfaceSecondary,
      text: {
        primary: '#FFFFFF',
        secondary: '#8FCFDF',
        tertiary: '#8FCFDFFF',
        disabled: '#274F63',
        dark: '#000000',
      }
    }
  },
  {
    id: 'sunset',
    title: 'Sunset',
    description: 'Warm orange and red tones',
    colors: {
      primary: '#2D1B1F',
      secondary: '#E67E22',
      accent: '#E74C3C',
      background: '#1A0F12',
      surface: '#2D1B1F',
      surfaceSecondary: '#3E2529',
      text: {
        primary: '#FFFFFF',
        secondary: '#F5CBA7',
        tertiary: '#F5CBA7CC',
        disabled: '#8B4513',
        dark: '#000000',
      }
    }
  },
  {
    id: 'forest',
    title: 'Forest',
    description: 'Deep green-blue',
    colors: {
      primary: '#032A1E',
      secondary: '#2F8F66',
      accent: '#5AB98F',
      background: '#041F17',
      surface: '#072B20',
      surfaceSecondary: '#0A3A2B',
      text: {
        primary: '#FFFFFF',
        secondary: '#A8DADC',
        tertiary: '#A8DADC99',
        disabled: '#1B4332',
        dark: '#000000',
      }
    }
  },
  {
    id: 'ember',
    title: 'Ember',
    description: 'Dark maroon accent',
    colors: {
      primary: '#2B0A0D',
      secondary: '#A23D3D',
      accent: '#D36B6B',
      background: '#2A0A0B',
      surface: '#3A0E10',
      surfaceSecondary: '#4C1313',
      text: {
        primary: '#FFFFFF',
        secondary: '#F5B7B1',
        tertiary: '#F5B7B199',
        disabled: '#722F37',
        dark: '#000000',
      }
    }
  },
  {
    id: 'midnight',
    title: 'Midnight Purple',
    description: 'Deep purple and violet',
    colors: {
      primary: '#1A0B2E',
      secondary: '#8E44AD',
      accent: '#9B59B6',
      background: '#12071F',
      surface: '#1A0B2E',
      surfaceSecondary: '#24123D',
      text: {
        primary: '#FFFFFF',
        secondary: '#D7BDE2',
        tertiary: '#D7BDE299',
        disabled: '#5B2C6F',
        dark: '#000000',
      }
    }
  },
  {
    id: 'arctic',
    title: 'Arctic',
    description: 'Cool blue and white accents',
    colors: {
      primary: '#0F1419',
      secondary: '#3498DB',
      accent: '#ECF0F1',
      background: '#0A0E12',
      surface: '#0F1419',
      surfaceSecondary: '#1A2028',
      text: {
        primary: '#FFFFFF',
        secondary: '#BDC3C7',
        tertiary: '#BDC3C799',
        disabled: '#566573',
        dark: '#000000',
      }
    }
  },
  {
    id: 'black',
    title: 'Black',
    description: 'Pure black with light accents',
    colors: {
      primary: '#000000',
      secondary: '#FFFFFF',
      accent: '#CCCCCC',
      background: '#000000',
      surface: '#111111',
      surfaceSecondary: '#222222',
      text: {
        primary: '#FFFFFF',
        secondary: '#CCCCCC',
        tertiary: '#999999',
        disabled: '#666666',
        dark: '#000000',
      }
    }
  }
];

let listeners: Array<() => void> = [];

export const getPresets = () => PRESETS;

export const getCurrentPresetId = async (): Promise<string | null> => {
  try {
    const id = await AsyncStorage.getItem(COLOR_PRESET_KEY);
    return id;
  } catch (e) {
    console.error('Failed to read color preset', e);
    return null;
  }
};

export const applyPreset = async (presetId: string) => {
  try {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return false;

    // Mutate theme.colors in-place so existing imports pick up changes on next render
    Object.assign(theme.colors, preset.colors);

    // Persist selection
    await AsyncStorage.setItem(COLOR_PRESET_KEY, presetId);

    // Notify listeners (e.g., MainNavigator) to trigger a re-render
    listeners.forEach((l) => {
      try { l(); } catch (er) { console.error('theme listener error', er); }
    });

    return true;
  } catch (e) {
    console.error('Failed to apply color preset', e);
    return false;
  }
};

export const applyPresetIfSaved = async () => {
  try {
    const id = await getCurrentPresetId();
    if (id) {
      const preset = PRESETS.find(p => p.id === id);
      if (preset) Object.assign(theme.colors, preset.colors);
    }
  } catch (e) {
    console.error('Failed to apply saved preset', e);
  }
};

export const registerThemeChangeListener = (fn: () => void) => {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter(l => l !== fn);
  };
};

export default {
  getPresets,
  applyPreset,
  getCurrentPresetId,
  applyPresetIfSaved,
  registerThemeChangeListener,
};
