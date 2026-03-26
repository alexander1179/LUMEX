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
import { colors } from '../styles/colors';
import { CustomButton } from '../components/common/CustomButton';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { loginUser, acceptSecurityTerms } from '../services/supabase/authService';
import { storageService } from '../services/storage/storageService';
import { supabase } from '../services/supabase/supabaseClient';

const icon = require('../../assets/lumex.jpeg');

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
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

      const result = await loginUser(usuario.trim(), password, true, deviceInfo);

      if (result.success) {
        await storageService.saveUser(result.user);

        // Si el usuario no había aceptado términos previamente, ya se aceptaron automáticamente
        if (!result.termsAccepted) {
          console.log('✅ Términos aceptados automáticamente durante login');
        }

        Alert.alert('Éxito', `Bienvenido ${result.user.user_metadata?.name || 'Usuario'}`, [
          { text: 'OK', onPress: () => navigation.replace("Main") }
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <LanguageSelector />
      </View>
      
      <Image source={icon} style={styles.logo} />
      <Text style={styles.subtitle}>{t('login.title')}</Text>

      <View style={styles.card}>
        <TextInput
          placeholder="Usuario"
          placeholderTextColor="#aaa"
          style={styles.input}
          value={usuario}
          onChangeText={setUsuario}
          autoCapitalize="none"
        />

        <View style={styles.passwordRow}>
          <TextInput
            placeholder={t('login.password')}
            placeholderTextColor="#aaa"
            secureTextEntry={!visible}
            style={styles.inputPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setVisible(!visible)}>
            <Text style={styles.eyeIcon}>
              {visible ? "👁" : "👁‍🗨"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.forgot}>{t('login.forgotPassword')}</Text>
        </TouchableOpacity>

        <View style={styles.checkboxRow}>
          <Checkbox 
            value={acepta} 
            onValueChange={setAcepta} 
            color={acepta ? colors.primary : undefined} 
          />
          <Text style={styles.checkboxText}>{t('login.acceptTerms')}</Text>
        </View>

        <CustomButton 
          title={loading ? t('common.loading') : t('login.loginButton')}
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
        />

        <Text style={styles.divider}>──────── o ────────</Text>

        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.register}>{t('login.noAccount')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.testBtn}
          onPress={() => navigation.navigate("TestRegistro")}
        >
          <Text style={styles.testBtnText}>🧪 Prueba de Registro</Text>
        </TouchableOpacity>

      </View>

      <StatusBar style="light" />
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
    width: 350,
    height: 150,
    marginBottom: 10,
    marginTop: 100,
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
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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