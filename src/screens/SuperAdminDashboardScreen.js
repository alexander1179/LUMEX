import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal,
  ActivityIndicator, TextInput, ScrollView, StatusBar, Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchAllUsers, updateUser, deleteUser, updateAdminPermission } from '../services/lumex/authService';
import { storageService } from '../services/storage/storageService';
import { getApiUrl } from '../services/api/apiConfig';

const ROLES = [
  { id: 'usuario', label: 'Usuarios', icon: 'people-outline', color: '#0f6d78', description: 'Pacientes y usuarios del sistema' },
  { id: 'administrador', label: 'Administradores', icon: 'shield-checkmark-outline', color: '#1a7da2', description: 'Gestores de clínicas y pacientes' },
  { id: 'superadministrador', label: 'Superadmins', icon: 'key-outline', color: '#051821', description: 'Control total de la plataforma' },
];

const TABS = [
  { key: 'inicio', label: 'Inicio', icon: 'home-outline' },
  { key: 'ajustes', label: 'Ajustes', icon: 'settings-outline' },
];

export default function SuperAdminDashboardScreen({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [activeTab, setActiveTab] = useState('inicio');
  
  // Modales
  const [showListModal, setShowListModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMyProfileModal, setShowMyProfileModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  // Perfil
  const [profileNombre, setProfileNombre] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileUsuario, setProfileUsuario] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [localFormData, setLocalFormData] = useState({});

  useEffect(() => { init(); }, []);

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

  const loadProfile = async () => {
    const user = await storageService.getUser();
    setProfileNombre(user?.nombre || user?.name || '');
    setProfileEmail(user?.email || '');
    setProfileUsuario(user?.usuario || user?.username || '');
    setShowMyProfileModal(true);
  };

  const handleSaveMyProfile = async () => {
    if (!profileNombre.trim() || !profileEmail.trim()) {
      Alert.alert('Incompleto', 'El nombre y correo son obligatorios.');
      return;
    }
    setSavingProfile(true);
    try {
      const user = await storageService.getUser();
      const payload = {
        id_usuario: user?.id_usuario || user?.id,
        nombre: profileNombre, email: profileEmail, usuario: profileUsuario,
        rol: user?.rol || 'superadministrador', telefono: user?.telefono || ''
      };

      const res = await fetch(`${getApiUrl()}/admin/update-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Fallo actualizando administrador');

      const updatedLocalUser = { ...user, nombre: profileNombre, email: profileEmail, usuario: profileUsuario };
      await storageService.saveUser(updatedLocalUser);
      setCurrentUser(updatedLocalUser);
      setShowMyProfileModal(false);
      Alert.alert('Actualizado', 'Tu perfil se actualizó correctamente.');
    } catch (e) { Alert.alert('Error', e.message); } 
    finally { setSavingProfile(false); }
  };

  const handleToggleAdminPermission = async (adminId, field, newValue) => {
    try {
      const mapped = allUsers.map(u => u.id_usuario === adminId ? { ...u, [field]: newValue ? 1 : 0 } : u);
      setAllUsers(mapped);
      
      const res = await updateAdminPermission(adminId, field, newValue ? 1 : 0);
      if(!res) {
         Alert.alert('Error', 'No se guardó el permiso en el DB.');
         loadUsers();
      }
    } catch (e) { 
      Alert.alert('Falla', e.message);
      loadUsers();
    }
  };

  const isMaster = currentUser?.usuario === 'superadmin01' || currentUser?.id_usuario === 1;

  const handleSelectRole = (roleId) => {
    const list = allUsers.filter(u => String(u.rol).toLowerCase() === roleId.toLowerCase() && u.id_usuario !== currentUser?.id_usuario);
    setFilteredUsers(list);
    setSelectedRole(roleId);
    setShowListModal(true);
  };

  const handleSelectUser = (user) => {
    if (!isMaster && (user.rol === 'administrador' || user.rol === 'superadministrador')) {
      Alert.alert("Acceso Restringido", "No tienes permisos jerárquicos."); return;
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
        Alert.alert('Éxito', 'Información actualizada');
        setShowDetailModal(false);
        const updatedUsers = await fetchAllUsers();
        setAllUsers(updatedUsers);
        setFilteredUsers(updatedUsers.filter(u => String(u.rol).toLowerCase() === selectedRole.toLowerCase()));
      } else { Alert.alert('Error', 'No se guardó'); }
    } catch (err) { Alert.alert('Error', err.message); } 
    finally { setLoading(false); }
  };

  const handleDelete = () => {
    Alert.alert('¿Eliminar?', `Borrarás a ${editingUser.usuario}.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
          const success = await deleteUser(editingUser.id_usuario);
          if (success) {
            Alert.alert('Eliminado', 'Borrado.');
            setShowDetailModal(false); setShowListModal(false); loadUsers();
          } else { Alert.alert('Error', 'No eliminado'); }
      }}
    ]);
  };

  const renderRoleCard = ({ item }) => (
    <TouchableOpacity style={styles.roleCard} onPress={() => handleSelectRole(item.id)} activeOpacity={0.8}>
      <View style={[styles.roleIconBox, { backgroundColor: item.color + '20' }]}><Ionicons name={item.icon} size={30} color={item.color} /></View>
      <View style={styles.roleTextContent}><Text style={styles.roleLabel}>{item.label}</Text><Text style={styles.roleDescription}>{item.description}</Text></View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const renderInicio = () => (
    <View style={{flex:1}}>
      <Text style={styles.sectionTitle}>Selecciona un rol para gestionar</Text>
      {ROLES.map((role) => (<View key={role.id}>{renderRoleCard({ item: role })}</View>))}
      {loading && <ActivityIndicator color="#0f6d78" size="large" style={{ marginTop: 20 }} />}
    </View>
  );

  const renderAjustes = () => (
    <View style={{flex:1}}>
      <Text style={styles.sectionTitle}>Entorno Personal y Permisos</Text>
      <View style={styles.whiteCard}>
        <View style={styles.ajustesItem}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Ionicons name="id-card-outline" size={24} color="#0f6d78" />
                <Text style={styles.ajustesLabel}>Mi Perfil Administrativo</Text>
            </View>
            <TouchableOpacity style={styles.btnSec} onPress={loadProfile}><Text style={styles.btnSecText}>Editar</Text></TouchableOpacity>
        </View>

        <View style={[styles.ajustesItem, { borderBottomWidth: 0 }]}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Ionicons name="lock-closed-outline" size={24} color="#e67e22" />
                <View style={{marginLeft: 8}}>
                   <Text style={[styles.ajustesLabel, {marginLeft: 0}]}>Restricciones de App</Text>
                   <Text style={{fontSize: 11, color: '#777', maxWidth: 170}}>Bloquea permisos a roles inferiores</Text>
                </View>
            </View>
            <TouchableOpacity style={[styles.btnSec, {borderColor: '#e67e22'}]} onPress={() => setShowPermissionsModal(true)}>
                <Text style={[styles.btnSecText, {color: '#e67e22'}]}>Gestionar</Text>
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Hola, {currentUser?.nombre || currentUser?.usuario || 'Super Admin'}</Text>
          <Text style={styles.headerTitle}>Superadministrador</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await storageService.removeUser(); navigation.replace('Login'); }}>
          <Ionicons name="power-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.mainContent}>
         {activeTab === 'inicio' ? renderInicio() : renderAjustes()}
      </ScrollView>

      <View style={styles.bottomBar}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={[styles.tabButton, active && styles.tabButtonActive]} onPress={() => setActiveTab(tab.key)}>
              <Ionicons name={tab.icon} size={24} color={active ? '#2b7896' : '#a2becb'} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Modal Lista de Roles */}
      <Modal visible={showListModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Personas: {selectedRole}</Text>
              <TouchableOpacity onPress={() => setShowListModal(false)}>
                <Ionicons name="close-circle" size={30} color="#ccc" />
              </TouchableOpacity>
            </View>
            <FlatList data={filteredUsers} keyExtractor={(item) => String(item.id_usuario)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.userListItem} onPress={() => handleSelectUser(item)}>
                  <View style={styles.userListAvatar}><Text style={styles.userListAvatarText}>{(item.nombre || 'U')[0].toUpperCase()}</Text></View>
                  <View style={{ flex: 1 }}><Text style={styles.userListName}>{item.nombre || item.usuario}</Text><Text style={styles.userListEmail}>{item.email}</Text></View>
                  <Ionicons name="eye-outline" size={20} color="#0f6d78" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No hay personas</Text>}
            />
          </View>
        </View>
      </Modal>

      {/* Modal Permisos */}
      <Modal visible={showPermissionsModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, {height: '90%'}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Administradores Regulares</Text>
              <TouchableOpacity onPress={() => setShowPermissionsModal(false)}><Ionicons name="close-circle" size={30} color="#ccc" /></TouchableOpacity>
            </View>
            <Text style={{color: '#666', marginBottom: 15, fontSize: 13}}>Define qué acciones específicas puede realizar cada administrador sobre los registros del sistema.</Text>
            <FlatList 
              data={allUsers.filter(u => ['admin', 'administrador'].includes(String(u.rol).toLowerCase()))}
              keyExtractor={(i) => String(i.id_usuario)}
              renderItem={({ item }) => (
                <View style={[styles.whiteCard, {marginBottom: 15, padding: 15, borderLeftWidth: 4, borderLeftColor: '#e67e22'}]}>
                    <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
                        <View style={[styles.userListAvatar, {backgroundColor: '#e67e22', width: 35, height: 35}]}><Text style={[styles.userListAvatarText, {fontSize: 14}]}>{(item.nombre || 'A')[0].toUpperCase()}</Text></View>
                        <View style={{ marginLeft: 10 }}>
                            <Text style={[styles.userListName, {fontSize: 14}]}>{item.nombre || item.usuario}</Text>
                        </View>
                    </View>

                    <View style={{gap: 12}}>
                        <Text style={{fontSize: 11, fontWeight: '800', color: '#888', textTransform: 'uppercase', marginBottom: 4}}>Acciones sobre Datos</Text>
                        <View style={styles.permissionToggleRow}>
                            <Text style={styles.permissionToggleLabel}>Permitir Edición / Creación</Text>
                            <Switch
                                value={item.permiso_editar === 1 || item.permiso_editar === true}
                                onValueChange={(val) => handleToggleAdminPermission(item.id_usuario, 'permiso_editar', val)}
                                trackColor={{ false: "#d9dbda", true: "#2b7896" }}
                                thumbColor="#fff"
                            />
                        </View>
                        <View style={styles.permissionToggleRow}>
                            <Text style={styles.permissionToggleLabel}>Permitir Bloqueo / Borrado</Text>
                            <Switch
                                value={item.permiso_bloquear === 1 || item.permiso_bloquear === true}
                                onValueChange={(val) => handleToggleAdminPermission(item.id_usuario, 'permiso_bloquear', val)}
                                trackColor={{ false: "#d9dbda", true: "#b85a5a" }}
                                thumbColor="#fff"
                            />
                        </View>

                        <Text style={{fontSize: 11, fontWeight: '800', color: '#888', textTransform: 'uppercase', marginTop: 8, marginBottom: 4}}>Acceso a Módulos funcionales</Text>
                        
                        <View style={styles.permissionToggleRow}>
                            <Text style={styles.permissionToggleLabel}>Módulo "Nuevo Paciente"</Text>
                            <Switch
                                value={item.mod_nuevo_paciente === 1 || item.mod_nuevo_paciente === true}
                                onValueChange={(val) => handleToggleAdminPermission(item.id_usuario, 'mod_nuevo_paciente', val)}
                                trackColor={{ false: "#d9dbda", true: "#0f6d78" }}
                                thumbColor="#fff"
                            />
                        </View>

                        <View style={styles.permissionToggleRow}>
                            <Text style={styles.permissionToggleLabel}>Módulo "Gestión de Usuarios"</Text>
                            <Switch
                                value={item.mod_gestion_usuarios === 1 || item.mod_gestion_usuarios === true}
                                onValueChange={(val) => handleToggleAdminPermission(item.id_usuario, 'mod_gestion_usuarios', val)}
                                trackColor={{ false: "#d9dbda", true: "#0f6d78" }}
                                thumbColor="#fff"
                            />
                        </View>

                        <View style={styles.permissionToggleRow}>
                            <Text style={styles.permissionToggleLabel}>Módulo "Reportes"</Text>
                            <Switch
                                value={item.mod_reportes === 1 || item.mod_reportes === true}
                                onValueChange={(val) => handleToggleAdminPermission(item.id_usuario, 'mod_reportes', val)}
                                trackColor={{ false: "#d9dbda", true: "#0f6d78" }}
                                thumbColor="#fff"
                            />
                        </View>

                        <View style={styles.permissionToggleRow}>
                            <Text style={styles.permissionToggleLabel}>Módulo "Actividad"</Text>
                            <Switch
                                value={item.mod_actividad === 1 || item.mod_actividad === true}
                                onValueChange={(val) => handleToggleAdminPermission(item.id_usuario, 'mod_actividad', val)}
                                trackColor={{ false: "#d9dbda", true: "#0f6d78" }}
                                thumbColor="#fff"
                            />
                        </View>

                        <View style={styles.permissionToggleRow}>
                            <Text style={styles.permissionToggleLabel}>Módulo "Alertas"</Text>
                            <Switch
                                value={item.mod_alertas === 1 || item.mod_alertas === true}
                                onValueChange={(val) => handleToggleAdminPermission(item.id_usuario, 'mod_alertas', val)}
                                trackColor={{ false: "#d9dbda", true: "#0f6d78" }}
                                thumbColor="#fff"
                            />
                        </View>
                    </View>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Modal Mi Perfil (Admin Super) */}
      <Modal visible={showMyProfileModal} animationType="fade" transparent={true}>
         <View style={styles.modalOverlayDark}>
            <View style={styles.detailCard}>
               <Text style={styles.detailTitle}>Mi Perfil (SuperAdmin)</Text>
               <TextInput style={styles.input} placeholder="Nombre completo" value={profileNombre} onChangeText={setProfileNombre} />
               <TextInput style={styles.input} placeholder="Nombre de usuario" value={profileUsuario} onChangeText={setProfileUsuario} />
               <TextInput style={styles.input} placeholder="Correo electrónico" value={profileEmail} onChangeText={setProfileEmail} autoCapitalize="none" keyboardType="email-address" />
               <View style={[styles.detailFooter, {marginTop: 10}]}><TouchableOpacity style={styles.btnDelete} onPress={() => setShowMyProfileModal(false)}><Text style={{color: '#666'}}>Cancelar</Text></TouchableOpacity><TouchableOpacity style={styles.btnSave} onPress={handleSaveMyProfile} disabled={savingProfile}><Text style={styles.btnSaveText}>{savingProfile ? 'Guardando...' : 'Guardar'}</Text></TouchableOpacity></View>
            </View>
         </View>
      </Modal>

      {/* Modal Editar Usuarios */}
      <Modal visible={showDetailModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlayDark}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}><Text style={styles.detailTitle}>Datos del Usuario</Text><TouchableOpacity onPress={() => setShowDetailModal(false)}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity></View>
            <ScrollView style={styles.detailForm}>
              <Text style={styles.inputLabel}>Nombre completo</Text><TextInput style={styles.input} value={localFormData.nombre} onChangeText={(t) => setLocalFormData({...localFormData, nombre: t})} />
              <Text style={styles.inputLabel}>Usuario</Text><TextInput style={styles.input} value={localFormData.usuario} onChangeText={(t) => setLocalFormData({...localFormData, usuario: t})} />
              <Text style={styles.inputLabel}>Correo</Text><TextInput style={styles.input} value={localFormData.email} autoCapitalize="none" keyboardType="email-address" onChangeText={(t) => setLocalFormData({...localFormData, email: t})} />
              <Text style={styles.inputLabel}>Teléfono</Text><TextInput style={styles.input} value={localFormData.telefono} keyboardType="phone-pad" onChangeText={(t) => setLocalFormData({...localFormData, telefono: t})} />
              {isMaster && (
              <View>
                 <Text style={styles.inputLabel}>Rol del sistema</Text>
                 <View style={styles.roleSelector}>{['usuario', 'administrador', 'superadministrador'].map((r) => (<TouchableOpacity key={r} style={[styles.roleMiniBtn, localFormData.rol === r && styles.roleMiniBtnActive]} onPress={() => setLocalFormData({...localFormData, rol: r})}><Text style={[styles.roleMiniText, localFormData.rol === r && styles.roleMiniTextActive]}>{r[0].toUpperCase()}</Text></TouchableOpacity>))}</View>
              </View>)}
            </ScrollView>
            <View style={styles.detailFooter}><TouchableOpacity style={styles.btnDelete} onPress={handleDelete}><Ionicons name="trash-outline" size={20} color="#ff3b3b" /><Text style={styles.btnDeleteText}>Eliminar</Text></TouchableOpacity><TouchableOpacity style={styles.btnSave} onPress={handleSave}><Text style={styles.btnSaveText}>Guardar</Text></TouchableOpacity></View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f8f9' },
  header: { paddingTop: 60, paddingBottom: 25, paddingHorizontal: 25, backgroundColor: '#051821', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  logoutBtn: { width: 45, height: 45, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  mainContent: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#444', marginBottom: 20, textAlign: 'center' },
  roleCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15, flexDirection: 'row', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
  roleIconBox: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  roleTextContent: { flex: 1, marginLeft: 15 },
  roleLabel: { fontSize: 17, fontWeight: 'bold', color: '#15333d' },
  roleDescription: { fontSize: 12, color: '#6d8a91', marginTop: 2 },
  whiteCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  ajustesItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  ajustesLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginLeft: 12 },
  btnSec: { borderWidth: 1, borderColor: '#0f6d78', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 12 },
  btnSecText: { color: '#0f6d78', fontWeight: 'bold', fontSize: 13 },
  bottomBar: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 12, paddingBottom: 25, borderTopLeftRadius: 25, borderTopRightRadius: 25, shadowColor: '#000', shadowOffset: {height: -5}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 15 },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 12, color: '#a2becb', marginTop: 4, fontWeight: '600' },
  tabTextActive: { color: '#2b7896', fontWeight: 'bold' },
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
  permissionToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  permissionToggleLabel: {
    fontSize: 12,
    color: '#444',
    fontWeight: '600',
  },
});
