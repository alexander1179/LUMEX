import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AdminPatientRecordsScreen({ route }) {
  const user = route?.params?.user;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Historias clínicas</Text>
        <Text style={styles.subtitle}>{user ? `Paciente: ${user.nombre || user.usuario}` : 'Seleccione un paciente desde el panel.'}</Text>

        <View style={styles.infoCard}>
          <Ionicons name="folder-open-outline" size={24} color="#2f7a96" />
          <Text style={styles.infoTitle}>Expediente clínico</Text>
          <Text style={styles.infoBody}>En este módulo se visualizarán antecedentes, diagnósticos, evoluciones y documentos médicos.</Text>
        </View>

        <View style={styles.emptyCard}>
          <Ionicons name="document-text-outline" size={30} color="#7fa6b7" />
          <Text style={styles.emptyTitle}>Sin registros clínicos</Text>
          <Text style={styles.emptyBody}>Aún no hay información cargada para este paciente.</Text>

          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Agregar primer registro</Text>
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
  infoCard: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#d4e7ee', padding: 14, gap: 8,
  },
  infoTitle: { color: '#214b5d', fontSize: 15, fontWeight: '700' },
  infoBody: { color: '#5b7c8b', fontSize: 13, lineHeight: 19 },
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
