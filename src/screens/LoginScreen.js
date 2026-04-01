// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Checkbox from "expo-checkbox";
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { CustomButton } from '../components/common/CustomButton';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { loginUser, acceptSecurityTerms } from '../services/supabase/authService';
import { storageService } from '../services/storage/storageService';
import { supabase } from '../services/supabase/supabaseClient';

const icon = require('../../assets/lumex.jpeg');

export default function LoginScreen({ navigation, route }) {
  const { t } = useTranslation();
  const isAdminAccess = route?.params?.role === 'admin';
  const adminTheme = {
    background: '#f3f1ec',
    card: '#fbfaf7',
    cardBorder: '#dfd9cf',
    input: '#f0ebe3',
    inputText: '#161616',
    mutedText: '#5f5a54',
    title: '#161616',
    accent: '#6f6a62',
    backButton: '#ece7de',
    backIcon: '#161616',
  };
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [acepta, setAcepta] = useState(false);
  const [loading, setLoading] = useState(false);

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
        { requiredRole: isAdminAccess ? 'admin' : null }
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
        Alert.alert('Error', result.message);
      }

    } catch (error) {
      Alert.alert('Error', 'Error de conexión: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, isAdminAccess && { backgroundColor: adminTheme.background }] }>
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, isAdminAccess && { backgroundColor: adminTheme.backButton }]}
          onPress={() => navigation.replace(isAdminAccess ? "RoleSelect" : "Welcome")}
          activeOpacity={0.7}
        >
          <Text style={[styles.backButtonText, isAdminAccess && { color: adminTheme.backIcon }]}>←</Text>
        </TouchableOpacity>
        <LanguageSelector />
      </View>
      
      <View style={[styles.logoShell, isAdminAccess && styles.logoShellAdmin]}>
        <View style={[styles.logoContour, isAdminAccess && styles.logoContourAdmin]}>
          <Image source={icon} style={[styles.logo, isAdminAccess && styles.adminLogo]} />
        </View>
      </View>
      <Text style={[styles.subtitle, isAdminAccess && { color: adminTheme.title }]}>{isAdminAccess ? 'Acceso Administrador' : t('login.title')}</Text>

      <View style={[styles.card, isAdminAccess && { backgroundColor: adminTheme.card, borderColor: adminTheme.cardBorder, shadowOpacity: 0.08, elevation: 4 }] }>
        {isAdminAccess && (
          <Text style={[styles.adminCaption, { color: adminTheme.mutedText }]}>Ingresa con una cuenta autorizada para administrar la plataforma.</Text>
        )}
        <TextInput
          placeholder={isAdminAccess ? 'Usuario administrador' : 'Usuario'}
          placeholderTextColor={isAdminAccess ? '#7a746d' : '#aaa'}
          style={[styles.input, isAdminAccess && { backgroundColor: adminTheme.input, color: adminTheme.inputText }]}
          value={usuario}
          onChangeText={setUsuario}
          autoCapitalize="none"
        />

        <View style={[styles.passwordRow, isAdminAccess && { backgroundColor: adminTheme.input }] }>
          <TextInput
            placeholder={t('login.password')}
            placeholderTextColor={isAdminAccess ? '#7a746d' : '#aaa'}
            secureTextEntry={!visible}
            style={[styles.inputPassword, isAdminAccess && { color: adminTheme.inputText }]}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setVisible(!visible)}
            style={[styles.eyeButton, isAdminAccess && styles.eyeButtonAdmin]}
            activeOpacity={0.8}
          >
            <Ionicons
              name={visible ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={isAdminAccess ? adminTheme.accent : '#bcbcbc'}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={[styles.forgot, isAdminAccess && { color: adminTheme.accent }]}>{t('login.forgotPassword')}</Text>
        </TouchableOpacity>

        <View style={styles.checkboxRow}>
          <Checkbox 
            value={acepta} 
            onValueChange={setAcepta} 
            color={acepta ? (isAdminAccess ? adminTheme.accent : colors.primary) : undefined} 
          />
          <Text style={[styles.checkboxText, isAdminAccess && { color: adminTheme.mutedText }]}>{t('login.acceptTerms')}</Text>
        </View>

        {isAdminAccess ? (
          <TouchableOpacity
            style={[styles.adminLoginButton, loading && styles.adminLoginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.9}
          >
            <Text style={styles.adminLoginButtonText}>{loading ? t('common.loading') : t('login.loginButton')}</Text>
          </TouchableOpacity>
        ) : (
          <CustomButton 
            title={loading ? t('common.loading') : t('login.loginButton')}
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
          />
        )}

        {!isAdminAccess && (
          <>
            <Text style={styles.divider}>──────── o ────────</Text>

            <TouchableOpacity onPress={() => navigation.navigate("Register") }>
              <Text style={styles.register}>{t('login.noAccount')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.testBtn}
              onPress={() => navigation.navigate("TestRegistro")}
            >
              <Text style={styles.testBtnText}>🧪 Prueba de Registro</Text>
            </TouchableOpacity>
          </>
        )}

      </View>

      <StatusBar style={isAdminAccess ? 'dark' : 'light'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: "center",
    paddingTop: 60,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
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
  backButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  logo: {
    width: 330,
    height: 150,
    borderRadius: 32,
  },
  logoShell: {
    marginTop: 100,
    marginBottom: 12,
    borderRadius: 40,
    padding: 3,
    backgroundColor: '#ffd4d4',
  },
  logoShellAdmin: {
    backgroundColor: '#e4ded4',
  },
  logoContour: {
    borderRadius: 37,
    padding: 4,
    backgroundColor: '#ffefef',
  },
  logoContourAdmin: {
    backgroundColor: '#f2ede4',
  },
  adminLogo: {
    opacity: 0.9,
  },
  subtitle: {
    color: "#fff",
    marginBottom: 20,
    fontSize: 16
  },
  card: {
    width: "90%",
    backgroundColor: "#1c1c1c",
    borderRadius: 25,
    padding: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  adminCaption: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  input: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
    color: "white",
    fontSize: 16,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 20,
    paddingHorizontal: 15,
    marginBottom: 10
  },
  inputPassword: {
    flex: 1,
    color: "white",
    paddingVertical: 15,
    fontSize: 16
  },
  eyeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  eyeButtonAdmin: {
    backgroundColor: '#e7e1d8',
  },
  eyeIcon: {
    color: "#aaa",
    fontSize: 20
  },
  forgot: {
    color: "#ff5252",
    textAlign: "right",
    marginBottom: 15,
    fontSize: 14
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20
  },
  checkboxText: {
    color: "#ccc",
    marginLeft: 10,
    fontSize: 14
  },
  divider: {
    color: "#aaa",
    textAlign: "center",
    marginVertical: 15,
    fontSize: 14
  },
  register: {
    color: colors.primary,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold"
  },
  testBtn: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255, 152, 0, 0.3)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  testBtnText: {
    color: '#ff9800',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  adminLoginButton: {
    backgroundColor: '#716a63',
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5f5852',
  },
  adminLoginButtonDisabled: {
    opacity: 0.6,
  },
  adminLoginButtonText: {
    color: '#f8f5ef',
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
