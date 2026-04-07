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
import { forgotPassword, verifyToken } from '../services/supabase/authService';
import { colors } from '../styles/colors';
import { useCountdown } from '../hooks/useCountdown';
import { CustomButton } from '../components/common/CustomButton';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { AccessQuickNav } from '../components/common/AccessQuickNav';
import { AUTH_CONFIG } from '../config/authConfig';

const MAX_ATTEMPTS = 5;
const OTP_MIN_LENGTH = AUTH_CONFIG.OTP_MIN_LENGTH;
const OTP_MAX_LENGTH = AUTH_CONFIG.OTP_MAX_LENGTH;

export default function VerifyTokenScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { email, metodo } = route.params;
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { formatTime, timeLeft, reset } = useCountdown(900);

  const verificarToken = async () => {
    if (loading || resendLoading) return;

    if (attempts >= MAX_ATTEMPTS) {
      Alert.alert("Bloqueado", "Demasiados intentos. Solicita un nuevo código.");
      return;
    }

    const normalizedToken = token.trim();

    const otpRegex = new RegExp(`^\\d{${OTP_MIN_LENGTH},${OTP_MAX_LENGTH}}$`);

    if (!otpRegex.test(normalizedToken)) {
      Alert.alert("Error", `Ingresa un código válido de ${OTP_MIN_LENGTH} a ${OTP_MAX_LENGTH} dígitos`);
      return;
    }

    setLoading(true);

    try {
      const result = await verifyToken(email, normalizedToken);

      if (result.success) {
        navigation.replace("ResetPassword", { email, metodo });
      } else {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);

        if (nextAttempts >= MAX_ATTEMPTS) {
          Alert.alert(
            "Intentos agotados",
            "Alcanzaste el máximo de intentos. Solicita un nuevo código para continuar."
          );
          return;
        }

        Alert.alert("Error", result.message || "Código inválido");
      }
    } catch (error) {
      Alert.alert("Error", "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const reenviarCodigo = async () => {
    if (resendLoading) return;

    setResendLoading(true);
    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setAttempts(0);
        setToken('');
        reset(900);
        Alert.alert("✅ Código reenviado", "Revisa tu correo e ingresa el nuevo código.");
      } else {
        Alert.alert("Error", result.message || "No se pudo reenviar el código");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo reenviar el código");
    } finally {
      setResendLoading(false);
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
        Verificar Código
      </Text>

      <View style={styles.card}>
        <Text style={styles.description}>
          Ingresa el código enviado a {email} ({OTP_MIN_LENGTH} a {OTP_MAX_LENGTH} dígitos). Si abriste el enlace del correo, ignóralo y usa solo el código.
        </Text>

        <TextInput
          placeholder={OTP_MAX_LENGTH === 8 ? "00000000" : "000000"}
          placeholderTextColor="#aaa"
          style={styles.codeInput}
          value={token}
          onChangeText={(value) => setToken(value.replace(/\D/g, ''))}
          maxLength={OTP_MAX_LENGTH}
          keyboardType="number-pad"
        />

        <Text style={styles.timerText}>
          ⏰ Tiempo restante: {formatTime}
        </Text>

        <Text style={styles.attemptsText}>
          Intentos restantes: {Math.max(MAX_ATTEMPTS - attempts, 0)}
        </Text>

        {(timeLeft === 0 || attempts >= MAX_ATTEMPTS) && (
          <TouchableOpacity 
            style={styles.resendButton}
            onPress={reenviarCodigo}
            disabled={resendLoading}
          >
            <Text style={styles.resendText}>
              {resendLoading ? 'Reenviando...' : 'Solicitar nuevo código'}
            </Text>
          </TouchableOpacity>
        )}

        <CustomButton
          title={loading ? "Verificando..." : "Verificar código"}
          onPress={verificarToken}
          loading={loading}
          disabled={loading || resendLoading || timeLeft === 0 || attempts >= MAX_ATTEMPTS}
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
  description: {
    color: '#5f7f8d',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  codeInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: '#c6dfea',
    padding: 15,
    borderRadius: 14,
    marginBottom: 16,
    color: "#173746",
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
  },
  timerText: {
    color: '#20495a',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 10,
    fontWeight: '600',
  },
  attemptsText: {
    color: '#6b848b',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  resendButton: {
    marginTop: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  resendText: {
    color: '#0f6d78',
    fontSize: 15,
    fontWeight: '700',
  },
});