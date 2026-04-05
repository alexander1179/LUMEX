// src/screens/LoginScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Keyboard,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Checkbox from "expo-checkbox";
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { CustomButton } from '../components/common/CustomButton';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { AccessQuickNav } from '../components/common/AccessQuickNav';
import { loginUser, acceptSecurityTerms } from '../services/supabase/authService';
import { storageService } from '../services/storage/storageService';
import { supabase } from '../services/supabase/supabaseClient';

const icon = require('../../assets/lumex.jpeg');
const adminIcon = require('../../assets/icon.png');
const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation, route }) {
  const { t } = useTranslation();
  const isAdminAccess = route?.params?.role === 'admin';
  const adminTheme = {
    background: '#eaf6f5',
    card: 'rgba(255,255,255,0.9)',
    cardBorder: 'rgba(15,109,120,0.24)',
    input: '#f4fbfb',
    inputText: '#15333d',
    mutedText: '#4f666c',
    title: '#15333d',
    accent: '#0f6d78',
    backButton: 'rgba(255,255,255,0.8)',
    backIcon: '#0f6d78',
  };
  const userTheme = {
    background: '#eaf6f5',
    card: 'rgba(255,255,255,0.86)',
    cardBorder: 'rgba(15,109,120,0.22)',
    input: '#f4fbfb',
    inputText: '#15333d',
    mutedText: '#4f666c',
    title: '#15333d',
    accent: '#0f6d78',
    backButton: 'rgba(255,255,255,0.8)',
    backIcon: '#0f6d78',
  };
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [acepta, setAcepta] = useState(false);
  const [loading, setLoading] = useState(false);
  const userFadeAnim = useRef(new Animated.Value(0)).current;
  const userLogoScaleAnim = useRef(new Animated.Value(0.94)).current;
  const userCardSlideAnim = useRef(new Animated.Value(22)).current;

  useEffect(() => {
    if (isAdminAccess) return;

    Animated.parallel([
      Animated.timing(userFadeAnim, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
      }),
      Animated.spring(userLogoScaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.timing(userCardSlideAnim, {
        toValue: 0,
        duration: 460,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isAdminAccess, userCardSlideAnim, userFadeAnim, userLogoScaleAnim]);

  const clearLoginInputs = () => {
    setUsuario('');
    setPassword('');
    setVisible(false);
    Keyboard.dismiss();
  };

  const handleLogin = async () => {
    if (!acepta) {
      Alert.alert('Error', 'Debes aceptar los términos y condiciones');
      return;
    }

    if (!usuario.trim() || !password.trim()) {
      Alert.alert('Error', 'Debes completar usuario y contraseña');
      return;
    }

    setLoading(true);
    console.log('🔐 Intentando login con usuario:', usuario);

    try {
      // Obtener información del dispositivo para el registro de términos
      const deviceInfo = {
        platform: 'mobile',
        version: '1.0',
        model: 'React Native App'
      };

      const result = await loginUser(
        usuario.trim(),
        password,
        true,
        deviceInfo,
        { requiredRole: isAdminAccess ? 'admin' : 'usuario' }
      );

      if (result.success) {
        await storageService.saveUser(result.user);

        // Si el usuario no había aceptado términos previamente, ya se aceptaron automáticamente
        if (!result.termsAccepted) {
          console.log('✅ Términos aceptados automáticamente durante login');
        }

        const welcomeName = result.user?.nombre || result.user?.name || result.user?.usuario || 'Usuario';
        Alert.alert('Éxito', `Bienvenido ${welcomeName}`, [
          { text: 'OK', onPress: () => navigation.replace(isAdminAccess ? "AdminDashboard" : "Main") }
        ]);
      } else {
        clearLoginInputs();
        Alert.alert('Error', result.message);
      }

    } catch (error) {
      clearLoginInputs();
      Alert.alert('Error', 'Error de conexión: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isAdminAccess ? adminTheme.background : userTheme.background }] }>
      <View style={styles.bgBlobTop} />
      <View style={styles.bgBlobMid} />
      <View style={styles.bgBlobBottom} />

      <View style={styles.header} pointerEvents="box-none">
        {isAdminAccess ? (
          <TouchableOpacity 
            style={[styles.backButton, styles.backButtonAdmin, { backgroundColor: adminTheme.backButton }]}
            onPress={() => navigation.replace("RoleSelect")}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back-outline" size={22} color={adminTheme.backIcon} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
        <View style={[styles.languageWrap, isAdminAccess ? styles.languageWrapAdmin : styles.languageWrapUser]}>
          <LanguageSelector style={styles.languageSelectorButton} />
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isAdminAccess}
        bounces={!isAdminAccess}
        alwaysBounceVertical={false}
        contentContainerStyle={[
          styles.scrollContent,
          styles.scrollContentWithNav,
          isAdminAccess && styles.scrollContentAdmin,
        ]}
        scrollEventThrottle={16}
      >
        {isAdminAccess ? (
          <View style={styles.adminContentCluster}>
            <View style={[styles.userLogoWrap, styles.adminLogoWrap]}>
              <View style={styles.userLogoGlowLarge} />
              <View style={styles.userLogoGlowSmall} />
              <View style={[styles.userLogoFrame, styles.adminLogoFrame]}>
                <Image source={adminIcon} style={[styles.userLogoImage, styles.adminLogoImage]} />
              </View>
            </View>

            <Text style={[styles.subtitle, { color: adminTheme.title }]}>Acceso Administrador</Text>

            <View style={styles.adminOnlyBanner}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#0f6d78" style={{ marginRight: 6 }} />
              <Text style={styles.adminOnlyBannerText}>
                Acceso exclusivo para administradores. Si eres usuario regular, regresa y selecciona{' '}
                <Text style={styles.adminOnlyBannerBold}>Acceso de usuario</Text>.
              </Text>
            </View>

            <View
              style={[
                styles.card,
                styles.adminCard,
                {
                  backgroundColor: adminTheme.card,
                  borderColor: adminTheme.cardBorder,
                  shadowOpacity: 0.08,
                  elevation: 4,
                },
              ]}
            >
              <Text style={[styles.adminCaption, { color: adminTheme.mutedText }]}>Ingresa con una cuenta autorizada para administrar la plataforma.</Text>

              <TextInput
                placeholder="Usuario administrador"
                placeholderTextColor="#7a746d"
                style={[styles.input, { backgroundColor: adminTheme.input, color: adminTheme.inputText }]}
                value={usuario}
                onChangeText={setUsuario}
                autoCapitalize="none"
              />

              <View style={[styles.passwordRow, { backgroundColor: adminTheme.input }] }>
                <TextInput
                  placeholder={t('login.password')}
                  placeholderTextColor="#7a746d"
                  secureTextEntry={!visible}
                  style={[styles.inputPassword, { color: adminTheme.inputText }]}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setVisible(!visible)}
                  style={[styles.eyeButton, styles.eyeButtonAdmin]}
                  activeOpacity={0.8}
                >
                  <Ionicons name={visible ? 'eye-outline' : 'eye-off-outline'} size={20} color={adminTheme.accent} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={[styles.forgot, { color: adminTheme.accent }]}>{t('login.forgotPassword')}</Text>
              </TouchableOpacity>

              <View style={styles.checkboxRow}>
                <Checkbox
                  value={acepta}
                  onValueChange={setAcepta}
                  color={acepta ? adminTheme.accent : undefined}
                />
                <Text style={[styles.checkboxText, { color: adminTheme.mutedText }]}>{t('login.acceptTerms')}</Text>
              </View>

              <TouchableOpacity
                style={[styles.adminLoginButton, loading && styles.adminLoginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.9}
              >
                <Text style={styles.adminLoginButtonText}>{loading ? t('common.loading') : t('login.loginButton')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Animated.View
              style={[
                styles.userLogoWrap,
                {
                  opacity: userFadeAnim,
                  transform: [{ scale: userLogoScaleAnim }],
                },
              ]}
            >
              <View style={styles.userLogoGlowLarge} />
              <View style={styles.userLogoGlowSmall} />
              <View style={styles.userLogoFrame}>
                <Image source={icon} style={styles.userLogoImage} />
              </View>
            </Animated.View>

            <Animated.Text style={[styles.subtitle, { color: userTheme.title, opacity: userFadeAnim }]}>Acceso de usuario</Animated.Text>
            <Animated.Text style={[styles.userIntroText, { opacity: userFadeAnim }]}>Ingresa con tus credenciales para continuar en un entorno seguro de salud.</Animated.Text>

            <Animated.View
              style={[
                styles.card,
                styles.userCard,
                {
                  backgroundColor: userTheme.card,
                  borderColor: userTheme.cardBorder,
                  shadowOpacity: 0.16,
                  elevation: 6,
                  opacity: userFadeAnim,
                  transform: [{ translateY: userCardSlideAnim }],
                },
              ]}
            >
              <TextInput
                placeholder="Usuario"
                placeholderTextColor="#6b848b"
                style={[styles.input, { backgroundColor: userTheme.input, color: userTheme.inputText }]}
                value={usuario}
                onChangeText={setUsuario}
                autoCapitalize="none"
              />

              <View style={[styles.passwordRow, { backgroundColor: userTheme.input }] }>
                <TextInput
                  placeholder={t('login.password')}
                  placeholderTextColor="#6b848b"
                  secureTextEntry={!visible}
                  style={[styles.inputPassword, { color: userTheme.inputText }]}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setVisible(!visible)} style={styles.eyeButton} activeOpacity={0.8}>
                  <Ionicons name={visible ? 'eye-outline' : 'eye-off-outline'} size={20} color={userTheme.accent} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={[styles.forgot, { color: userTheme.accent }]}>{t('login.forgotPassword')}</Text>
              </TouchableOpacity>

              <View style={styles.checkboxRow}>
                <Checkbox
                  value={acepta}
                  onValueChange={setAcepta}
                  color={acepta ? userTheme.accent : undefined}
                />
                <Text style={[styles.checkboxText, { color: userTheme.mutedText }]}>{t('login.acceptTerms')}</Text>
              </View>

              <CustomButton
                title={loading ? t('common.loading') : t('login.loginButton')}
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                backgroundColor="#0f6d78"
                backgroundColorPressed="#074f57"
              />

              <TouchableOpacity style={styles.testBtn} onPress={() => navigation.navigate('TestRegistro')}>
                <Text style={styles.testBtnText}>Prueba de registro</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}
      </ScrollView>

      <AccessQuickNav navigation={navigation} current={isAdminAccess ? 'admin' : 'usuario'} />

      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 100,
    paddingBottom: 30,
    alignItems: 'center',
  },
  scrollContentWithNav: {
    paddingBottom: 126,
  },
  scrollContentAdmin: {
    justifyContent: 'center',
    paddingTop: 84,
    paddingBottom: 168,
  },
  adminContentCluster: {
    width: '100%',
    minHeight: height - 150,
    justifyContent: 'center',
    alignItems: 'center',
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
  header: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonAdmin: {
    marginTop: 34,
  },
  backButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  languageWrap: {
    minHeight: 40,
    justifyContent: 'center',
  },
  languageWrapAdmin: {
    marginTop: 34,
  },
  languageWrapUser: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginTop: 34,
    marginRight: 4,
    borderWidth: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  languageSelectorButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 0,
    backgroundColor: 'rgba(15,109,120,0.12)',
  },
  userLogoWrap: {
    width: 194,
    height: 194,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 10,
    position: 'relative',
  },
  adminLogoWrap: {
    marginTop: 6,
  },
  userLogoGlowLarge: {
    position: 'absolute',
    width: 184,
    height: 184,
    borderRadius: 92,
    backgroundColor: 'rgba(15, 109, 120, 0.08)',
  },
  userLogoGlowSmall: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: 'rgba(15, 109, 120, 0.15)',
  },
  userLogoFrame: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.92)',
    shadowColor: '#0f6d78',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  adminLogoFrame: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  userLogoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  adminLogoImage: {
    resizeMode: 'contain',
    padding: 20,
  },
  subtitle: {
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  userIntroText: {
    color: '#4d6970',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: -4,
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  card: {
    width: "90%",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    elevation: 5,
    shadowColor: "#0f6d78",
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    marginTop: 4,
    marginBottom: 0,
  },
  userCard: {
    borderRadius: 24,
    paddingTop: 18,
    paddingBottom: 14,
  },
  adminCard: {
    marginTop: 10,
    width: '88%',
    marginBottom: 24,
  },
  adminOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(15,109,120,0.2)',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 13,
    marginBottom: 14,
    width: '88%',
  },
  adminOnlyBannerText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#31525a',
  },
  adminOnlyBannerBold: {
    fontWeight: '700',
    color: '#0f6d78',
  },
  adminCaption: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    fontSize: 15,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 8
  },
  inputPassword: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15
  },
  eyeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,109,120,0.08)',
  },
  eyeButtonAdmin: {
    backgroundColor: 'rgba(15,109,120,0.08)',
  },
  eyeIcon: {
    color: "#aaa",
    fontSize: 20
  },
  forgot: {
    textAlign: "right",
    marginBottom: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16
  },
  checkboxText: {
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  divider: {
    color: "#6f8389",
    textAlign: "center",
    marginVertical: 12,
    fontSize: 13
  },
  register: {
    color: '#0f6d78',
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    marginVertical: 4,
  },
  testBtn: {
    marginTop: 11,
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(121,200,214,0.18)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(15,109,120,0.25)',
  },
  testBtnText: {
    color: '#0f6d78',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
  },
  adminLoginButton: {
    backgroundColor: '#0f6d78',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0b5660',
  },
  adminLoginButtonDisabled: {
    opacity: 0.6,
  },
  adminLoginButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  newUserButton: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  newUserText: {
    color: '#ff5252',
    fontSize: 14,
    fontWeight: '500',
  },
});
