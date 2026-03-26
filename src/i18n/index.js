// src/i18n/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importar archivos de traducción
import en from './locales/en.json';
import es from './locales/es.json';

// Recursos de idiomas
const resources = {
  en: {
    translation: en
  },
  es: {
    translation: es
  }
};

// Idioma por defecto
const DEFAULT_LANGUAGE = 'es';

// Inicializar i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

// Función para cambiar idioma
export const changeLanguage = async (language) => {
  try {
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem('user_language', language);
    return true;
  } catch (error) {
    console.log('Error changing language:', error);
    return false;
  }
};

// Función para cargar el idioma guardado
export const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('user_language');
    if (savedLanguage && (savedLanguage === 'es' || savedLanguage === 'en')) {
      await i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    console.log('Error loading saved language:', error);
  }
};

export default i18n;