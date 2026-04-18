import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  Animated
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { forgotPassword, verifyToken } from '../services/lumex';
import { colors } from '../styles/colors';
import { useCountdown } from '../hooks/useCountdown';
import { CustomButton } from '../components/common/CustomButton';
import { AccessQuickNav } from '../components/common/AccessQuickNav';
import { AUTH_CONFIG } from '../config/authConfig';

const { width } = Dimensions.get('window');
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
        Alert.alert("✅ Código reenviado", "Busca el nuevo código en la consola del servidor.");
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
          Verificar Código
        </Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.description, { color: theme.mutedText }]}>
            Ingresa el código enviado a {email}. El código aparecerá en la terminal donde se ejecuta el servidor.
          </Text>

          <TextInput
            placeholder="000000"
            placeholderTextColor="#aaa"
            style={[styles.codeInput, { backgroundColor: theme.input, color: theme.inputText, borderColor: 'rgba(15,109,120,0.1)' }]}
            value={token}
            onChangeText={(value) => setToken(value.replace(/\D/g, ''))}
            maxLength={OTP_MAX_LENGTH}
            keyboardType="number-pad"
          />

          <Text style={[styles.timerText, { color: theme.accent }]}>
             Tiempo restante: {formatTime}
          </Text>

          <Text style={[styles.attemptsText, { color: theme.mutedText }]}>
            Intentos restantes: {Math.max(MAX_ATTEMPTS - attempts, 0)}
          </Text>

          {(timeLeft === 0 || attempts >= MAX_ATTEMPTS) && (
            <TouchableOpacity 
              style={styles.resendButton}
              onPress={reenviarCodigo}
              disabled={resendLoading}
            >
              <Text style={[styles.resendText, { color: theme.accent }]}>
                {resendLoading ? 'Reenviando...' : 'Solicitar nuevo código'}
              </Text>
            </TouchableOpacity>
          )}

          <CustomButton
            title={loading ? "Verificando..." : "Verificar código"}
            onPress={verificarToken}
            loading={loading}
            disabled={loading || resendLoading || timeLeft === 0 || attempts >= MAX_ATTEMPTS}
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
    marginBottom: 30,
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
  description: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  codeInput: {
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    fontSize: 28,
    textAlign: 'center',
    letterSpacing: 10,
    fontWeight: 'bold',
    borderWidth: 1,
  },
  timerText: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 10,
    fontWeight: '600',
  },
  attemptsText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 15,
  },
  resendButton: {
    marginBottom: 20,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});