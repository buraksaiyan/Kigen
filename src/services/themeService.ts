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
  {
    id: 'obsidian',
    title: 'Obsidian',
    description: 'Deep navy (default)',
    colors: {
      primary: '#001428',
      secondary: '#5AAFCC',
      accent: '#8B5CF6',
      background: '#000F1A',
      surface: '#001826',
      surfaceSecondary: '#002B3A',
    }
  },
  {
    id: 'charcoal',
    title: 'Charcoal',
    description: 'Neutral charcoal slate',
    colors: {
      primary: '#0B0F12',
      secondary: '#4A90A8',
      accent: '#7C4DFF',
      background: '#050607',
      surface: '#0A0C0E',
      surfaceSecondary: '#0E1214',
    }
  },
  {
    id: 'forest',
    title: 'Forest',
    description: 'Deep green-blue',
    colors: {
      primary: '#08120E',
      secondary: '#3B8F76',
      accent: '#6A9F8A',
      background: '#07120E',
      surface: '#0B1914',
      surfaceSecondary: '#0E241C',
    }
  },
  {
    id: 'ember',
    title: 'Ember',
    description: 'Dark maroon accent',
    colors: {
      primary: '#12080A',
      secondary: '#A85A59',
      accent: '#C06B7A',
      background: '#0C0607',
      surface: '#11080A',
      surfaceSecondary: '#1A0D0E',
    }
  },
  {
    id: 'slate',
    title: 'Slate',
    description: 'Muted slate blue',
    colors: {
      primary: '#0C1420',
      secondary: '#548CA6',
      accent: '#8A7FFF',
      background: '#061018',
      surface: '#0A1622',
      surfaceSecondary: '#0E2633',
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
