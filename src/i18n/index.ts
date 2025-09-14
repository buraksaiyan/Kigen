import { en } from './translations/en';
import { es } from './translations/es';
import { fr } from './translations/fr';
import { de } from './translations/de';
import { tr } from './translations/tr';

export type Language = 'en' | 'es' | 'fr' | 'de' | 'tr';
export type TranslationKey = string;

export const translations = {
  en,
  es,
  fr,
  de,
  tr,
} as const;

export const SUPPORTED_LANGUAGES: Array<{
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}> = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
];

export const DEFAULT_LANGUAGE: Language = 'en';