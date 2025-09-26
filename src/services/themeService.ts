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
    }
  },
  {
    id: 'obsidian',
    title: 'Obsidian',
    description: 'Deep navy (default)',
    colors: {
      primary: '#071330',
      secondary: '#4FA3D9',
      accent: '#7C5CF6',
      background: '#071A2B',
      surface: '#0A2B3D',
      surfaceSecondary: '#0F3948',
    }
  },
  {
    id: 'charcoal',
    title: 'Charcoal',
    description: 'Neutral charcoal slate',
    colors: {
      primary: '#0F1720',
      secondary: '#4A90A8',
      accent: '#7C4DFF',
      background: '#0B0E12',
      surface: '#0D1216',
      surfaceSecondary: '#111418',
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
    }
  },
  {
    id: 'slate',
    title: 'Slate',
    description: 'Muted slate blue',
    colors: {
      primary: '#0B1A2A',
      secondary: '#487B9E',
      accent: '#7A6EF9',
      background: '#061421',
      surface: '#0A1F2C',
      surfaceSecondary: '#0E2A39',
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
