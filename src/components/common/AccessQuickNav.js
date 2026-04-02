import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function AccessQuickNav({ navigation, current = 'usuario' }) {
  return (
    <View style={styles.bottomQuickNav}>
      <TouchableOpacity
        style={[styles.quickNavButton, current === 'usuario' && styles.quickNavButtonActive]}
        onPress={() => navigation.replace('Login', { role: 'usuario' })}
        activeOpacity={0.85}
      >
        <View style={[styles.quickNavIconWrap, current === 'usuario' && styles.quickNavIconWrapActive]}>
          <Ionicons name="person-outline" size={18} color={current === 'usuario' ? '#0f6d78' : '#4f666c'} />
        </View>
        <Text style={[styles.quickNavText, current === 'usuario' && styles.quickNavTextActive]}>Usuario</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.quickNavButton, current === 'admin' && styles.quickNavButtonActive]}
        onPress={() => navigation.replace('Login', { role: 'admin' })}
        activeOpacity={0.85}
      >
        <View style={[styles.quickNavIconWrap, current === 'admin' && styles.quickNavIconWrapActive]}>
          <Ionicons name="shield-checkmark-outline" size={18} color={current === 'admin' ? '#0f6d78' : '#4f666c'} />
        </View>
        <Text style={[styles.quickNavText, current === 'admin' && styles.quickNavTextActive]}>Administrador</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.quickNavButton, current === 'plataforma' && styles.quickNavButtonActive]}
        onPress={() => navigation.replace('Welcome')}
        activeOpacity={0.85}
      >
        <View style={[styles.quickNavIconWrap, current === 'plataforma' && styles.quickNavIconWrapActive]}>
          <Ionicons name="apps-outline" size={18} color={current === 'plataforma' ? '#0f6d78' : '#4f666c'} />
        </View>
        <Text style={[styles.quickNavText, current === 'plataforma' && styles.quickNavTextActive]}>Plataforma</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomQuickNav: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(15,109,120,0.18)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#0f6d78',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 7,
  },
  quickNavButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    borderRadius: 10,
  },
  quickNavButtonActive: {
    backgroundColor: 'rgba(15,109,120,0.08)',
  },
  quickNavIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(79,102,108,0.08)',
    marginBottom: 2,
  },
  quickNavIconWrapActive: {
    backgroundColor: 'rgba(15,109,120,0.16)',
  },
  quickNavText: {
    fontSize: 10,
    color: '#4f666c',
    fontWeight: '600',
  },
  quickNavTextActive: {
    color: '#0f6d78',
  },
});