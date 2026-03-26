// src/screens/RegisterScreen.js
import React, { useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  View,
  StyleSheet
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase/supabaseClient';
import { colors } from '../styles/colors';
import { validators } from '../utils/validators';
import { CustomButton } from '../components/common/CustomButton';
import { PasswordRequirements } from '../components/auth/PasswordRequirements';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { registerUser } from '../services/supabase/authService';

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordReqs, setPasswordReqs] = useState({
    length: false, uppercase: false, lowercase: false, number: false
  });

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
    
    // Validaciones
    if (!nombre || !email || !usuario || !password) {
      Alert.alert(t('common.error'), t('errors.requiredFields'));
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

    // Los términos se aceptarán en el login si no se aceptan aquí
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
          [{ text: "OK", onPress: () => navigation.replace("Login") }]
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
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header con botón de volver y selector de idioma */}
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
      
      <Text style={styles.title}>
        {t('register.title')}
      </Text>

      <View style={styles.card}>
        <TextInput 
          placeholder={t('register.fullName')} 
          placeholderTextColor="#aaa" 
          style={styles.input} 
          value={nombre} 
          onChangeText={setNombre} 
        />
        
        <TextInput 
          placeholder={t('register.email')} 
          placeholderTextColor="#aaa" 
          style={styles.input} 
          value={email} 
          onChangeText={setEmail} 
          keyboardType="email-address" 
          autoCapitalize="none" 
        />
        
        <TextInput 
          placeholder={t('register.phone')} 
          placeholderTextColor="#aaa" 
          style={styles.input} 
          value={telefono} 
          onChangeText={setTelefono} 
          keyboardType="phone-pad"
        />

        <TextInput 
          placeholder={t('register.username')} 
          placeholderTextColor="#aaa" 
          style={styles.input} 
          value={usuario} 
          onChangeText={setUsuario} 
          autoCapitalize="none" 
        />
        
        <TextInput
          placeholder={t('register.password')}
          placeholderTextColor="#aaa"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={(text) => { 
            setPassword(text); 
            validatePassword(text); 
          }}
        />

        <PasswordRequirements requirements={passwordReqs} />

        <TextInput
          placeholder={t('register.confirmPassword')}
          placeholderTextColor="#aaa"
          secureTextEntry
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <CustomButton 
          title={loading ? t('common.loading') : t('register.registerButton')}
          onPress={handleRegister}
          loading={loading}
          disabled={loading}
        />

        <TouchableOpacity 
          style={styles.loginLink} 
          onPress={() => navigation.replace("Login")}
        >
          <Text style={styles.loginText}>{t('register.haveAccount')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  contentContainer: {
    alignItems: "center",
    paddingBottom: 30,
    width: "100%",
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 50,
    marginBottom: 10,
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
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    color: "white",
    marginVertical: 20,
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
  phoneHint: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 5,
    marginLeft: 5,
  },
  loginLink: {
    marginVertical: 15,
  },
  loginText: {
    color: colors.primary,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold"
  },
});