import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const SuccessModal = ({ 
  visible, 
  title, 
  message, 
  buttonText = "Aceptar", 
  onConfirm,
  iconName = "checkmark-circle",
  iconColor = "#0f6d78",
  iconBgColor = "rgba(15, 109, 120, 0.1)",
  showCancelButton = false,
  cancelText = "Cancelar",
  onCancel
}) => {
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      scaleValue.setValue(0.8);
      opacityValue.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { opacity: opacityValue, transform: [{ scale: scaleValue }] }]}>
          <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
            <Ionicons name={iconName} size={70} color={iconColor} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonsRow}>
            {showCancelButton && (
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel} activeOpacity={0.8}>
                <Text style={[styles.buttonText, styles.cancelButtonText]}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.button, showCancelButton && styles.confirmHalfButton]} onPress={onConfirm} activeOpacity={0.8}>
              <Text style={styles.buttonText}>{buttonText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    width: '85%',
    borderRadius: 28,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 20,
    backgroundColor: 'rgba(15, 109, 120, 0.1)',
    borderRadius: 50,
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#15333d',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#4f666c',
    textAlign: 'center',
    marginBottom: 35,
    lineHeight: 24,
  },
  buttonsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    backgroundColor: '#0f6d78',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    flex: 1,
    shadowColor: '#0f6d78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmHalfButton: {
    backgroundColor: '#e74c3c',
    shadowColor: '#e74c3c',
  },
  cancelButton: {
    backgroundColor: '#f1f5f8',
    shadowColor: '#bdc3c7',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  cancelButtonText: {
    color: '#4f666c',
  },
});
