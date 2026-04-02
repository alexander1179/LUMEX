// src/screens/WelcomeScreen.js
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { LanguageSelector } from '../components/common/LanguageSelector';  // 🔥 Ruta corregida
import { ThemeToggle } from '../components/common/ThemeToggle';  // 🔥 Ruta corregida

const { width, height } = Dimensions.get('window');
const icon = require('../../assets/lumex.jpeg');  // 🔥 Ruta corregida

export default function WelcomeScreen({ navigation }) {
  const { t } = useTranslation();
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.bgBlobTop} />
      <View style={styles.bgBlobMid} />
      <View style={styles.bgBlobBottom} />

      {/* Header con selectores */}
      <View style={styles.header}>
        <View style={styles.headerRight}>
          <ThemeToggle />
          <LanguageSelector />
        </View>
      </View>

      {/* Contenido animado */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Logo con presentación más limpia y sin contorno rectangular */}
        <Animated.View
          style={[
            styles.logoWrap,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={styles.logoGlowLarge} />
          <View style={styles.logoGlowSmall} />
          <View style={styles.logoFrame}>
            <Image
              source={icon}
              style={styles.logo}
            />
          </View>
        </Animated.View>
        
        {/* Título */}
        <Text style={styles.title}>Lumex</Text>
        <Text style={styles.subtitle}>
          {t('welcome.subtitle', 'Tu salud en la palma de tu mano')}
        </Text>
        
        {/* Descripción */}
        <Text style={styles.description}>
          {t('welcome.description', 'Accede a tus resultados médicos, consulta con especialistas y gestiona tu salud de manera fácil y segura.')}
        </Text>
      </Animated.View>

      {/* Botones de opciones */}
      <Animated.View 
        style={[
          styles.buttonsContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Text style={styles.accessTitle}>Acceso a la plataforma</Text>

        <TouchableOpacity
          style={styles.accessRow}
          onPress={() => navigation.replace("Login")}
          activeOpacity={0.8}
        >
          <View style={styles.accessRowContent}>
            <View style={styles.accessIconWrapPrimary}>
              <Ionicons name="log-in-outline" size={20} color="#0f6d78" />
            </View>
            <View style={styles.accessTextWrap}>
              <Text style={styles.accessTitleMain}>{t('welcome.alreadyHaveAccount', 'Ya tengo cuenta')}</Text>
              <Text style={styles.accessHintText}>{t('welcome.loginSubtext', 'Inicia sesión con tus credenciales')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#0f6d78" />
          </View>
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity
          style={styles.accessRow}
          onPress={() => navigation.navigate("Privacy")}
          activeOpacity={0.8}
        >
          <View style={styles.accessRowContent}>
            <View style={styles.accessIconWrapSecondary}>
              <Ionicons name="person-add-outline" size={20} color="#0f6d78" />
            </View>
            <View style={styles.accessTextWrap}>
              <Text style={styles.accessTitleMain}>{t('welcome.newUser', 'Soy nuevo usuario')}</Text>
              <Text style={styles.accessHintText}>{t('welcome.registerSubtext', 'Regístrate de forma guiada y segura')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#0f6d78" />
          </View>
        </TouchableOpacity>

      </Animated.View>

      {/* Versión */}
      <Text style={styles.version}>
        {t('common.version', 'Versión 1.0')}
      </Text>

      <StatusBar barStyle="dark-content" backgroundColor="#eaf6f5" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eaf6f5',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    top: height * 0.28,
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
  header: {
    position: 'absolute',
    top: 50,
    right: 15,
    zIndex: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    marginTop: 60,
  },
  logoWrap: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
    backgroundColor: 'rgba(255,255,255,0.8)',
    zIndex: 2,
    shadowColor: '#0f6d78',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#15333d',
    marginBottom: 10,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#1e4e5a',
    textAlign: 'center',
    marginBottom: 14,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#47626a',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 20,
  },
  buttonsContainer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 44,
    gap: 12,
  },
  accessTitle: {
    color: '#3a5962',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 8,
  },
  accessRow: {
    paddingVertical: 6,
  },
  accessRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(15, 109, 120, 0.22)',
    marginVertical: 2,
  },
  accessTextWrap: {
    flex: 1,
  },
  accessTitleMain: {
    color: '#15333d',
    fontSize: 21,
    fontWeight: '700',
    marginBottom: 3,
  },
  accessHintText: {
    color: '#49666f',
    fontSize: 13,
    fontWeight: '500',
  },
  accessIconWrapPrimary: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(87, 191, 166, 0.26)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessIconWrapSecondary: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(121, 200, 214, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  version: {
    position: 'absolute',
    bottom: 20,
    color: 'rgba(21,51,61,0.45)',
    fontSize: 12,
    textAlign: 'center',
    width: '100%',
  },
});