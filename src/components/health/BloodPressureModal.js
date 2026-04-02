import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';

export function BloodPressureModal({
  visible,
  onClose,
  bloodPressureMode,
  isMeasuringBloodPressure,
  bloodPressureSecondsLeft,
  bloodPressureSystolic,
  bloodPressureDiastolic,
  cameraPermission,
  onSelectSampleMode,
  onSelectCameraMode,
  onPrimaryAction,
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, bloodPressureMode === 'camera' && styles.modalCardCompact]}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Tomar muestra de presion arterial</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.85}>
              <Ionicons name="close-outline" size={24} color="#4f666c" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescription}>
            Elige una muestra guiada o una estimacion por camara. El resultado se mostrara en pantalla, pero no se guardara.
          </Text>

          <View style={styles.measureModeRow}>
            <TouchableOpacity
              style={[styles.measureModeChip, bloodPressureMode === 'sample' && styles.measureModeChipActive]}
              onPress={onSelectSampleMode}
              activeOpacity={0.85}
            >
              <Ionicons name="pulse-outline" size={14} color={bloodPressureMode === 'sample' ? '#ffffff' : '#2d5b6d'} />
              <Text style={[styles.measureModeText, bloodPressureMode === 'sample' && styles.measureModeTextActive]}>Guiada</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.measureModeChip, bloodPressureMode === 'camera' && styles.measureModeChipActive]}
              onPress={onSelectCameraMode}
              activeOpacity={0.85}
            >
              <Ionicons name="camera-outline" size={14} color={bloodPressureMode === 'camera' ? '#ffffff' : '#2d5b6d'} />
              <Text style={[styles.measureModeText, bloodPressureMode === 'camera' && styles.measureModeTextActive]}>Camara</Text>
            </TouchableOpacity>
          </View>

          {bloodPressureMode === 'sample' ? (
            <>
              <View style={styles.bpVisualGuide}>
                <View style={styles.bpVisualItem}>
                  <View style={styles.bpVisualIconWrap}>
                    <Ionicons name="body-outline" size={18} color="#2f7a96" />
                  </View>
                  <Text style={styles.bpVisualText}>Sentado</Text>
                </View>
                <View style={styles.bpVisualItem}>
                  <View style={styles.bpVisualIconWrap}>
                    <Ionicons name="heart-outline" size={18} color="#2f7a96" />
                  </View>
                  <Text style={styles.bpVisualText}>Brazo al nivel del corazon</Text>
                </View>
                <View style={styles.bpVisualItem}>
                  <View style={styles.bpVisualIconWrap}>
                    <Ionicons name="pause-circle-outline" size={18} color="#2f7a96" />
                  </View>
                  <Text style={styles.bpVisualText}>Sin hablar ni moverse</Text>
                </View>
              </View>

              <View style={styles.bpInstructionsCard}>
                <Text style={styles.bpInstructionsTitle}>Como tomar la muestra</Text>
                <View style={styles.bpInstructionRow}>
                  <Text style={styles.bpInstructionStep}>1.</Text>
                  <Text style={styles.bpInstructionText}>Sientate y descansa 1 minuto, sin hablar ni moverte.</Text>
                </View>
                <View style={styles.bpInstructionRow}>
                  <Text style={styles.bpInstructionStep}>2.</Text>
                  <Text style={styles.bpInstructionText}>Apoya el brazo a la altura del corazon.</Text>
                </View>
                <View style={styles.bpInstructionRow}>
                  <Text style={styles.bpInstructionStep}>3.</Text>
                  <Text style={styles.bpInstructionText}>Pulsa "Iniciar muestra" y mantente quieto hasta que termine el contador.</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.bpCameraGuideCard}>
              <View style={styles.bpCameraGuideHeader}>
                <Ionicons name="camera-outline" size={18} color="#2f7a96" />
                <Text style={styles.bpCameraGuideTitle}>Estimacion por camara</Text>
              </View>
              <Text style={styles.bpCameraGuideText}>Coloca la yema del dedo sobre la camara y el flash, sin presionar demasiado.</Text>
              <Text style={styles.bpCameraGuideText}>Manten el telefono estable y evita cambios bruscos de luz durante la lectura.</Text>
            </View>
          )}

          <View style={styles.measureInfoRow}>
            <View style={styles.measureInfoItem}>
              <Text style={styles.measureInfoLabel}>Tiempo</Text>
              <Text style={styles.measureInfoValue}>{bloodPressureSecondsLeft}s</Text>
            </View>
            <View style={styles.measureInfoItem}>
              <Text style={styles.measureInfoLabel}>{bloodPressureMode === 'camera' ? 'Modo' : 'Lectura actual'}</Text>
              <Text style={styles.measureInfoValue}>{bloodPressureMode === 'camera' ? 'CAM' : `${bloodPressureSystolic}/${bloodPressureDiastolic}`}</Text>
            </View>
          </View>

          {bloodPressureMode === 'camera' ? (
            <View style={styles.bpCameraAreaCompact}>
              {cameraPermission?.granted ? (
                <>
                  <CameraView style={styles.bpCameraPreviewCompact} facing="back" enableTorch />
                  <View style={styles.cameraOverlay}>
                    <Ionicons name="finger-print-outline" size={20} color="#ffffff" />
                    <Text style={styles.cameraOverlayText}>Cubre lente y flash con tu dedo para estimar la presion</Text>
                  </View>
                </>
              ) : (
                <View style={styles.bpCameraPermissionWrapCompact}>
                  <Ionicons name="camera-outline" size={28} color="#5d7f8e" />
                  <Text style={styles.cameraPermissionText}>Permiso de camara pendiente</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.bpSampleArea}>
              <Ionicons name="pulse-outline" size={40} color={isMeasuringBloodPressure ? '#2f7a96' : '#8aa5b0'} />
              <Text style={styles.bpSampleText}>
                {isMeasuringBloodPressure ? 'Tomando muestra... mantente quieto' : 'Pulsa Iniciar muestra y sigue los pasos'}
              </Text>
              <Text style={styles.bpHelpText}>Referencia normal: 90/60 a 120/80 mmHg</Text>
            </View>
          )}

          {bloodPressureMode === 'camera' && (
            <View style={styles.bpCameraNoteCompact}>
              <Ionicons name="information-circle-outline" size={16} color="#2f7a96" />
              <Text style={styles.bpCameraNoteText}>
                Esta lectura es una estimacion basada en senal optica. Para una medicion clinica real, usa un tensiometro.
              </Text>
            </View>
          )}

          <View style={styles.modalButtonsRow}>
            <TouchableOpacity style={[styles.modalActionBtn, styles.modalActionBtnPrimary]} activeOpacity={0.85} onPress={onPrimaryAction}>
              <Text style={styles.modalActionBtnPrimaryText}>
                {bloodPressureMode === 'camera'
                  ? (isMeasuringBloodPressure ? 'Parar' : 'Iniciar camara')
                  : (isMeasuringBloodPressure ? 'Midiendo...' : 'Iniciar muestra')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalActionBtn, styles.modalActionBtnSecondary]} activeOpacity={0.85} onPress={onClose}>
              <Text style={styles.modalActionBtnSecondaryText}>Cancelar</Text>
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
  modalCardCompact: {
    paddingBottom: 14,
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
  bpVisualGuide: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d7edf5',
    backgroundColor: '#f5fbfe',
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  bpVisualItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  bpVisualIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f5fb',
    borderWidth: 1,
    borderColor: '#c9e7f2',
  },
  bpVisualText: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 14,
    color: '#21556b',
    fontWeight: '700',
  },
  bpInstructionsCard: {
    backgroundColor: '#f8fcfd',
    borderWidth: 1,
    borderColor: '#deedf3',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    gap: 6,
  },
  bpInstructionsTitle: {
    color: '#214b5d',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  bpInstructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bpInstructionStep: {
    width: 18,
    color: '#2f7a96',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  bpInstructionText: {
    flex: 1,
    color: '#4f6f7b',
    fontSize: 12,
    lineHeight: 17,
  },
  bpCameraGuideCard: {
    backgroundColor: '#f8fcfd',
    borderWidth: 1,
    borderColor: '#deedf3',
    borderRadius: 12,
    padding: 10,
    gap: 6,
    marginBottom: 12,
  },
  bpCameraGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  bpCameraGuideTitle: {
    color: '#214b5d',
    fontSize: 12,
    fontWeight: '700',
  },
  bpCameraGuideText: {
    color: '#4f6f7b',
    fontSize: 12,
    lineHeight: 17,
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
  bpCameraAreaCompact: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#deedf3',
    backgroundColor: '#0f1820',
    marginBottom: 10,
    height: 132,
  },
  bpCameraPreviewCompact: {
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
  bpCameraPermissionWrapCompact: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f5f8f9',
  },
  cameraPermissionText: {
    color: '#5d7f8e',
    fontSize: 13,
    fontWeight: '600',
  },
  bpSampleArea: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3fafc',
    borderWidth: 1,
    borderColor: '#deedf3',
    borderRadius: 14,
    paddingVertical: 20,
    marginBottom: 12,
  },
  bpSampleText: {
    color: '#2d5b6d',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  bpHelpText: {
    color: '#5d7f8e',
    fontSize: 12,
    marginTop: 6,
  },
  bpCameraNoteCompact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f3fafc',
    borderWidth: 1,
    borderColor: '#deedf3',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  bpCameraNoteText: {
    flex: 1,
    color: '#4f6f7b',
    fontSize: 12,
    lineHeight: 17,
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