import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, translations, DEFAULT_LANGUAGE } from './index';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

const LANGUAGE_STORAGE_KEY = '@kigen_language';

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [language, setCurrentLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved && Object.keys(translations).includes(saved)) {
        setCurrentLanguage(saved as Language);
      }
    } catch (error) {
      console.error('Failed to load saved language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setCurrentLanguage(lang);
      console.log('🌐 Language changed to:', lang);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  // Helper function to get nested translation value
  const getNestedValue = (obj: any, path: string): string => {
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return path; // Return the key if translation is not found
      }
    }
    
    return typeof value === 'string' ? value : path;
  };

  const t = (key: string): string => {
    const translation = translations[language];
    return getNestedValue(translation, key);
  };

  const contextValue: I18nContextType = {
    language,
    setLanguage,
    t,
    isLoading,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};

export const useI18n = useTranslation; // Alias for convenience