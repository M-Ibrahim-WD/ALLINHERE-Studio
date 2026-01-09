import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en.json';
import ar from './ar.json';
import it from './it.json';
import fr from './fr.json';
import es from './es.json';

const LANGUAGE_KEY = '@allinhere_language';

// RTL languages
const RTL_LANGUAGES = ['ar'];

export const resources = {
  en: { translation: en },
  ar: { translation: ar },
  it: { translation: it },
  fr: { translation: fr },
  es: { translation: es },
} as const;

export type Language = keyof typeof resources;

// Get device language
const getDeviceLanguage = (): Language => {
  // This would normally use react-native-localize or similar
  // For now, default to English
  return 'en';
};

// Check if language is RTL
export const isRTL = (language: Language): boolean => {
  return RTL_LANGUAGES.includes(language);
};

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLanguage(),
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Load saved language
export const loadSavedLanguage = async (): Promise<void> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage && savedLanguage in resources) {
      await changeLanguage(savedLanguage as Language);
    }
  } catch (error) {
    console.error('Error loading saved language:', error);
  }
};

// Change language
export const changeLanguage = async (language: Language): Promise<void> => {
  try {
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem(LANGUAGE_KEY, language);

    // Update RTL layout
    const shouldBeRTL = isRTL(language);
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.forceRTL(shouldBeRTL);
      // Note: App needs to restart for RTL changes to take effect
      // You might want to show a dialog here prompting the user to restart
    }
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

// Get current language
export const getCurrentLanguage = (): Language => {
  return i18n.language as Language;
};

// Get available languages
export const getAvailableLanguages = (): Array<{ code: Language; name: string; nativeName: string }> => {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
  ];
};

export default i18n;
