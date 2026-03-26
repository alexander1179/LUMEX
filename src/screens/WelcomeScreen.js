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
        {/* Logo con animación de escala */}
        <Animated.Image 
          source={icon} 
          style={[styles.logo, { transform: [{ scale: scaleAnim }] }]} 
        />
        
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
        {/* Botón "Ya tengo cuenta" */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.replace("Login")}
          activeOpacity={0.8}
        >
          <Text style={styles.loginButtonText}>
            {t('welcome.alreadyHaveAccount', '🔐 Ya tengo cuenta')}
          </Text>
          <Text style={styles.loginButtonSubtext}>
            {t('welcome.loginSubtext', 'Inicia sesión con tus datos')}
          </Text>
        </TouchableOpacity>

        {/* Botón "Soy nuevo usuario" */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate("Privacy")}
          activeOpacity={0.8}
        >
          <Text style={styles.registerButtonText}>
            {t('welcome.newUser', '✨ Soy nuevo usuario')}
          </Text>
          <Text style={styles.registerButtonSubtext}>
            {t('welcome.registerSubtext', 'Crea tu cuenta en pocos pasos')}
          </Text>
        </TouchableOpacity>

      </Animated.View>

      {/* Versión */}
      <Text style={styles.version}>
        {t('common.version', 'Versión 1.0')}
      </Text>

      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginTop: 80,
  },
  logo: {
    width: width * 0.7,
    height: 120,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  buttonsContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 15,
  },
  loginButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loginButtonText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  loginButtonSubtext: {
    color: colors.primaryLight,
    fontSize: 12,
    opacity: 0.8,
  },
  registerButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  registerButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  version: {
    position: 'absolute',
    bottom: 20,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
    width: '100%',
  },
});