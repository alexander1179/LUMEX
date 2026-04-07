import React, { useState, useEffect, useRef } from 'react';
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
import { forgotPassword } from '../services/supabase/authService';
import { colors } from '../styles/colors';
import { CustomButton } from '../components/common/CustomButton';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { AccessQuickNav } from '../components/common/AccessQuickNav';

export default function ForgotPasswordScreen({ navigation }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

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
        Recuperar Contraseña
      </Text>

      <View style={styles.card}>
        <Text style={styles.description}>
          Ingresa tu correo electrónico para recibir un código de recuperación. Luego regresa a la app para ingresarlo.
        </Text>

        <TextInput
          placeholder="Correo electrónico"
          placeholderTextColor="#6b848b"
          style={styles.input}
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
          backgroundColor="#0f6d78"
          backgroundColorPressed="#074f57"
        />

        <TouchableOpacity 
          style={styles.backToLogin}
          onPress={() => navigation.replace("Login")}
        >
          <Text style={styles.backToLoginText}>
            Volver al inicio de sesión
          </Text>
        </TouchableOpacity>
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
  backToLogin: {
    marginTop: 16,
  },
  backToLoginText: {
    color: '#0f6d78',
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700"
  },
});