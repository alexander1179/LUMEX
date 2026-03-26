// src/components/auth/PasswordRequirements.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';

export const PasswordRequirements = ({ requirements }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Requisitos de contraseña:</Text>
      <Text style={requirements.length ? styles.met : styles.notMet}>
        {requirements.length ? '✅' : '○'} Mínimo 8 caracteres
      </Text>
      <Text style={requirements.uppercase ? styles.met : styles.notMet}>
        {requirements.uppercase ? '✅' : '○'} Una mayúscula
      </Text>
      <Text style={requirements.lowercase ? styles.met : styles.notMet}>
        {requirements.lowercase ? '✅' : '○'} Una minúscula
      </Text>
      <Text style={requirements.number ? styles.met : styles.notMet}>
        {requirements.number ? '✅' : '○'} Un número
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#2a2a2a",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  title: {
    color: colors.text.white,
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  met: {
    color: colors.text.success,
    fontSize: 12,
  },
  notMet: {
    color: colors.text.error,
    fontSize: 12,
  }
});