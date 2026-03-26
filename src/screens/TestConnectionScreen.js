// src/screens/TestConnectionScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { supabase, testSupabaseConnection } from '../services/supabase/supabaseClient';
import { colors } from '../styles/colors';

export default function TestConnectionScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const addResult = (message, isSuccess = true) => {
    setResults(prev => [...prev, { message, isSuccess, timestamp: new Date() }]);
  };

  const testConnection = async () => {
    setLoading(true);
    setResults([]);
    
    addResult('🔍 Iniciando pruebas de conexión a Supabase...', true);
    
    // Prueba 1: Verificar configuración
    addResult('📋 Prueba 1: Verificando configuración...', true);
    const supabaseUrl = supabase.supabaseUrl;
    if (supabaseUrl && supabaseUrl === 'https://zytpyartebkrhojzyije.supabase.co') {
      addResult(`✅ URL configurada correctamente: ${supabaseUrl}`, true);
    } else {
      addResult(`❌ URL no configurada: ${supabaseUrl}`, false);
    }

    // Prueba 2: Probar conexión básica
    addResult('🌐 Prueba 2: Probando conexión a Supabase...', true);
    try {
      const { data, error } = await supabase.from('usuarios').select('count', { count: 'exact', head: true });
      if (error) throw error;
      addResult('✅ Conexión exitosa a Supabase', true);
      addResult(`📊 Tabla "usuarios" accesible`, true);
    } catch (error) {
      addResult(`❌ Error de conexión: ${error.message}`, false);
    }

    // Prueba 3: Verificar autenticación
    addResult('🔐 Prueba 3: Verificando autenticación...', true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (session) {
        addResult(`✅ Sesión activa: ${session.user.email}`, true);
      } else {
        addResult('ℹ️ No hay sesión activa (es normal si no has iniciado sesión)', true);
      }
    } catch (error) {
      addResult(`❌ Error en autenticación: ${error.message}`, false);
    }

    setLoading(false);
  };

  const testRegister = async () => {
    setLoading(true);
    addResult('📝 Probando registro de usuario de prueba...', true);
    
    const testEmail = `test_${Date.now()}@test.com`;
    const testPassword = 'Test123456';
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            nombre: 'Usuario Test',
            usuario: 'testuser',
          }
        }
      });
      
      if (error) throw error;
      
      addResult(`✅ Registro exitoso con email: ${testEmail}`, true);
      addResult(`🆔 ID de usuario: ${data.user?.id}`, true);
      addResult(`🔑 Contraseña: ${testPassword} (guárdala para probar login)`, true);
      
      // Intentar insertar en tabla usuarios
      const { error: insertError } = await supabase
        .from('usuarios')
        .insert([
          {
            id: data.user.id,
            nombre: 'Usuario Test',
            email: testEmail,
            usuario: 'testuser',
          }
        ]);
      
      if (insertError) {
        addResult(`⚠️ No se pudo insertar en tabla usuarios: ${insertError.message}`, false);
      } else {
        addResult('✅ Usuario insertado en tabla usuarios', true);
      }
      
    } catch (error) {
      addResult(`❌ Error en registro: ${error.message}`, false);
    }
    
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔌 Prueba de Conexión Supabase</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={testConnection}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Probando...' : '🔍 Probar Conexión'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={testRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>📝 Probar Registro</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.backButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>← Volver</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>📋 Resultados:</Text>
        {results.map((result, index) => (
          <View key={index} style={styles.resultItem}>
            <Text style={[
              styles.resultText,
              result.isSuccess ? styles.successText : styles.errorText
            ]}>
              {result.message}
            </Text>
          </View>
        ))}
        {results.length === 0 && (
          <Text style={styles.noResults}>
            Presiona "Probar Conexión" para verificar la conexión a Supabase
          </Text>
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
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  buttonContainer: {
    padding: 20,
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
  secondaryButton: {
    backgroundColor: '#4caf50',
  },
  backButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    padding: 20,
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
    elevation: 2,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultText: {
    fontSize: 13,
    lineHeight: 18,
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