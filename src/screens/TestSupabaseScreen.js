import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput
} from 'react-native';
import { testConnection } from '../services/supabase/supabaseClient';
import { registerUser, loginUser } from '../services/supabase/authService';
import { colors } from '../styles/colors';

export default function TestSupabaseScreen({ navigation }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Datos de prueba
  const [testEmail, setTestEmail] = useState(`test_${Date.now()}@test.com`);
  const [testPassword, setTestPassword] = useState('123456');
  const [testNombre, setTestNombre] = useState('Usuario Test');
  const [testUsuario, setTestUsuario] = useState(`test_${Date.now()}`);

  const addResult = (message, isSuccess = true) => {
    setResults(prev => [...prev, { message, isSuccess, time: new Date().toLocaleTimeString() }]);
  };

  const handleTestConnection = async () => {
    setLoading(true);
    addResult('🔍 Probando conexión a Supabase...');
    const result = await testConnection();
    if (result.success) {
      addResult('✅ Conexión exitosa a Supabase');
    } else {
      addResult(`❌ Error: ${result.error}`);
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true);
    addResult(`📝 Registrando usuario: ${testEmail}`);
    
    const result = await registerUser({
      nombre: testNombre,
      email: testEmail,
      usuario: testUsuario,
      password: testPassword,
      telefono: '3001234567'
    });
    
    if (result.success) {
      addResult(`✅ Usuario registrado: ${result.user.usuario}`);
      Alert.alert('Éxito', 'Usuario registrado correctamente');
    } else {
      addResult(`❌ Error: ${result.message}`);
      Alert.alert('Error', result.message);
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    addResult(`🔐 Intentando login: ${testEmail}`);
    
    const result = await loginUser(testEmail, testPassword);
    
    if (result.success) {
      addResult(`✅ Login exitoso: ${result.user.nombre}`);
      Alert.alert('Éxito', `Bienvenido ${result.user.nombre}`);
    } else {
      addResult(`❌ Error: ${result.message}`);
      Alert.alert('Error', result.message);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔌 Prueba Supabase</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Email de prueba:</Text>
        <TextInput
          style={styles.input}
          value={testEmail}
          onChangeText={setTestEmail}
          placeholder="Email"
          autoCapitalize="none"
        />
        
        <Text style={styles.label}>Contraseña:</Text>
        <TextInput
          style={styles.input}
          value={testPassword}
          onChangeText={setTestPassword}
          placeholder="Contraseña"
          secureTextEntry
        />
        
        <Text style={styles.label}>Nombre:</Text>
        <TextInput
          style={styles.input}
          value={testNombre}
          onChangeText={setTestNombre}
          placeholder="Nombre"
        />
        
        <Text style={styles.label}>Usuario:</Text>
        <TextInput
          style={styles.input}
          value={testUsuario}
          onChangeText={setTestUsuario}
          placeholder="Usuario"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={handleTestConnection}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🔍 Probar Conexión</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.successButton]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>📝 Probar Registro</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.infoButton]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🔐 Probar Login</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>📋 Resultados:</Text>
        {results.map((result, index) => (
          <Text key={index} style={[
            styles.resultText,
            result.isSuccess ? styles.successText : styles.errorText
          ]}>
            {result.time} - {result.message}
          </Text>
        ))}
        {results.length === 0 && (
          <Text style={styles.noResults}>Presiona un botón para probar</Text>
        )}
      </View>
    </ScrollView>
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
  formContainer: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonContainer: {
    marginHorizontal: 15,
    gap: 10,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
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
  resultsContainer: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    maxHeight: 300,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultText: {
    fontSize: 12,
    marginVertical: 2,
    fontFamily: 'monospace',
  },
  successText: {
    color: '#4caf50',
  },
  errorText: {
    color: '#f44336',
  },
  noResults: {
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
});