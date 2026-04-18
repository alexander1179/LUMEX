import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { testConnection, registerUser, loginUser } from '../services/lumex';
import { colors } from '../styles/colors';

export default function SimpleTestScreen({ navigation }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [{ text: `${timestamp} - ${message}`, isError }, ...prev]);
  };

  const handleTestConnection = async () => {
    setLoading(true);
    addLog('🔍 Probando conexión...');
    const result = await testConnection();
    if (result.success) {
      addLog('✅ Conexión exitosa a Supabase');
    } else {
      addLog(`❌ Error: ${result.error}`);
    }
    setLoading(false);
  };

  const handleTestRegister = async () => {
    setLoading(true);
    const testEmail = `test_${Date.now()}@test.com`;
    addLog(`📝 Registrando: ${testEmail}`);
    
    const result = await registerUser({
      nombre: 'Usuario Test',
      email: testEmail,
      usuario: `test_${Date.now()}`,
      password: '123456',
      telefono: '3001234567'
    });
    
    if (result.success) {
      addLog(`✅ Registro exitoso! ID: ${result.user.id_usuario}`);
      Alert.alert('Éxito', 'Usuario registrado correctamente');
    } else {
      addLog(`❌ Error: ${result.message}`);
      Alert.alert('Error', result.message);
    }
    setLoading(false);
  };

  const handleTestLogin = async () => {
    setLoading(true);
    addLog('🔐 Probando login con test@test.com');
    
    const result = await loginUser('test@test.com', '123456');
    
    if (result.success) {
      addLog(`✅ Login exitoso! Bienvenido ${result.user.nombre}`);
      Alert.alert('Éxito', `Bienvenido ${result.user.nombre}`);
    } else {
      addLog(`❌ Error: ${result.message}`);
      Alert.alert('Error', result.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔌 Test Supabase</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={handleTestConnection}
          disabled={loading}
        >
          <Text style={styles.buttonText}>1. Probar Conexión</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.successButton]}
          onPress={handleTestRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>2. Probar Registro</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.infoButton]}
          onPress={handleTestLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>3. Probar Login</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logsContainer}>
        <Text style={styles.logsTitle}>📋 Registro de actividades:</Text>
        <ScrollView style={styles.logsScroll}>
          {logs.map((log, index) => (
            <Text key={index} style={[styles.logText, log.isError && styles.errorText]}>
              {log.text}
            </Text>
          ))}
          {logs.length === 0 && (
            <Text style={styles.noLogs}>Presiona un botón para probar</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: colors.primary,
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
  },
  buttonContainer: {
    padding: 20,
    gap: 12,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  successButton: {
    backgroundColor: '#4caf50',
  },
  infoButton: {
    backgroundColor: '#2196f3',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logsContainer: {
    flex: 1,
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  logsScroll: {
    flex: 1,
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginVertical: 2,
    color: '#333',
  },
  errorText: {
    color: '#f44336',
  },
  noLogs: {
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});