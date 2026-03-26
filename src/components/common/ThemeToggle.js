// src/components/common/ThemeToggle.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle = ({ style }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={toggleTheme}
      activeOpacity={0.8}
    >
      <Text style={styles.icon}>{isDarkMode ? '🌙' : '☀️'}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  icon: {
    fontSize: 18,
  },
});