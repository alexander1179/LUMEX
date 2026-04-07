import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { resetPassword } from '../services/supabase/authService';
import { colors } from '../styles/colors';
import { validators } from '../utils/validators';
import { CustomButton } from '../components/common/CustomButton';
import { PasswordRequirements } from '../components/auth/PasswordRequirements';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { AccessQuickNav } from '../components/common/AccessQuickNav';

export default function ResetPasswordScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { metodo = 'email' } = route.params || {};
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordReqs, setPasswordReqs] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
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

  const handleResetPassword = async () => {
    if (loading) return;

    const passwordValidation = validators.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      Alert.alert("Error", "La contraseña no cumple los requisitos");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(newPassword);

      if (result.success) {
        Alert.alert(
          "✅ Contraseña actualizada",
          "Tu contraseña ha sido cambiada exitosamente",
          [{ text: "OK", onPress: () => navigation.replace("Login") }]
        );
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar con el servidor");
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
        >
          <Ionicons name="chevron-back-outline" size={22} color="#0f6d78" />
        </TouchableOpacity>
        <LanguageSelector />
      </View>

      <Text style={styles.title}>
        Nueva Contraseña
      </Text>

      <View style={styles.card}>
        <TextInput
          placeholder="Nueva contraseña"
          placeholderTextColor="#6b848b"
          secureTextEntry
          style={styles.input}
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text);
            validatePassword(text);
          }}
        />

        <PasswordRequirements requirements={passwordReqs} />

        <TextInput
          placeholder="Confirmar contraseña"
          placeholderTextColor="#6b848b"
          secureTextEntry
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <CustomButton
          title={loading ? "Actualizando..." : "Cambiar contraseña"}
          onPress={handleResetPassword}
          loading={loading}
          disabled={loading}
          backgroundColor="#0f6d78"
          backgroundColorPressed="#074f57"
        />
      </View>

      <AccessQuickNav navigation={navigation} current="usuario" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef6f8',
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 100,
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
    backgroundColor: 'rgba(15, 109, 120, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#0f6d78',
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#173746",
    marginTop: 100,
    marginBottom: 30,
  },
  card: {
    width: "90%",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#deedf3',
    padding: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: '#c6dfea',
    padding: 15,
    borderRadius: 14,
    marginBottom: 16,
    color: "#173746",
    fontSize: 15,
  },
});