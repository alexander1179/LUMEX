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
import { Modal } from 'react-native';
import { CustomButton } from '../components/common/CustomButton';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { AccessQuickNav } from '../components/common/AccessQuickNav';
import { loginUser, acceptSecurityTerms, forgotPassword, verifyToken } from '../services/api/authService';

import { storageService } from '../services/storage/storageService';

const icon = require('../../assets/lumex.jpeg');
const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();

  const theme = {
    background: '#091c2b',
    card: 'rgba(20, 39, 56, 0.85)',
    cardBorder: 'rgba(15,109,120,0.4)',
    input: 'rgba(11, 25, 38, 0.95)',
    inputText: '#6bcad8',
    mutedText: '#6f8d99',
    title: '#ffffff',
    accent: '#18c6cd',
    accentHover: '#139ea3'
  };

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [token, setToken] = useState("");
  const [pendingUser, setPendingUser] = useState(null);
  const [verifyingToken, setVerifyingToken] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(25)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const clearLoginInputs = () => {
    setUsuario('');
    setPassword('');
    setVisible(false);
    Keyboard.dismiss();
  };

  const handleLogin = async () => {
    if (!usuario.trim() || !password.trim()) {
      Alert.alert('Datos requeridos', 'Debes completar usuario y contraseña');
      return;
    }

    setLoading(true);
    try {
      const deviceInfo = { platform: 'mobile', version: '1.0', model: 'React Native App' };
      const result = await loginUser(usuario.trim(), password, true, deviceInfo, {});

      if (result.success) {
        // En lugar de entrar directo, solicitamos al servidor que envíe el token de seguridad oficial
        // Reutilizamos el sistema de forgotPassword para enviar el email con el código
        const emailResult = await forgotPassword(result.user.email);
        
        if (!emailResult.success) {
           Alert.alert('Seguridad Lumex', 'No pudimos enviarte el token de seguridad. ' + emailResult.message);
           setLoading(false);
           return;
        }

        setPendingUser(result.user);
        setShowTokenModal(true);
        
        if (emailResult.devOtp) {
          Alert.alert('Modo Desarrollo / Local', emailResult.message);
          setToken(emailResult.devOtp); // Autocompletar el token para facilidad
        }
      } else {
        clearLoginInputs();
        Alert.alert('Error de Acceso', result.message);
      }
    } catch (error) {
      clearLoginInputs();
      Alert.alert('Error', 'Error de conexión: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifySecurityToken = async () => {
    if (token.length < 4) {
      Alert.alert('Token incompleto', 'Por favor ingresa el token de seguridad recibido.');
      return;
    }

    setVerifyingToken(true);
    try {
      // Verificar el token oficialmente contra el servidor
      const result = await verifyToken(pendingUser.email, token);

      if (result.success) {
        const role = String(pendingUser?.rol || 'usuario').toLowerCase();

        await storageService.saveUser(pendingUser);
        setShowTokenModal(false);
        
        // Limpiar campos para la próxima vez
        setUsuario("");
        setPassword("");
        setToken("");

        if (role === 'superadmin' || role === 'superadministrador' || role === 'master') {
          navigation.replace("SuperAdminDashboard");
        } else if (role === 'admin' || role === 'administrador') {
          navigation.replace("AdminDashboard");
        } else {
          navigation.replace("Main");
        }
      } else {
        Alert.alert('Token incorrecto', 'El código ingresado es inválido o ha expirado.');
      }
    } catch (error) {
      Alert.alert('Error', 'No pudimos verificar el token: ' + error.message);
    } finally {
      setVerifyingToken(false);
    }
  };

  const handleCancelToken = () => {
    setShowTokenModal(false);
    setUsuario("");
    setPassword("");
    setToken("");
    setPendingUser(null);
    Alert.alert('Sesión Cancelada', 'Por seguridad, se han borrado tus credenciales ingresadas.');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }] }>
      <View style={styles.bgGlowTop} />
      <View style={styles.bgGlowBottom} />

      <View style={styles.header} pointerEvents="box-none">
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.contentCluster, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoWrap}>
            <View style={styles.logoGlowLarge} />
            <View style={styles.logoFrame}>
              <Image source={icon} style={styles.logoImage} />
            </View>
          </View>

          <Text style={[styles.title, { color: theme.title }]}>Lumex</Text>
          <Text style={[styles.introText, { color: theme.mutedText }]}>Ingresa tus credenciales únicas para acceder a tu plataforma de salud integral.</Text>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <TextInput
              placeholder="Usuario o correo"
              placeholderTextColor="#314e60"
              style={[styles.input, { backgroundColor: theme.input, color: theme.inputText }]}
              value={usuario}
              onChangeText={setUsuario}
              autoCapitalize="none"
              keyboardAppearance="dark"
            />

            <View style={[styles.passwordRow, { backgroundColor: theme.input }] }>
              <TextInput
                placeholder={t('login.password')}
                placeholderTextColor="#314e60"
                secureTextEntry={!visible}
                style={[styles.inputPassword, { color: theme.inputText }]}
                value={password}
                onChangeText={setPassword}
                keyboardAppearance="dark"
              />
              <TouchableOpacity onPress={() => setVisible(!visible)} style={styles.eyeButton} activeOpacity={0.8}>
                <Ionicons name={visible ? 'eye-outline' : 'eye-off-outline'} size={20} color={theme.accent} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotTouch} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={[styles.forgot, { color: theme.accent }]}>{t('login.forgotPassword')}</Text>
            </TouchableOpacity>

            <CustomButton
              title={loading ? 'Procesando...' : 'Acceder'}
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              backgroundColor={theme.accent}
              backgroundColorPressed={theme.accentHover}
            />

            <View style={styles.dividerBox}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>¿Eres nuevo?</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity style={styles.registerBtn} onPress={() => navigation.navigate('Register')}>
              <Ionicons name="person-add-outline" size={16} color={theme.accent} style={{marginRight: 6}} />
              <Text style={[styles.registerBtnText, { color: theme.accent }]}>Crear cuenta segura</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      <Modal visible={showTokenModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.tokenCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
             <View style={styles.tokenIconCircle}>
                <Ionicons name="shield-checkmark" size={32} color={theme.accent} />
             </View>
             <Text style={styles.tokenTitle}>Verificación de Seguridad</Text>
             <Text style={styles.tokenSub}>Hemos detectado un nuevo inicio de sesión. Por seguridad, ingresa el token enviado a tu dispositivo.</Text>
             
             <TextInput
               style={styles.tokenInput}
               placeholder="******"
               placeholderTextColor="#314e60"
               keyboardType="number-pad"
               maxLength={6}
               value={token}
               onChangeText={setToken}
             />

             <TouchableOpacity 
                style={[styles.tokenBtn, {backgroundColor: theme.accent}]} 
                onPress={verifySecurityToken}
                disabled={verifyingToken}
             >
                <Text style={styles.tokenBtnText}>{verifyingToken ? 'Verificando...' : 'Confirmar Identidad'}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={{marginTop: 15, padding: 10}} onPress={handleCancelToken}>
                <Text style={{color: '#ff4d4d', fontSize: 14, fontWeight: 'bold'}}>Cancelar y Salir</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#091c2b' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  contentCluster: { width: '100%', alignItems: 'center' },
  
  bgGlowTop: {
    position: 'absolute', width: width * 1.5, height: width * 1.5,
    borderRadius: width, backgroundColor: 'rgba(24, 198, 205, 0.04)',
    top: -width * 0.5, left: -width * 0.25,
  },
  bgGlowBottom: {
    position: 'absolute', width: width, height: width,
    borderRadius: width / 2, backgroundColor: 'rgba(24, 198, 205, 0.05)',
    bottom: -width * 0.4, right: -width * 0.3,
  },
  
  header: {
    position: 'absolute', top: 40, right: 20, zIndex: 10,
  },
  languageWrap: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(24, 198, 205, 0.2)'
  },
  languageSelectorButton: { width: 36, height: 36, borderRadius: 18 },
  
  logoWrap: { marginBottom: 20, alignItems: 'center', justifyContent: 'center' },
  logoGlowLarge: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(24, 198, 205, 0.1)',
  },
  logoFrame: {
    width: 90, height: 90, borderRadius: 45, overflow: 'hidden',
    borderWidth: 2, borderColor: '#18c6cd',
  },
  logoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  title: { fontSize: 28, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 },
  introText: { fontSize: 13, textAlign: 'center', maxWidth: '80%', marginBottom: 26, lineHeight: 18 },
  
  card: {
    width: '88%', maxWidth: 400, borderRadius: 24, padding: 22,
    borderWidth: 1, elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5, shadowRadius: 20,
  },
  
  input: {
    padding: 14, borderRadius: 14, marginBottom: 12, fontSize: 15,
    borderWidth: 1, borderColor: 'rgba(24, 198, 205, 0.15)',
  },
  passwordRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14, 
    marginBottom: 8, borderWidth: 1, borderColor: 'rgba(24, 198, 205, 0.15)',
  },
  inputPassword: { flex: 1, padding: 14, fontSize: 15 },
  eyeButton: { padding: 12 },
  
  forgotTouch: { alignSelf: 'flex-end', marginBottom: 16 },
  forgot: { fontSize: 12, fontWeight: '600' },
  
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingLeft: 4 },
  checkbox: { borderRadius: 4, width: 18, height: 18 },
  checkboxText: { marginLeft: 10, fontSize: 12, flex: 1 },
  
  dividerBox: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dividerText: { color: '#6f8d99', paddingHorizontal: 12, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  
  registerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 14,
    backgroundColor: 'rgba(24, 198, 205, 0.08)',
    borderWidth: 1, borderColor: 'rgba(24, 198, 205, 0.25)',
  },
  registerBtnText: { fontSize: 14, fontWeight: '700' },
  // Estilos del Token
  modalOverlay: { flex: 1, backgroundColor: 'rgba(5, 15, 25, 0.9)', justifyContent: 'center', alignItems: 'center' },
  tokenCard: { width: '85%', padding: 25, borderRadius: 24, borderWidth: 1, alignItems: 'center' },
  tokenIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(24, 198, 205, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  tokenTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  tokenSub: { color: '#6f8d99', fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  tokenInput: { width: '100%', backgroundColor: 'rgba(11, 25, 38, 0.95)', padding: 15, borderRadius: 14, fontSize: 24, textAlign: 'center', color: '#18c6cd', letterSpacing: 10, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(24, 198, 205, 0.3)' },
  tokenBtn: { width: '100%', paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  tokenBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
