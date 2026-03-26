import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { verifyToken } from '../services/supabase/authService';
import { colors } from '../styles/colors';
import { useCountdown } from '../hooks/useCountdown';
import { CustomButton } from '../components/common/CustomButton';
import { LanguageSelector } from '../components/common/LanguageSelector';

export default function VerifyTokenScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { userId, metodo } = route.params;
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const { formatTime, timeLeft } = useCountdown(900);

  const verificarToken = async () => {
    if (loading) return;

    if (!token.trim() || token.length !== 6) {
      Alert.alert("Error", "Ingresa el código de 6 dígitos");
      return;
    }

    setLoading(true);

    try {
      const result = await verifyToken(userId, token);

      if (result.success) {
        navigation.replace("ResetPassword", { userId, token, metodo });
      } else {
        Alert.alert("Error", result.message || "Código inválido");
      }
    } catch (error) {
      Alert.alert("Error", "Error de conexión");
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
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <LanguageSelector />
      </View>

      <Text style={styles.title}>
        Verificar Código
      </Text>

      <View style={styles.card}>
        <Text style={styles.description}>
          Ingresa el código enviado a tu correo
        </Text>

        <TextInput
          placeholder="000000"
          placeholderTextColor="#aaa"
          style={styles.codeInput}
          value={token}
          onChangeText={setToken}
          maxLength={6}
          keyboardType="number-pad"
        />

        <Text style={styles.timerText}>
          ⏰ Tiempo restante: {formatTime}
        </Text>

        {timeLeft === 0 && (
          <TouchableOpacity 
            style={styles.resendButton}
            onPress={() => {
              Alert.alert("Código expirado", "Por favor, solicita un nuevo código");
              navigation.goBack();
            }}
          >
            <Text style={styles.resendText}>Solicitar nuevo código</Text>
          </TouchableOpacity>
        )}

        <CustomButton
          title={loading ? "Verificando..." : "Verificar código"}
          onPress={verificarToken}
          loading={loading}
          disabled={loading || timeLeft === 0}
        />
      </View>
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
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    marginTop: 100,
    marginBottom: 30,
  },
  card: {
    width: "90%",
    backgroundColor: "#1c1c1c",
    borderRadius: 25,
    padding: 20,
    elevation: 5,
  },
  description: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  codeInput: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
    color: "white",
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
  },
  timerText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 10,
  },
  resendButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  resendText: {
    color: colors.primary,
    fontSize: 14,
  },
});