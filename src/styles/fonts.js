// src/styles/fonts.js
import { Platform } from 'react-native';

// Fuentes por defecto que siempre estarán disponibles
export const fonts = {
  regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
  medium: Platform.OS === 'ios' ? 'System' : 'Roboto',
  bold: Platform.OS === 'ios' ? 'System' : 'Roboto',
  light: Platform.OS === 'ios' ? 'System' : 'Roboto',
  italic: Platform.OS === 'ios' ? 'System' : 'Roboto',
};

// Función para obtener fuentes de forma segura
export const getFonts = () => {
  return fonts;
};

// Función para obtener una fuente específica
export const getFont = (weight = 'regular') => {
  return fonts[weight] || fonts.regular;
};