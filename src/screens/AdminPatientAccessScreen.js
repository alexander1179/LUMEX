import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AdminPatientAccessScreen({ route }) {
  const user = route?.params?.user;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Control de acceso</Text>
        <Text style={styles.subtitle}>{user ? `Paciente: ${user.nombre || user.usuario}` : 'Seleccione un paciente desde el panel.'}</Text>

        <View style={styles.policyCard}>
          <Text style={styles.policyTitle}>Política de seguridad</Text>
          <Text style={styles.policyBody}>Define qué perfiles pueden consultar, editar o exportar la información médica del paciente.</Text>
        </View>

        <View style={styles.emptyCard}>
          <Ionicons name="shield-checkmark-outline" size={30} color="#7fa6b7" />
          <Text style={styles.emptyTitle}>Sin reglas configuradas</Text>
          <Text style={styles.emptyBody}>No hay permisos personalizados para este paciente.</Text>

          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Configurar permisos</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eef6f8' },
  content: { padding: 18, gap: 14 },
  title: { color: '#173746', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#5e7d8c', fontSize: 13 },
  policyCard: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#d4e7ee', padding: 14, gap: 7,
  },
  policyTitle: { color: '#214b5d', fontSize: 15, fontWeight: '700' },
  policyBody: { color: '#5b7c8b', fontSize: 13, lineHeight: 19 },
  emptyCard: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#d4e7ee',
    paddingVertical: 30, paddingHorizontal: 14, alignItems: 'center',
  },
  emptyTitle: { color: '#214b5d', fontSize: 16, fontWeight: '700', marginTop: 8 },
  emptyBody: { color: '#6a8b98', fontSize: 13, marginTop: 4, marginBottom: 14 },
  primaryButton: {
    backgroundColor: '#2f7a96', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
