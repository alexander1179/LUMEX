import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator,
  TextInput,
  ScrollView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchAllUsers, updateUser, deleteUser } from '../services/lumex';
import { storageService } from '../services/storage/storageService';

const ROLES = [
  { id: 'usuario', label: 'Usuarios', icon: 'people-outline', color: '#0f6d78', description: 'Pacientes y usuarios del sistema' },
  { id: 'administrador', label: 'Administradores', icon: 'shield-checkmark-outline', color: '#1a7da2', description: 'Gestores de clínicas y pacientes' },
  { id: 'superadministrador', label: 'Superadmins', icon: 'key-outline', color: '#051821', description: 'Control total de la plataforma' },
];

export default function SuperAdminDashboardScreen({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  
  // Modales
  const [showListModal, setShowListModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Usuario en edición
  const [editingUser, setEditingUser] = useState(null);
  const [localFormData, setLocalFormData] = useState({});

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const user = await storageService.getUser();
    setCurrentUser(user);
    await loadUsers();
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchAllUsers();
      setAllUsers(data);
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  // El "Master" es el que tiene el ID más bajo o el username superadmin01
  const isMaster = currentUser?.usuario === 'superadmin01' || currentUser?.id_usuario === 1;

  const handleSelectRole = (roleId) => {
    // FILTRO IMPORTANTE: Excluir al usuario actual de la lista de gestión
    const list = allUsers.filter(u => 
      String(u.rol).toLowerCase() === roleId.toLowerCase() && 
      u.id_usuario !== currentUser?.id_usuario
    );
    setFilteredUsers(list);
    setSelectedRole(roleId);
    setShowListModal(true);
  };

  const handleSelectUser = (user) => {
    // Restricción: Solo el Master puede editar otros Admins o SuperAdmins
    if (!isMaster && (user.rol === 'administrador' || user.rol === 'superadministrador')) {
      Alert.alert("Acceso Restringido", "No tienes permisos de jerarquía para modificar a otros administradores.");
      return;
    }
    setEditingUser(user);
    setLocalFormData({ ...user });
    setShowDetailModal(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const success = await updateUser(localFormData);
      if (success) {
        Alert.alert('Éxito', 'Información actualizada correctamente');
        setShowDetailModal(false);
        await loadUsers();
        // Actualizar la lista filtrada también
        const currentRole = selectedRole;
        const updatedUsers = await fetchAllUsers();
        setFilteredUsers(updatedUsers.filter(u => String(u.rol).toLowerCase() === currentRole.toLowerCase()));
      } else {
        Alert.alert('Error', 'No se pudo guardar la información');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      '¿Eliminar usuario?',
      `Esta acción borrará definitivamente a ${editingUser.usuario}. ¿Estás seguro?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive', 
          onPress: async () => {
            const success = await deleteUser(editingUser.id_usuario);
            if (success) {
              Alert.alert('Eliminado', 'El usuario ha sido borrado');
              setShowDetailModal(false);
              setShowListModal(false);
              loadUsers();
            } else {
              Alert.alert('Error', 'No se pudo eliminar al usuario');
            }
          }
        }
      ]
    );
  };

  const renderRoleCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.roleCard}
      onPress={() => handleSelectRole(item.id)}
      activeOpacity={0.8}
    >
      <View style={[styles.roleIconBox, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon} size={30} color={item.color} />
      </View>
      <View style={styles.roleTextContent}>
        <Text style={styles.roleLabel}>{item.label}</Text>
        <Text style={styles.roleDescription}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Gestión de Roles</Text>
          <Text style={styles.headerTitle}>Superadministrador</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.replace('Login')}>
          <Ionicons name="power-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.mainContent}>
        <Text style={styles.sectionTitle}>Selecciona un rol para gestionar</Text>
        {ROLES.map((role) => (
          <View key={role.id}>{renderRoleCard({ item: role })}</View>
        ))}
        
        {loading && <ActivityIndicator color="#0f6d78" size="large" style={{ marginTop: 20 }} />}
      </ScrollView>

      {/* MODAL NIVEL 1: Lista de Usuarios */}
      <Modal visible={showListModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Personas: {selectedRole}</Text>
              <TouchableOpacity onPress={() => setShowListModal(false)}>
                <Ionicons name="close-circle" size={30} color="#ccc" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => String(item.id_usuario)}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.userListItem}
                  onPress={() => handleSelectUser(item)}
                >
                  <View style={styles.userListAvatar}>
                    <Text style={styles.userListAvatarText}>{(item.nombre || 'U')[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userListName}>{item.nombre || item.usuario}</Text>
                    <Text style={styles.userListEmail}>{item.email}</Text>
                  </View>
                  <Ionicons name="eye-outline" size={20} color="#0f6d78" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No hay personas con este rol</Text>}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL NIVEL 2: Detalle y Edición */}
      <Modal visible={showDetailModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlayDark}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Datos del Usuario</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailForm}>
              <Text style={styles.inputLabel}>Nombre completo</Text>
              <TextInput 
                style={styles.input} 
                value={localFormData.nombre}
                onChangeText={(t) => setLocalFormData({...localFormData, nombre: t})}
                placeholder="Nombre"
              />

              <Text style={styles.inputLabel}>Usuario</Text>
              <TextInput 
                style={styles.input} 
                value={localFormData.usuario}
                onChangeText={(t) => setLocalFormData({...localFormData, usuario: t})}
                placeholder="Username"
              />

              <Text style={styles.inputLabel}>Correo Electrónico</Text>
              <TextInput 
                style={styles.input} 
                value={localFormData.email}
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={(t) => setLocalFormData({...localFormData, email: t})}
                placeholder="Email"
              />

              <Text style={styles.inputLabel}>Teléfono</Text>
              <TextInput 
                style={styles.input} 
                value={localFormData.telefono}
                keyboardType="phone-pad"
                onChangeText={(t) => setLocalFormData({...localFormData, telefono: t})}
                placeholder="Teléfono"
              />

              <Text style={styles.inputLabel}>Rol del sistema</Text>
              <View style={styles.roleSelector}>
                {['usuario', 'administrador', 'superadministrador'].map((r) => (
                  <TouchableOpacity 
                    key={r} 
                    style={[styles.roleMiniBtn, localFormData.rol === r && styles.roleMiniBtnActive]}
                    onPress={() => setLocalFormData({...localFormData, rol: r})}
                  >
                    <Text style={[styles.roleMiniText, localFormData.rol === r && styles.roleMiniTextActive]}>{r[0].toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.detailFooter}>
              <TouchableOpacity style={styles.btnDelete} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={20} color="#ff3b3b" />
                <Text style={styles.btnDeleteText}>Eliminar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
                <Text style={styles.btnSaveText}>Guardar Cambios</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f8f9' },
  header: { 
    paddingTop: 60, paddingBottom: 25, paddingHorizontal: 25,
    backgroundColor: '#051821', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  headerSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  logoutBtn: { width: 45, height: 45, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  mainContent: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#444', marginBottom: 20, textAlign: 'center' },
  roleCard: { 
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15,
    flexDirection: 'row', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5
  },
  roleIconBox: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  roleTextContent: { flex: 1, marginLeft: 15 },
  roleLabel: { fontSize: 17, fontWeight: 'bold', color: '#15333d' },
  roleDescription: { fontSize: 12, color: '#6d8a91', marginTop: 2 },
  
  // Modales
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContainer: { height: '80%', backgroundColor: '#fff', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalHeaderTitle: { fontSize: 19, fontWeight: '800', color: '#15333d', textTransform: 'capitalize' },
  userListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  userListAvatar: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#0f6d78', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  userListAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  userListName: { fontSize: 15, fontWeight: 'bold', color: '#15333d' },
  userListEmail: { fontSize: 12, color: '#777' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999', fontStyle: 'italic' },
  
  // Detalle
  modalOverlayDark: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  detailCard: { width: '90%', maxHeight: '85%', backgroundColor: '#fff', borderRadius: 25, padding: 25, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  detailTitle: { fontSize: 18, fontWeight: 'bold', color: '#15333d' },
  detailForm: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 5, marginLeft: 5 },
  input: { backgroundColor: '#f4f8f9', borderRadius: 12, padding: 12, marginBottom: 15, borderWidth: 1, borderColor: '#e1eef0', color: '#333' },
  roleSelector: { flexDirection: 'row', gap: 10, marginVertical: 10 },
  roleMiniBtn: { width: 45, height: 45, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  roleMiniBtnActive: { backgroundColor: '#0f6d78', borderColor: '#0f6d78' },
  roleMiniText: { fontWeight: 'bold', color: '#666' },
  roleMiniTextActive: { color: '#fff' },
  detailFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 20 },
  btnDelete: { flexDirection: 'row', alignItems: 'center' },
  btnDeleteText: { color: '#ff3b3b', fontWeight: 'bold', marginLeft: 5 },
  btnSave: { backgroundColor: '#0f6d78', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  btnSaveText: { color: '#fff', fontWeight: 'bold' },
});
