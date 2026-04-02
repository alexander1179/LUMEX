import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';

export function HeartRateModal({
  visible,
  onClose,
  cameraSecondsLeft,
  isCameraMeasuring,
  cameraPermission,
  onSelectCameraMode,
  onPrimaryAction,
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Medir frecuencia cardiaca</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.85}>
              <Ionicons name="close-outline" size={24} color="#4f666c" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescription}>
            Usa la camara para medir frecuencia cardiaca durante 15 segundos.
          </Text>

          <View style={styles.measureModeRow}>
            <TouchableOpacity
              style={[styles.measureModeChip, styles.measureModeChipActive]}
              onPress={onSelectCameraMode}
              activeOpacity={0.85}
            >
              <Ionicons name="camera-outline" size={14} color="#ffffff" />
              <Text style={[styles.measureModeText, styles.measureModeTextActive]}>Camara</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.measureInfoRow}>
            <View style={styles.measureInfoItem}>
              <Text style={styles.measureInfoLabel}>Tiempo</Text>
              <Text style={styles.measureInfoValue}>{cameraSecondsLeft}s</Text>
            </View>
            <View style={styles.measureInfoItem}>
              <Text style={styles.measureInfoLabel}>Modo</Text>
              <Text style={styles.measureInfoValue}>CAM</Text>
            </View>
          </View>

          <View style={styles.heartCameraArea}>
            {cameraPermission?.granted && isCameraMeasuring ? (
              <>
                <CameraView style={styles.heartCameraPreview} facing="back" enableTorch ratio="4:3" />
                <View style={styles.cameraOverlay}>
                  <Ionicons name="finger-print-outline" size={20} color="#ffffff" />
                  <Text style={styles.cameraOverlayText}>Cubre lente y flash con tu dedo</Text>
                </View>
              </>
            ) : cameraPermission?.granted ? (
              <View style={styles.heartCameraIdleState}>
                <Ionicons name="camera-outline" size={30} color="#d9edf5" />
                <Text style={styles.heartCameraIdleTitle}>Camara lista</Text>
                <Text style={styles.heartCameraIdleText}>Pulsa "Iniciar camara" para activar la lectura en este espacio.</Text>
              </View>
            ) : (
              <View style={styles.heartCameraPermissionWrap}>
                <Ionicons name="camera-outline" size={28} color="#5d7f8e" />
                <Text style={styles.cameraPermissionText}>Permiso de camara pendiente</Text>
              </View>
            )}
          </View>

          <View style={styles.modalButtonsRow}>
            <TouchableOpacity style={[styles.modalActionBtn, styles.modalActionBtnPrimary]} activeOpacity={0.85} onPress={onPrimaryAction}>
              <Text style={styles.modalActionBtnPrimaryText}>
                {isCameraMeasuring ? 'Parar' : 'Iniciar camara'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalActionBtn, styles.modalActionBtnSecondary]} activeOpacity={0.85} onPress={onClose}>
              <Text style={styles.modalActionBtnSecondaryText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16,32,38,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d4e7ee',
    padding: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    color: '#173746',
    fontSize: 17,
    fontWeight: '700',
  },
  modalDescription: {
    color: '#587886',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  measureModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  measureModeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f3fafc',
    borderWidth: 1,
    borderColor: '#deedf3',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  measureModeChipActive: {
    backgroundColor: '#2f7a96',
    borderColor: '#2f7a96',
  },
  measureModeText: {
    color: '#2d5b6d',
    fontSize: 12,
    fontWeight: '700',
  },
  measureModeTextActive: {
    color: '#ffffff',
  },
  measureInfoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  measureInfoItem: {
    flex: 1,
    backgroundColor: '#f3fafc',
    borderWidth: 1,
    borderColor: '#deedf3',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  measureInfoLabel: {
    color: '#5d7f8e',
    fontSize: 12,
  },
  measureInfoValue: {
    color: '#173746',
    fontSize: 20,
    fontWeight: '800',
  },
  heartCameraArea: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#deedf3',
    backgroundColor: '#0f1820',
    marginBottom: 14,
    height: 132,
  },
  heartCameraPreview: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8,22,28,0.55)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cameraOverlayText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  heartCameraPermissionWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f5f8f9',
  },
  heartCameraIdleState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    gap: 8,
    backgroundColor: '#16313c',
  },
  heartCameraIdleTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  heartCameraIdleText: {
    color: '#d5e7ee',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  cameraPermissionText: {
    color: '#5d7f8e',
    fontSize: 13,
    fontWeight: '600',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalActionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalActionBtnPrimary: {
    backgroundColor: '#2f7a96',
  },
  modalActionBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalActionBtnSecondary: {
    backgroundColor: '#f3fafc',
    borderWidth: 1,
    borderColor: '#deedf3',
  },
  modalActionBtnSecondaryText: {
    color: '#2d5b6d',
    fontSize: 14,
    fontWeight: '700',
  },
});