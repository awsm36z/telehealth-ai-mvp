import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';

import en from './translations/en.json';
import fr from './translations/fr.json';
import ar from './translations/ar.json';

const LANGUAGE_KEY = 'appLanguage';

export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English', rtl: false },
  { code: 'fr', label: 'French', nativeLabel: 'Français', rtl: false },
  { code: 'ar', label: 'Darija', nativeLabel: 'دارجة', rtl: true },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  ar: { translation: ar },
};

const getDeviceLanguage = (): string => {
  try {
    const locales = getLocales();
    const deviceLang = locales[0]?.languageCode || 'en';
    // Map device language to our supported languages
    if (deviceLang.startsWith('fr')) return 'fr';
    if (deviceLang.startsWith('ar')) return 'ar';
    return 'en';
  } catch {
    return 'en';
  }
};

const applyRTL = (languageCode: string) => {
  const lang = LANGUAGES.find((l) => l.code === languageCode);
  const shouldBeRTL = lang?.rtl ?? false;
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
    return true; // RTL changed, restart needed
  }
  return false;
};

const initI18n = async () => {
  let savedLanguage: string | null = null;
  try {
    savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch {
    // Ignore storage errors
  }

  const lng = savedLanguage || getDeviceLanguage();

  // Apply RTL on startup (no restart needed on first load)
  applyRTL(lng);

  await i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
};

export const changeLanguage = async (languageCode: LanguageCode) => {
  await i18n.changeLanguage(languageCode);
  await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);

  const needsRestart = applyRTL(languageCode);
  if (needsRestart) {
    // RTL/LTR switch requires an app reload to take effect
    try {
      await Updates.reloadAsync();
    } catch {
      // In development, Updates.reloadAsync may not work — fall back silently
    }
  }
};

export const getCurrentLanguage = (): LanguageCode => {
  return (i18n.language || 'en') as LanguageCode;
};

export const isRTL = (): boolean => {
  const lang = LANGUAGES.find((l) => l.code === getCurrentLanguage());
  return lang?.rtl ?? false;
};

// Initialize on import
initI18n();

export default i18n;
