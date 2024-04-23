import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import resources from 'virtual:i18next-loader';
import LanguageDetector from 'i18next-browser-languagedetector';

i18next.use(LanguageDetector).use(initReactI18next).init({
  resources,
  lng: 'en',
  defaultNS: 'en',
  fallbackLng: 'en',
  debug: true,
});
export default i18next;
