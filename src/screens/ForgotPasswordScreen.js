import React, { useState, useEffect, useRef } from 'react';
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
import { forgotPassword } from '../services/api/authService';

import { colors } from '../styles/colors';
import { CustomButton } from '../components/common/CustomButton';

const { width } = Dimensions.get('window');

export default function ForgotPasswordScreen({ navigation }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

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

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const startCountdown = (seconds) => {
    setCountdown(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const solicitarRecuperacion = async () => {
    if (loading || countdown > 0) return;

    if (!email.trim()) {
      Alert.alert("Error", "Ingresa tu correo electrónico");
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await forgotPassword(normalizedEmail);

      if (result.success) {
        startCountdown(60);
        Alert.alert(
          "Código enviado",
          "Ingresa el código que recibiste en tu correo.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("VerifyToken", {
                email: normalizedEmail,
                metodo: 'email'
              })
            }
          ]
        );
      } else {
        if (result.rateLimited && result.waitSeconds) {
          startCountdown(result.waitSeconds);
          Alert.alert("Espera un momento", `Podrás solicitar otro código en ${result.waitSeconds} segundos.`);
          return;
        }
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

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={[styles.title, { color: theme.title }]}>
          Recuperar Contraseña
        </Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.description, { color: theme.mutedText }]}>
            Ingresa tu correo electrónico para recibir un código de recuperación. Luego regresa a la app para ingresarlo.
          </Text>

          <TextInput
            placeholder="Correo electrónico"
            placeholderTextColor="#aaa"
            style={[styles.input, { backgroundColor: theme.input, color: theme.inputText }]}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <CustomButton
            title={loading ? "Enviando..." : countdown > 0 ? `Reenviar en ${countdown}s` : "Enviar código"}
            onPress={solicitarRecuperacion}
            loading={loading}
            disabled={loading || countdown > 0}
            backgroundColor={theme.accent}
          />

          <TouchableOpacity 
            style={styles.backToLogin}
            onPress={() => navigation.replace("Login")}
          >
            <Text style={[styles.backToLoginText, { color: theme.accent }]}>
              Volver al inicio de sesión
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'flex-start',
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
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 30,
    textAlign: 'center',
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
  input: {
    padding: 16,
    borderRadius: 15,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  backToLogin: {
    marginTop: 20,
  },
  backToLoginText: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700"
  },
});