// src/components/common/CustomButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';

export const CustomButton = ({ 
  title, 
  onPress, 
  loading = false, 
  disabled = false,
  style = {},
  textStyle = {}
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        (disabled || loading) && styles.disabledButton,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <Text style={[styles.buttonText, textStyle]}>
        {loading ? "Cargando..." : title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 25,
    alignItems: "center"
  },
  disabledButton: {
    backgroundColor: "#999",
    opacity: 0.7
  },
  buttonText: {
    color: colors.text.white,
    fontWeight: "bold",
    fontSize: 16
  }
});