import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchAllUsers, updateUserRole, deleteUser } from '../services/lumex';

export default function SuperAdminDashboardScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editRole, setEditRole] = useState('usuario');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (user) => {
    setEditingUser(user);
    setEditRole(user.rol || 'usuario');
    setShowEditModal(true);
  };

  const saveRoleUpdate = async () => {
    try {
      const success = await updateUserRole(editingUser.id_usuario, editRole);
      if (success) {
        setShowEditModal(false);
        Alert.alert('Éxito', 'Rol actualizado.');
        loadUsers();
      } else {
        throw new Error('No se pudo actualizar.');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDeleteUser = (user) => {
    Alert.alert('Cuidado', `Eliminar a ${user.usuario}.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
          const success = await deleteUser(user.id_usuario);
          if (success) {
            Alert.alert('Eliminado', 'Usuario borrado.');
            loadUsers();
          } else {
            Alert.alert('Error', 'No se pudo eliminar.');
          }
      }}
    ]);
  };

  const renderUserCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.name}>{item.nombre || item.usuario}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.roleBadge}>Rol: {item.rol}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnAction} onPress={() => handleEditRole(item)}>
          <Ionicons name="create-outline" size={20} color="#0f6d78" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnActionRisk} onPress={() => handleDeleteUser(item)}>
          <Ionicons name="trash-outline" size={20} color="#ff3b3b" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel Superadmin</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.replace('Login')}>
          <Ionicons name="exit-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0f6d78" style={{marginTop: 40}} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(i) => String(i.id_usuario)}
          renderItem={renderUserCard}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={loadUsers}
        />
      )}

      {showEditModal && editingUser && (
        <Modal animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Editar Privilegios</Text>
              
              <Text style={styles.label}>Rol:</Text>
              <View style={styles.rolePickerCon}>
                {['usuario', 'admin', 'superadmin'].map((r) => (
                  <TouchableOpacity 
                    key={r} 
                    style={[styles.roleBtn, editRole === r && styles.roleBtnActive]} 
                    onPress={() => setEditRole(r)}
                  >
                    <Text style={[styles.roleTxt, editRole === r && styles.roleTxtActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
                  <Text style={styles.cancelTxt}>Cerrar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={saveRoleUpdate}>
                  <Text style={styles.saveTxt}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f5f6' },
  header: { 
    paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20,
    backgroundColor: '#051821', flexDirection: 'row', justifyContent: 'space-between'
  },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  logoutBtn: { padding: 4 },
  list: { padding: 16, paddingBottom: 80 },
  card: { 
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', elevation: 2,
  },
  cardInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#15333d' },
  email: { fontSize: 13, color: '#5f8a8f' },
  roleBadge: { fontSize: 12, fontWeight: '600', color: '#0f6d78',textTransform: 'uppercase' },
  actions: { flexDirection: 'row' },
  btnAction: { padding: 8, backgroundColor: '#eef8fc', borderRadius: 8, marginLeft: 8 },
  btnActionRisk: { padding: 8, backgroundColor: '#ffe6e6', borderRadius: 8, marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '85%', backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  rolePickerCon: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  roleBtn: { paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: '#d1e6e8', borderRadius: 8 },
  roleBtnActive: { backgroundColor: '#0f6d78', borderColor: '#0f6d78' },
  roleTxt: { fontSize: 12, color: '#314e60' },
  roleTxtActive: { color: '#fff', fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { padding: 10 },
  cancelTxt: { color: '#888', fontWeight: 'bold' },
  saveBtn: { padding: 10, backgroundColor: '#0f6d78', borderRadius: 8 },
  saveTxt: { color: '#fff', fontWeight: 'bold' },
});
