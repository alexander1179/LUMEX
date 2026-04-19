import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

/**
 * Custom Toast component that slides in from the right and stays at the top.
 */
export const Toast = ({ visible, message, type = 'success', onClose }) => {
  const slideAnim = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    if (visible) {
      // Entrada: Slide desde la derecha
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 8,
      }).start();

      // Temporizador para salida (3 segundos)
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onClose) onClose();
    });
  };

  if (!visible && slideAnim._value === width) return null;

  const isError = type === 'error';
  const iconName = isError ? 'alert-circle' : 'checkmark-circle';
  const bgColor = isError ? '#e05a21' : '#0f6d78';

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateX: slideAnim }], backgroundColor: bgColor }
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={iconName} size={24} color="#fff" />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50, // Parte superior
    right: 20,
    left: 20,
    borderRadius: 12,
    padding: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  message: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 12,
    flex: 1,
  },
});
