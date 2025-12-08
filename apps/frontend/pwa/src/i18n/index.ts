import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import es from './locales/es.json';
import en from './locales/en.json';

/**
 * i18next Configuration
 *
 * Features:
 * - Language detection from browser/localStorage
 * - Spanish and English translations
 * - Dynamic language switching
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],

    // Detection order
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'puente-language',
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    // Debug in development
    debug: import.meta.env.DEV,
  });

export default i18n;
