// src/styles/globalTheme.js
import { Platform } from 'react-native';

// 🔥 FUENTES GLOBALES - SIEMPRE DISPONIBLES 🔥
export const globalFonts = {
  regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
  medium: Platform.OS === 'ios' ? 'System' : 'Roboto',
  bold: Platform.OS === 'ios' ? 'System' : 'Roboto',
  light: Platform.OS === 'ios' ? 'System' : 'Roboto',
  italic: Platform.OS === 'ios' ? 'System' : 'Roboto',
  thin: Platform.OS === 'ios' ? 'System' : 'Roboto',
  black: Platform.OS === 'ios' ? 'System' : 'Roboto',
};

// 🔥 TEMA GLOBAL - SE PUEDE IMPORTAR DIRECTAMENTE 🔥
export const globalTheme = {
  primary: "#d32f2f",
  primaryDark: "#b71c1c",
  primaryLight: "#ff6659",
  
  background: {
    primary: "#f5f5f5",
    secondary: "#ffffff",
    card: "#ffffff",
    header: "#d32f2f",
    input: "#f0f0f0",
    modal: "#ffffff",
  },
  
  text: {
    primary: "#333333",
    secondary: "#666666",
    tertiary: "#999999",
    inverse: "#ffffff",
    error: "#ff5252",
    success: "#4caf50",
    warning: "#ff9800",
    link: "#d32f2f",
  },
  
  border: {
    primary: "#e0e0e0",
    secondary: "#f0f0f0",
    input: "#dddddd",
  },
  
  status: {
    error: "#ff5252",
    success: "#4caf50",
    warning: "#ff9800",
    info: "#2196f3",
  },
  
  shadow: {
    color: "#000000",
    opacity: 0.1,
  },
  
  // 🔥 FUENTES - SIEMPRE DEFINIDAS 🔥
  fonts: globalFonts,
  
  fontSize: {
    small: 12,
    medium: 14,
    regular: 16,
    large: 18,
    xlarge: 20,
    xxlarge: 24,
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 25,
    round: 999,
  },
  
  icon: "#666666",
  placeholder: "#999999",
  disabled: "#cccccc",
  overlay: "rgba(0, 0, 0, 0.5)",
  isDarkMode: false,
};

// 🔥 TEMA OSCURO GLOBAL 🔥
export const globalDarkTheme = {
  primary: "#d32f2f",
  primaryDark: "#b71c1c",
  primaryLight: "#ff6659",
  
  background: {
    primary: "#121212",
    secondary: "#1e1e1e",
    card: "#1e1e1e",
    header: "#1a1a1a",
    input: "#2c2c2c",
    modal: "#1e1e1e",
  },
  
  text: {
    primary: "#ffffff",
    secondary: "#b0b0b0",
    tertiary: "#808080",
    inverse: "#333333",
    error: "#ff5252",
    success: "#4caf50",
    warning: "#ff9800",
    link: "#ff6659",
  },
  
  border: {
    primary: "#333333",
    secondary: "#2c2c2c",
    input: "#404040",
  },
  
  status: {
    error: "#ff5252",
    success: "#4caf50",
    warning: "#ff9800",
    info: "#2196f3",
  },
  
  shadow: {
    color: "#000000",
    opacity: 0.3,
  },
  
  // 🔥 FUENTES - SIEMPRE DEFINIDAS 🔥
  fonts: globalFonts,
  
  fontSize: {
    small: 12,
    medium: 14,
    regular: 16,
    large: 18,
    xlarge: 20,
    xxlarge: 24,
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 25,
    round: 999,
  },
  
  icon: "#b0b0b0",
  placeholder: "#666666",
  disabled: "#404040",
  overlay: "rgba(0, 0, 0, 0.7)",
  isDarkMode: true,
};

// Función para obtener el tema actual
export const getGlobalTheme = (isDark = false) => {
  return isDark ? globalDarkTheme : globalTheme;
};