import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { resetPassword } from '../services/lumex';
import { colors } from '../styles/colors';
import { validators } from '../utils/validators';
import { CustomButton } from '../components/common/CustomButton';
import { PasswordRequirements } from '../components/auth/PasswordRequirements';
import { AccessQuickNav } from '../components/common/AccessQuickNav';

const { width } = Dimensions.get('window');

export default function ResetPasswordScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { email, metodo = 'email' } = route.params || {};
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordReqs, setPasswordReqs] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  });

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

  const handleResetPassword = async () => {
    if (loading) return;

    if (!email) {
      Alert.alert("Error", "No se encontró el correo electrónico del usuario.");
      return;
    }

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
      const result = await resetPassword(email, newPassword);

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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: 'rgba(15,109,120,0.1)' }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.title }]}>
          Nueva Contraseña
        </Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.subtitle, { color: theme.mutedText }]}>
            Establece tu nueva clave de acceso para {email}
          </Text>

          <TextInput
            placeholder="Nueva contraseña"
            placeholderTextColor="#aaa"
            secureTextEntry
            style={[styles.input, { backgroundColor: theme.input, color: theme.inputText, borderColor: 'rgba(15,109,120,0.1)' }]}
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              validatePassword(text);
            }}
          />

          <PasswordRequirements requirements={passwordReqs} />

          <TextInput
            placeholder="Confirmar contraseña"
            placeholderTextColor="#aaa"
            secureTextEntry
            style={[styles.input, { backgroundColor: theme.input, color: theme.inputText, borderColor: 'rgba(15,109,120,0.1)' }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <CustomButton
            title={loading ? "Actualizando..." : "Cambiar contraseña"}
            onPress={handleResetPassword}
            loading={loading}
            disabled={loading}
            backgroundColor={theme.accent}
          />
        </View>
      </View>

      <AccessQuickNav navigation={navigation} current="usuario" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  header: {
    width: '100%',
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    zIndex: 10,
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  card: {
    width: "90%",
    borderRadius: 30,
    padding: 25,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  input: {
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
  },
});