// src/screens/GraciasScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const icon = require('../../assets/lumex.jpeg');
const { width, height } = Dimensions.get('window');

export default function GraciasScreen({ navigation }) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.bgBlobTop} />
      <View style={styles.bgBlobMid} />
      <View style={styles.bgBlobBottom} />

      <View style={styles.content}>
        <View style={styles.logoStage}>
          <View style={styles.logoGlowLarge} />
          <View style={styles.logoGlowSmall} />
          <View style={styles.logoFrame}>
            <Image source={icon} style={styles.image} />
          </View>
        </View>

        <Text style={styles.title}>Lumex</Text>
        <Text style={styles.text}>
          {t('gracias.message') || 'Gracias por visitar Lumex.'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.replace("Privacy")}
        activeOpacity={0.85}
      >
        <Text style={styles.backButtonText}>Volver</Text>
      </TouchableOpacity>

      <StatusBar barStyle="dark-content" backgroundColor="#eaf6f5" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 40,
    backgroundColor: "#eaf6f5",
    overflow: 'hidden',
  },
  bgBlobTop: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width,
    backgroundColor: 'rgba(139, 214, 197, 0.25)',
    top: -width * 0.32,
    right: -width * 0.15,
  },
  bgBlobMid: {
    position: 'absolute',
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: width,
    backgroundColor: 'rgba(121, 200, 214, 0.2)',
    top: height * 0.3,
    left: -width * 0.35,
  },
  bgBlobBottom: {
    position: 'absolute',
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: width,
    backgroundColor: 'rgba(15, 109, 120, 0.1)',
    bottom: -width * 0.4,
    right: -width * 0.3,
  },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoStage: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    position: 'relative',
  },
  logoGlowLarge: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(15, 109, 120, 0.08)',
  },
  logoGlowSmall: {
    position: 'absolute',
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: 'rgba(15, 109, 120, 0.14)',
  },
  logoFrame: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#0f6d78',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#15333d',
    marginBottom: 10,
    letterSpacing: 1,
  },
  text: {
    fontSize: 16,
    color: '#47626a',
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 310,
  },
  backButton: {
    width: '100%',
    maxWidth: 180,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(15, 109, 120, 0.22)',
    paddingVertical: 11,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#0f6d78',
    fontSize: 15,
    fontWeight: '700',
  },
});