// src/hooks/useTranslation.js
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAppTranslation = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = async (language) => {
    try {
      await i18n.changeLanguage(language);
      await AsyncStorage.setItem('user_language', language);
      return true;
    } catch (error) {
      console.log('Error changing language:', error);
      return false;
    }
  };

  const getCurrentLanguage = () => i18n.language;

  const isSpanish = () => i18n.language === 'es';
  const isEnglish = () => i18n.language === 'en';

  return {
    t,
    i18n,
    changeLanguage,
    getCurrentLanguage,
    isSpanish,
    isEnglish
  };
};