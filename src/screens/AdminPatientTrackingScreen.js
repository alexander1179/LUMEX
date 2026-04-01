import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AdminPatientTrackingScreen({ route }) {
  const user = route?.params?.user;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Seguimiento médico</Text>
        <Text style={styles.subtitle}>{user ? `Paciente: ${user.nombre || user.usuario}` : 'Seleccione un paciente desde el panel.'}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Alertas activas</Text>
            <Text style={styles.statValue}>Sin datos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Controles pendientes</Text>
            <Text style={styles.statValue}>Sin datos</Text>
          </View>
        </View>

        <View style={styles.emptyCard}>
          <Ionicons name="pulse-outline" size={30} color="#7fa6b7" />
          <Text style={styles.emptyTitle}>Sin métricas registradas</Text>
          <Text style={styles.emptyBody}>Cuando se carguen signos o evaluaciones, aparecerán aquí en tiempo real.</Text>

          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Registrar seguimiento</Text>
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
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#d4e7ee', padding: 14,
  },
  statLabel: { color: '#5e7f8e', fontSize: 12, marginBottom: 7 },
  statValue: { color: '#214b5d', fontSize: 16, fontWeight: '700' },
  emptyCard: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#d4e7ee',
    paddingVertical: 30, paddingHorizontal: 14, alignItems: 'center',
  },
  emptyTitle: { color: '#214b5d', fontSize: 16, fontWeight: '700', marginTop: 8 },
  emptyBody: { color: '#6a8b98', fontSize: 13, marginTop: 4, marginBottom: 14, textAlign: 'center' },
  primaryButton: {
    backgroundColor: '#2f7a96', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
