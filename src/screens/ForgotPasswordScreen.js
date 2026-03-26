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
import { forgotPassword } from '../services/supabase/authService';
import { colors } from '../styles/colors';
import { CustomButton } from '../components/common/CustomButton';
import { LanguageSelector } from '../components/common/LanguageSelector';

export default function ForgotPasswordScreen({ navigation }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const solicitarRecuperacion = async () => {
    if (loading) return;

    if (!email.trim()) {
      Alert.alert("Error", "Ingresa tu correo electrónico");
      return;
    }

    setLoading(true);

    try {
      const result = await forgotPassword(email);

      if (result.success) {
        Alert.alert(
          "✅ Código enviado", 
          `Se ha enviado un código a tu correo`,
          [
            { 
              text: "OK", 
              onPress: () => navigation.navigate("VerifyToken", {
                userId: result.userId,
                metodo: 'email'
              })
            }
          ]
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
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <LanguageSelector />
      </View>

      <Text style={styles.title}>
        Recuperar Contraseña
      </Text>

      <View style={styles.card}>
        <Text style={styles.description}>
          Ingresa tu correo electrónico para recibir un código de recuperación
        </Text>

        <TextInput
          placeholder="Correo electrónico"
          placeholderTextColor="#aaa"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <CustomButton
          title={loading ? "Enviando..." : "Enviar código"}
          onPress={solicitarRecuperacion}
          loading={loading}
          disabled={loading}
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
  input: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
    color: "white",
    fontSize: 16,
  },
  backToLogin: {
    marginTop: 15,
  },
  backToLoginText: {
    color: colors.primary,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold"
  },
});