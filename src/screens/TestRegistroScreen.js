// screens/TestRegistroScreen.js
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { pruebaRegistroRapida } from '../../prueba_registro';
import { colors } from '../styles/colors';

export default function TestRegistroScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState('');

  const ejecutarPrueba = async () => {
    setLoading(true);
    setResultado('⏳ Ejecutando prueba...\n\n');
    
    // Capturar console.log
    const originalLog = console.log;
    let output = '';
    
    console.log = (...args) => {
      output += args.join(' ') + '\n';
      setResultado(output);
      originalLog(...args);
    };

    try {
      await pruebaRegistroRapida();
    } catch (error) {
      output += `\n❌ ERROR: ${error.message}`;
      setResultado(output);
    } finally {
      console.log = originalLog;
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Prueba de Registro</Text>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.btn, { opacity: loading ? 0.5 : 1 }]}
        onPress={ejecutarPrueba}
        disabled={loading}
      >
        <Text style={styles.btnText}>
          {loading ? '⏳ Ejecutando...' : '▶️ Ejecutar Prueba'}
        </Text>
      </TouchableOpacity>

      <View style={styles.resultBox}>
        <Text style={styles.resultText}>{resultado || 'Los resultados aparecerán aquí...'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  backBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  backText: {
    color: 'white',
    fontWeight: '600',
  },
  btn: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  btnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultBox: {
    backgroundColor: '#1c1c1c',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#333',
  },
  resultText: {
    color: '#0f0',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  }
});
