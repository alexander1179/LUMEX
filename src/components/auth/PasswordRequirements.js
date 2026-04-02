// src/components/auth/PasswordRequirements.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';

export const PasswordRequirements = ({ requirements }) => {
  const requirements_list = [
    { key: 'length', text: 'Mínimo 8 caracteres', value: requirements.length },
    { key: 'uppercase', text: 'Una mayúscula', value: requirements.uppercase },
    { key: 'lowercase', text: 'Una minúscula', value: requirements.lowercase },
    { key: 'number', text: 'Un número', value: requirements.number },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Ionicons name="shield-checkmark-outline" size={14} color="#0f6d78" />
        <Text style={styles.title}>Requisitos</Text>
      </View>

      <View style={styles.requirementsList}>
        {requirements_list.map((req, index) => (
          <View key={req.key} style={styles.requirementItem}>
            {req.value ? (
              <Ionicons name="checkmark-circle" size={18} color="#0f6d78" />
            ) : (
              <View style={styles.emptyCircle} />
            )}
            <Text style={[styles.requirementText, req.value && styles.requirementMet]}>
              {req.text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f4fbfb',
    padding: 9,
    borderRadius: 12,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: 'rgba(15, 109, 120, 0.15)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  title: {
    color: '#0f6d78',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  requirementsList: {
    gap: 5,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#c8d8dc',
  },
  requirementText: {
    fontSize: 11,
    color: '#6b848b',
    flex: 1,
  },
  requirementMet: {
    color: '#0f6d78',
    fontWeight: '600',
  },
});