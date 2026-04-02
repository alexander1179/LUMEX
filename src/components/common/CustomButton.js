// src/components/common/CustomButton.js
import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';

export const CustomButton = ({ 
  title, 
  onPress, 
  loading = false, 
  disabled = false,
  style = {},
  textStyle = {},
  backgroundColor = colors.primary,
  backgroundColorPressed = null
}) => {
  const [isPressed, setIsPressed] = useState(false);
  
  const pressedColor = backgroundColorPressed || darkenColor(backgroundColor);
  const currentBgColor = isPressed ? pressedColor : backgroundColor;
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: currentBgColor },
        (disabled || loading) && styles.disabledButton,
        style
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
    >
      <Text style={[styles.buttonText, textStyle]}>
        {loading ? "Cargando..." : title}
      </Text>
    </TouchableOpacity>
  );
};

const darkenColor = (color) => {
  if (!color || color === 'transparent') return color;
  
  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(x => x + x).join('');
  }
  
  const num = parseInt(hex, 16);
  const r = Math.max(0, (num >> 16) - 40);
  const g = Math.max(0, ((num >> 8) & 0x00FF) - 40);
  const b = Math.max(0, (num & 0x0000FF) - 40);
  
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
};

const styles = StyleSheet.create({
  button: {
    padding: 15,
    borderRadius: 22,
    alignItems: "center"
  },
  disabledButton: {
    opacity: 0.6
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15
  }
});