// src/screens/RegisterScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Checkbox from "expo-checkbox";
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { validators } from '../utils/validators';
import { CustomButton } from '../components/common/CustomButton';
import { PasswordRequirements } from '../components/auth/PasswordRequirements';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { AccessQuickNav } from '../components/common/AccessQuickNav';
import { registerUser } from '../services/api/authService';


const { width, height } = Dimensions.get('window');
const icon = require('../../assets/lumex.jpeg');

export default function RegisterScreen({ navigation, route }) {
  const { t } = useTranslation();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acepta, setAcepta] = useState(false);
  const [passwordReqs, setPasswordReqs] = useState({
    length: false, uppercase: false, lowercase: false, number: false
  });

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.94)).current;
  const cardSlideAnim = useRef(new Animated.Value(22)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.timing(cardSlideAnim, {
        toValue: 0,
        duration: 440,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, logoScaleAnim, cardSlideAnim]);

  // Restaurar estado si viene de la pantalla de Privacidad
  useEffect(() => {
    if (route.params?.formData) {
      const { name, email: savedEmail, phone, username, password: savedPassword } = route.params.formData;
      if (name) setNombre(name);
      if (savedEmail) setEmail(savedEmail);
      if (phone) setTelefono(phone);
      if (username) setUsuario(username);
      if (savedPassword) {
        setPassword(savedPassword);
        validatePassword(savedPassword);
      }
    }
    if (route.params?.accepted) {
      setAcepta(true);
    }
  }, [route.params]);

  const theme = {
    background: '#eaf6f5',
    card: 'rgba(255,255,255,0.86)',
    cardBorder: 'rgba(15,109,120,0.22)',
    input: '#f4fbfb',
    inputText: '#15333d',
    mutedText: '#4f666c',
    title: '#15333d',
    accent: '#0f6d78',
  };

  const validatePassword = (pass) => {
    const validation = validators.validatePassword(pass);
    setPasswordReqs({
      length: validation.length,
      uppercase: validation.uppercase,
      lowercase: validation.lowercase,
      number: validation.number
    });
  };

  const handleRegister = async () => {
    if (loading) return;
    
    if (!nombre || !email || !usuario || !password) {
      Alert.alert(t('common.error'), t('errors.requiredFields'));
      return;
    }

    if (!acepta) {
      Alert.alert('Atención', 'Debes aceptar las políticas de seguridad para registrarte.');
      return;
    }
    
    if (!validators.validateEmail(email)) {
      Alert.alert(t('common.error'), t('errors.invalidEmail'));
      return;
    }
    
    if (telefono && telefono.trim() !== '') {
      if (!validators.validatePhone(telefono)) {
        Alert.alert(t('common.error'), t('errors.invalidPhone'));
        return;
      }
    }
    
    const passwordValidation = validators.validatePassword(password);
    if (!passwordValidation.isValid) {
      Alert.alert(t('common.error'), t('errors.passwordRequirements'));
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('errors.passwordMismatch'));
      return;
    }

    setLoading(true);

    try {
      const userData = {
        name: nombre.trim(),
        email: email.trim().toLowerCase(),
        username: usuario.trim().toLowerCase(),
        password: password,
        phone: telefono?.trim() || null,
      };

      const result = await registerUser(userData);

      if (result.success) {
        Alert.alert(
          "✅ Registro exitoso",
          result.message || "Usuario registrado correctamente. Ahora puedes iniciar sesión.",
          [{ text: "OK", onPress: () => navigation.replace("Login", { role: 'usuario' }) }]
        );
      } else {
        Alert.alert('Error', result.message);
      }

    } catch (error) {
      console.log('❌ Error en registro:', error);
      Alert.alert('Error', 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.bgBlobTop} />
      <View style={styles.bgBlobMid} />
      <View style={styles.bgBlobBottom} />

      <View style={styles.header} pointerEvents="box-none">
        <TouchableOpacity 
          style={[styles.backButton, styles.backButtonTop, { backgroundColor: 'rgba(255, 255, 255, 0.8)' }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back-outline" size={22} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.scrollContent}>
        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: fadeAnim,
              transform: [{ scale: logoScaleAnim }],
            },
          ]}
        >
          <View style={styles.logoGlowLarge} />
          <View style={styles.logoGlowSmall} />
          <View style={styles.logoFrame}>
            <Image source={icon} style={styles.logoImage} />
          </View>
        </Animated.View>

        <Animated.Text
          style={[
            styles.title,
            { color: theme.title, opacity: fadeAnim },
          ]}
        >
          {t('register.title')}
        </Animated.Text>

        <Animated.Text
          style={[
            styles.subtitle,
            { color: theme.mutedText, opacity: fadeAnim },
          ]}
        >
          Crea tu cuenta de usuario para acceder a tu salud
        </Animated.Text>

        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
              opacity: fadeAnim,
              transform: [{ translateY: cardSlideAnim }],
            },
          ]}
        >
          <TextInput 
            placeholder={t('register.fullName')} 
            placeholderTextColor="#6b848b" 
            style={[styles.input, { backgroundColor: theme.input, color: theme.inputText }]}
            value={nombre} 
            onChangeText={setNombre}
          />
          
          <TextInput 
            placeholder={t('register.email')} 
            placeholderTextColor="#6b848b" 
            style={[styles.input, { backgroundColor: theme.input, color: theme.inputText }]}
            value={email} 
            onChangeText={setEmail} 
            keyboardType="email-address" 
            autoCapitalize="none"
          />
          
          <TextInput 
            placeholder={t('register.phone')} 
            placeholderTextColor="#6b848b" 
            style={[styles.input, { backgroundColor: theme.input, color: theme.inputText }]}
            value={telefono} 
            onChangeText={setTelefono} 
            keyboardType="phone-pad"
          />

          <TextInput 
            placeholder={t('register.username')} 
            placeholderTextColor="#6b848b" 
            style={[styles.input, { backgroundColor: theme.input, color: theme.inputText }]}
            value={usuario} 
            onChangeText={setUsuario} 
            autoCapitalize="none"
          />
          
          <View style={[styles.passwordRow, { backgroundColor: theme.input }]}>
            <TextInput
              placeholder={t('register.password')}
              placeholderTextColor="#6b848b"
              secureTextEntry={!showPassword}
              style={[styles.inputPassword, { color: theme.inputText }]}
              value={password}
              onChangeText={(text) => { 
                setPassword(text); 
                validatePassword(text); 
              }}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={[styles.eyeButton, { backgroundColor: 'rgba(15,109,120,0.08)' }]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={theme.accent}
              />
            </TouchableOpacity>
          </View>

          <PasswordRequirements requirements={passwordReqs} />

          <View style={[styles.passwordRow, { backgroundColor: theme.input }]}>
            <TextInput
              placeholder={t('register.confirmPassword')}
              placeholderTextColor="#6b848b"
              secureTextEntry={!showConfirmPassword}
              style={[styles.inputPassword, { color: theme.inputText }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={[styles.eyeButton, { backgroundColor: 'rgba(15,109,120,0.08)' }]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={theme.accent}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.checkboxRow}>
            <Checkbox
              value={acepta}
              onValueChange={setAcepta}
              color={acepta ? theme.accent : undefined}
              disabled={true} // Obligatorio visitar las políticas para que se marque
            />
            <View style={styles.termsTextWrap}>
              <Text style={[styles.checkboxText, { color: theme.mutedText }]}>Acepto las </Text>
              <TouchableOpacity onPress={() => {
                const formData = {
                  name: nombre,
                  email: email,
                  phone: telefono,
                  username: usuario,
                  password: password
                };
                navigation.navigate('Privacy', { formData, returnTo: 'Register' });
              }}>
                <Text style={{
                  color: acepta ? '#2e7d32' : theme.accent, 
                  fontSize: 13, 
                  fontWeight: '800',
                  textDecorationLine: 'underline'
                }}>
                  {acepta ? 'Politicas Aceptadas ✓' : 'Politicas de Seguridad'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <CustomButton 
            title={loading ? t('common.loading') : t('register.registerButton')}
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            backgroundColor={theme.accent}
            backgroundColorPressed="#074f57"
          />

          <TouchableOpacity 
            style={styles.loginLink} 
            onPress={() => navigation.replace("Login", { role: 'usuario' })}
          >
            <Text style={[styles.loginText, { color: theme.accent }]}>
              {t('register.haveAccount')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingTop: 82,
    paddingBottom: 142,
    alignItems: 'center',
    justifyContent: 'center',
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
    top: height * 0.25,
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
    top: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    zIndex: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonTop: {
    marginTop: 34,
  },
  backButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  languageWrapTop: {
    marginTop: 34,
    minHeight: 40,
    justifyContent: 'center',
  },
  languageSelectorButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 0,
    backgroundColor: 'rgba(15,109,120,0.12)',
  },
  logoWrap: {
    width: 136,
    height: 136,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  logoGlowLarge: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(15, 109, 120, 0.08)',
  },
  logoGlowSmall: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(15, 109, 120, 0.14)',
  },
  logoFrame: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 2,
    shadowColor: '#0f6d78',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 5,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  card: {
    width: "90%",
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
    elevation: 5,
    shadowColor: "#0f6d78",
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    shadowOpacity: 0.14,
  },
  input: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    fontSize: 14,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    marginBottom: 7,
  },
  inputPassword: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },
  eyeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginLink: {
    marginVertical: 9,
  },
  loginText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  termsTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  checkboxText: {
    fontSize: 13,
  },
});