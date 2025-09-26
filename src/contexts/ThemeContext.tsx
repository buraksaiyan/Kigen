import React, { createContext, useContext, useState, useEffect } from 'react';
import { theme as defaultTheme } from '../config/theme';
import themeService from '../services/themeService';

interface ThemeContextType {
  theme: typeof defaultTheme;
  currentPresetId: string | null;
  applyPreset: (presetId: string) => Promise<boolean>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// Global theme reference that gets updated
let currentTheme = { ...defaultTheme };

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState(currentTheme);
  const [currentPresetId, setCurrentPresetId] = useState<string | null>(null);

  useEffect(() => {
    // Load saved preset on mount
    const loadTheme = async () => {
      await themeService.applyPresetIfSaved();
      const id = await themeService.getCurrentPresetId();
      setCurrentPresetId(id);
      // Update the global theme reference
      currentTheme = { ...defaultTheme };
      setTheme(currentTheme);
    };
    loadTheme();

    // Listen for theme changes
    const unregister = themeService.registerThemeChangeListener(() => {
      currentTheme = { ...defaultTheme };
      setTheme(currentTheme);
    });

    return unregister;
  }, []);

  const applyPreset = async (presetId: string) => {
    const success = await themeService.applyPreset(presetId);
    if (success) {
      setCurrentPresetId(presetId);
      // Update the global theme reference
      currentTheme = { ...defaultTheme };
      setTheme(currentTheme);
    }
    return success;
  };

  return (
    <ThemeContext.Provider value={{ theme, currentPresetId, applyPreset }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export the current theme for components that can't use hooks
export const getCurrentTheme = () => currentTheme;