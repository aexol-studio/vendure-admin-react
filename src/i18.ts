import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import resources from 'virtual:i18next-loader';
import LanguageDetector from 'i18next-browser-languagedetector';
import { useSettings } from '@/state/settings';

i18next.use(LanguageDetector).use(initReactI18next).init({
  resources,
  lng: useSettings.getState().language,
  defaultNS: 'en',
  fallbackLng: 'en',
  debug: true,
});
export default i18next;
