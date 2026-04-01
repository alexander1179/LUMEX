import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase/supabaseClient';
import { registerUser } from '../services/supabase/authService';

const TABS = [
  { key: 'inicio', label: 'Inicio', icon: 'home-outline' },
  { key: 'pacientes', label: 'Pacientes', icon: 'people-outline' },
  { key: 'citas', label: 'Citas', icon: 'calendar-outline' },
  { key: 'ajustes', label: 'Ajustes', icon: 'settings-outline' },
];

export default function AdminDashboardScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('inicio');
  const [usuariosRegistrados, setUsuariosRegistrados] = useState(0);
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [citasHoy, setCitasHoy] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUsuario, setNewUsuario] = useState('');
  const [newTelefono, setNewTelefono] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const resetCreateForm = () => {
    setNewNombre('');
    setNewEmail('');
    setNewUsuario('');
    setNewTelefono('');
    setNewPassword('');
  };

  const loadDashboardData = async () => {
    setLoadingUsuarios(true);
    try {
      const { data, error, count } = await supabase
        .from('usuarios')
        .select('id_usuario, nombre, usuario, email', { count: 'exact' })
        .order('id_usuario', { ascending: false });

      if (error) {
        console.log('Error cargando usuarios admin:', error.message);
        setUsuarios([]);
        setUsuariosRegistrados(0);
        return;
      }

      const list = Array.isArray(data) ? data : [];
      setUsuarios(list);
      setUsuariosRegistrados(typeof count === 'number' ? count : list.length);
      if (list.length > 0) {
        setSelectedUsuario((prev) => {
          if (!prev) return list[0];
          const stillExists = list.find((u) => u.id_usuario === prev.id_usuario);
          return stillExists || list[0];
        });
      } else {
        setSelectedUsuario(null);
      }

      try {
        const { count: citasCount, error: citasError } = await supabase
          .from('citas')
          .select('id', { count: 'exact', head: true });

        if (!citasError && typeof citasCount === 'number') {
          setCitasHoy(citasCount);
        } else {
          setCitasHoy(null);
        }
      } catch {
        setCitasHoy(null);
      }
    } finally {
      setLoadingUsuarios(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleCreateUser = async () => {
    if (creatingUser) return;

    if (!newNombre.trim() || !newEmail.trim() || !newUsuario.trim() || !newPassword.trim()) {
      Alert.alert('Datos incompletos', 'Completa nombre, correo, usuario y contraseña.');
      return;
    }

    setCreatingUser(true);
    try {
      const result = await registerUser({
        name: newNombre.trim(),
        email: newEmail.trim().toLowerCase(),
        username: newUsuario.trim().toLowerCase(),
        phone: newTelefono.trim() || null,
        password: newPassword,
      });

      if (!result.success) {
        Alert.alert('Error', result.message || 'No se pudo registrar el usuario.');
        return;
      }

      await loadDashboardData();
      setActiveTab('pacientes');
      setShowCreateModal(false);
      resetCreateForm();
      Alert.alert('Éxito', 'Usuario creado y guardado en Supabase.');
    } finally {
      setCreatingUser(false);
    }
  };

  const renderInicio = () => (
    <>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Estado general del sistema</Text>
        <Text style={styles.bannerBody}>Monitorea pacientes, turnos y tareas críticas en un solo lugar.</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Usuarios registrados</Text>
          <Text style={styles.statValue}>{loadingUsuarios ? '...' : usuariosRegistrados}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Citas hoy</Text>
          <Text style={styles.statValue}>{loadingUsuarios ? '...' : (citasHoy ?? 'Sin datos')}</Text>
        </View>
      </View>

      <View style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>Accesos rápidos</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickItem}
            activeOpacity={0.85}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="person-add-outline" size={20} color="#2f7a96" />
            <Text style={styles.quickText}>Nuevo paciente</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} activeOpacity={0.85}>
            <Ionicons name="document-text-outline" size={20} color="#2f7a96" />
            <Text style={styles.quickText}>Reportes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} activeOpacity={0.85}>
            <Ionicons name="medkit-outline" size={20} color="#2f7a96" />
            <Text style={styles.quickText}>Servicios</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} activeOpacity={0.85}>
            <Ionicons name="notifications-outline" size={20} color="#2f7a96" />
            <Text style={styles.quickText}>Alertas</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderPacientes = () => (
    <View style={styles.actionsCard}>
      <Text style={styles.sectionTitle}>Módulo de pacientes</Text>
      <Text style={styles.moduleDescription}>Toca un usuario para ver los módulos disponibles de gestión clínica.</Text>

      {loadingUsuarios ? (
        <Text style={styles.emptyText}>Cargando usuarios...</Text>
      ) : usuarios.length === 0 ? (
        <Text style={styles.emptyText}>No hay usuarios registrados.</Text>
      ) : (
        <View style={styles.usersList}>
          {usuarios.slice(0, 8).map((u) => {
            const active = selectedUsuario?.id_usuario === u.id_usuario;
            return (
              <TouchableOpacity
                key={u.id_usuario}
                style={[styles.userRow, active && styles.userRowActive]}
                onPress={() => setSelectedUsuario(u)}
                activeOpacity={0.85}
              >
                <Ionicons name="person-circle-outline" size={22} color={active ? '#ffffff' : '#2f7a96'} />
                <View style={styles.userTextWrap}>
                  <Text style={[styles.userName, active && styles.userNameActive]}>{u.nombre || u.usuario || 'Usuario'}</Text>
                  <Text style={[styles.userEmail, active && styles.userEmailActive]}>{u.email}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {!!selectedUsuario && (
        <View style={styles.moduleListBlock}>
          <Text style={styles.modulesForUser}>Módulos habilitados para {selectedUsuario.nombre || selectedUsuario.usuario}</Text>
          <View style={styles.moduleList}>
            <TouchableOpacity
              style={styles.moduleItem}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('AdminPatientRecords', { user: selectedUsuario })}
            >
              <Ionicons name="folder-open-outline" size={18} color="#2f7a96" />
              <Text style={styles.moduleItemText}>Historias clínicas digitalizadas</Text>
              <Ionicons name="chevron-forward-outline" size={18} color="#7da6b7" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.moduleItem}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('AdminPatientTracking', { user: selectedUsuario })}
            >
              <Ionicons name="pulse-outline" size={18} color="#2f7a96" />
              <Text style={styles.moduleItemText}>Seguimiento de indicadores médicos</Text>
              <Ionicons name="chevron-forward-outline" size={18} color="#7da6b7" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.moduleItem}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('AdminPatientAccess', { user: selectedUsuario })}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color="#2f7a96" />
              <Text style={styles.moduleItemText}>Control de acceso por personal autorizado</Text>
              <Ionicons name="chevron-forward-outline" size={18} color="#7da6b7" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const renderCitas = () => (
    <View style={styles.actionsCard}>
      <Text style={styles.sectionTitle}>Módulo de citas</Text>
      <Text style={styles.moduleDescription}>Coordina agenda médica, disponibilidad y turnos para optimizar la atención.</Text>
      <View style={styles.moduleList}>
        <View style={styles.moduleItem}>
          <Ionicons name="calendar-number-outline" size={18} color="#2f7a96" />
          <Text style={styles.moduleItemText}>Agenda diaria y semanal</Text>
        </View>
        <View style={styles.moduleItem}>
          <Ionicons name="time-outline" size={18} color="#2f7a96" />
          <Text style={styles.moduleItemText}>Control de tiempos y puntualidad</Text>
        </View>
        <View style={styles.moduleItem}>
          <Ionicons name="checkmark-done-outline" size={18} color="#2f7a96" />
          <Text style={styles.moduleItemText}>Confirmación de citas y estados</Text>
        </View>
      </View>
    </View>
  );

  const renderAjustes = () => (
    <View style={styles.actionsCard}>
      <Text style={styles.sectionTitle}>Ajustes del sistema</Text>
      <Text style={styles.moduleDescription}>Configura parámetros técnicos y pruebas operativas del entorno Supabase.</Text>
      <View style={styles.settingsActions}>
        <TouchableOpacity
          style={styles.settingsButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('TestConnection')}
        >
          <Ionicons name="cloud-done-outline" size={18} color="#ffffff" />
          <Text style={styles.settingsButtonText}>Probar conexión</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingsButton, styles.settingsButtonSecondary]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('TestSupabase')}
        >
          <Ionicons name="construct-outline" size={18} color="#2f7a96" />
          <Text style={styles.settingsButtonSecondaryText}>Validar servicios</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderActiveModule = () => {
    if (activeTab === 'pacientes') return renderPacientes();
    if (activeTab === 'citas') return renderCitas();
    if (activeTab === 'ajustes') return renderAjustes();
    return renderInicio();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#eef6f8" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>Panel administrativo</Text>
          <Text style={styles.headerTitle}>Gestión clínica</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.replace('RoleSelect')}
          style={styles.logoutButton}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={18} color="#24586d" />
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderActiveModule()}
      </ScrollView>

      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nuevo usuario</Text>
            <Text style={styles.modalSubTitle}>Este registro se guardará en Supabase.</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nombre completo"
              placeholderTextColor="#7a9aa8"
              value={newNombre}
              onChangeText={setNewNombre}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Correo"
              placeholderTextColor="#7a9aa8"
              value={newEmail}
              onChangeText={setNewEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Usuario"
              placeholderTextColor="#7a9aa8"
              value={newUsuario}
              onChangeText={setNewUsuario}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Teléfono (opcional)"
              placeholderTextColor="#7a9aa8"
              value={newTelefono}
              onChangeText={setNewTelefono}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Contraseña"
              placeholderTextColor="#7a9aa8"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, creatingUser && styles.modalButtonDisabled]}
                onPress={handleCreateUser}
                activeOpacity={0.85}
                disabled={creatingUser}
              >
                <Text style={styles.modalButtonText}>{creatingUser ? 'Guardando...' : 'Guardar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomBar}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, active && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={active ? tab.icon.replace('-outline', '') : tab.icon}
                size={20}
                color={active ? '#ffffff' : '#5a7d8d'}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef6f8',
  },
  header: {
    marginTop: 54,
    marginHorizontal: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerEyebrow: {
    color: '#4f7e90',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerTitle: {
    color: '#173746',
    fontSize: 26,
    fontWeight: '800',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#d9edf4',
  },
  logoutText: {
    color: '#24586d',
    fontWeight: '700',
    fontSize: 13,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 18,
    paddingBottom: 120,
    gap: 14,
  },
  banner: {
    backgroundColor: '#1f5f79',
    borderRadius: 18,
    padding: 16,
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  bannerBody: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 19,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d4e7ee',
    padding: 14,
  },
  statLabel: {
    color: '#587886',
    fontSize: 12,
    marginBottom: 8,
  },
  statValue: {
    color: '#193f4f',
    fontSize: 24,
    fontWeight: '800',
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d4e7ee',
    padding: 14,
  },
  sectionTitle: {
    color: '#173746',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickItem: {
    width: '48.5%',
    backgroundColor: '#f3fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#deedf3',
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  quickText: {
    color: '#2d5b6d',
    fontSize: 12,
    fontWeight: '600',
  },
  moduleDescription: {
    color: '#587886',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  emptyText: {
    color: '#587886',
    fontSize: 13,
    marginBottom: 10,
  },
  usersList: {
    gap: 8,
    marginBottom: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#deedf3',
    backgroundColor: '#f6fbfd',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  userRowActive: {
    backgroundColor: '#2f7a96',
    borderColor: '#2f7a96',
  },
  userTextWrap: {
    flex: 1,
  },
  userName: {
    color: '#214b5d',
    fontSize: 13,
    fontWeight: '700',
  },
  userNameActive: {
    color: '#ffffff',
  },
  userEmail: {
    color: '#5d7f8e',
    fontSize: 12,
    marginTop: 1,
  },
  userEmailActive: {
    color: 'rgba(255,255,255,0.9)',
  },
  moduleListBlock: {
    marginTop: 4,
  },
  modulesForUser: {
    color: '#214b5d',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  moduleList: {
    gap: 10,
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f3fafc',
    borderWidth: 1,
    borderColor: '#deedf3',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  moduleItemText: {
    color: '#2d5b6d',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  settingsActions: {
    gap: 10,
  },
  settingsButton: {
    backgroundColor: '#2f7a96',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  settingsButtonSecondary: {
    backgroundColor: '#e8f4f9',
    borderWidth: 1,
    borderColor: '#bedce8',
  },
  settingsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  settingsButtonSecondaryText: {
    color: '#2f7a96',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d4e7ee',
    shadowColor: '#123746',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 8,
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: '#2f7a96',
  },
  tabLabel: {
    color: '#5a7d8d',
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 34, 44, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d4e7ee',
    padding: 16,
  },
  modalTitle: {
    color: '#173746',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSubTitle: {
    color: '#5f7f8d',
    fontSize: 13,
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d4e7ee',
    borderRadius: 12,
    backgroundColor: '#f4fbfd',
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#20495a',
    marginBottom: 9,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#2f7a96',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.65,
  },
  modalButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  modalButtonSecondary: {
    backgroundColor: '#e8f4f9',
    borderWidth: 1,
    borderColor: '#bedce8',
  },
  modalButtonSecondaryText: {
    color: '#2f7a96',
    fontWeight: '700',
    fontSize: 14,
  },
});
