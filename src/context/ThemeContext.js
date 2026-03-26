// src/context/ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Fuentes por defecto
const defaultFonts = {
  regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
  medium: Platform.OS === 'ios' ? 'System' : 'Roboto',
  bold: Platform.OS === 'ios' ? 'System' : 'Roboto',
  light: Platform.OS === 'ios' ? 'System' : 'Roboto',
};

// Tema Claro
const lightTheme = {
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
  fonts: defaultFonts,
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

// Tema Oscuro
const darkTheme = {
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
  fonts: defaultFonts,
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

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      isDarkMode: false,
      theme: lightTheme,
      toggleTheme: () => {},
      setTheme: () => {},
      isLoading: false,
    };
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      await AsyncStorage.setItem('app_theme', newMode ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const setTheme = async (mode) => {
    const isDark = mode === 'dark';
    setIsDarkMode(isDark);
    try {
      await AsyncStorage.setItem('app_theme', isDark ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        theme,
        toggleTheme,
        setTheme,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};