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
      primary: '#333333',      // Dark gray instead of pure black for buttons
      secondary: '#666666',    // Medium gray for secondary elements
      accent: '#CCCCCC',       // Light gray for accents
      background: '#000000',   // Pure black background
      surface: '#111111',      // Very dark gray for surfaces
      surfaceSecondary: '#222222', // Dark gray for secondary surfaces
      border: '#444444',       // Medium dark gray for borders
      shadow: '#000000',       // Black shadows
      overlay: 'rgba(0, 0, 0, 0.8)', // Dark overlay
      overlayLight: 'rgba(255, 255, 255, 0.05)', // Very light overlay
      borderLight: 'rgba(255, 255, 255, 0.1)', // Light border
      white: '#FFFFFF',
      black: '#000000',
      transparent: 'transparent',
      success: '#4CAF50',      // Green for success
      danger: '#F44336',       // Red for danger
      warning: '#FF9800',      // Orange for warning
      progress: {
        background: '#444444',
        fill: '#666666',
        success: '#4CAF50',
      },
      button: {
        primary: '#333333',    // Dark gray buttons
        secondary: '#666666',  // Medium gray buttons
        disabled: '#222222',   // Very dark gray for disabled
        hover: '#444444',      // Medium dark gray for hover
      },
      tab: {
        active: '#CCCCCC',     // Light gray for active tabs
        inactive: '#666666',   // Medium gray for inactive tabs
        background: '#111111', // Very dark gray background
      },
      menu: {
        goals: '#FF6B6B',
        journaling: '#4ECDC4',
        focus: '#45B7D1',
        reminders: '#F6C85F',
        social: '#96CEB4',
        todo: '#FFEAA7',
        habit: '#DDA0DD',
      },
      focus: {
        study: '#14B8A6',
        work: '#EF4444',
        meditation: '#22C55E',
        exercise: '#A855F7',
        reading: '#60A5FA',
        custom: '#F59E0B',
      },
      text: {
        primary: '#FFFFFF',    // White text for maximum contrast
        secondary: '#CCCCCC',  // Light gray for secondary text
        tertiary: '#999999',   // Medium gray for tertiary text
        disabled: '#666666',   // Medium gray for disabled text
        dark: '#000000',       // Black text (for light backgrounds)
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
