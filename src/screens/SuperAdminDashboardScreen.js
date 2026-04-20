import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal,
  ActivityIndicator, TextInput, ScrollView, StatusBar, Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchAllUsers, updateUser, deleteUser, updateAdminPermission, hashPassword, registerUser } from '../services/lumex/authService';
import { storageService } from '../services/storage/storageService';
import { getApiUrl } from '../services/api/apiConfig';

const ROLES = [
  { id: 'gestion_personas', label: 'Gestión de Personas', icon: 'people-outline', color: '#0f6d78', description: 'Administración de Usuarios y Personal del Sistema' },
  { id: 'alta_cuenta', label: 'Registro de Personal y Usuarios', icon: 'person-add-outline', color: '#1a7da2', description: 'Alta de nuevas credenciales con asignación de rol jerárquico' },
  { id: 'supervision_pagos', label: 'Supervisión de Pagos', icon: 'card-outline', color: '#e67e22', description: 'Supervisión de transacciones y pagos de usuarios' },
];

const ROLE_MODULES = [
  { id: 'administrador', label: 'Administradores', icon: 'shield-checkmark-outline', color: '#1a7da2', description: 'Gestión de perfiles administrativos' },
  { id: 'doctor', label: 'Doctores', icon: 'medical-outline', color: '#2b7896', description: 'Gestión de personal médico' },
  { id: 'enfermero', label: 'Enfermeros', icon: 'heart-outline', color: '#10ac84', description: 'Gestión de personal de enfermería' },
  { id: 'usuario', label: 'Usuarios', icon: 'people-outline', color: '#0f6d78', description: 'Pacientes y usuarios finales' },
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
  const [currentSubView, setCurrentSubView] = useState('main'); // 'main' o 'role_selection'
  
  // Modales
  const [showListModal, setShowListModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showMyProfileModal, setShowMyProfileModal] = useState(false);
  
  // Pagos y Restricciones
  const [allPayments, setAllPayments] = useState([]);
  const [groupedPaymentUsers, setGroupedPaymentUsers] = useState([]);
  const [showPagosUsersModal, setShowPagosUsersModal] = useState(false);
  const [showPagosDetailModal, setShowPagosDetailModal] = useState(false);
  const [selectedPaymentUser, setSelectedPaymentUser] = useState(null);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [showAdminPermissionsModal, setShowAdminPermissionsModal] = useState(false);
  const [selectedAdminForRestrictions, setSelectedAdminForRestrictions] = useState(null);
  
  // Visibilidad de claves
  const [seeNuevaPass, setSeeNuevaPass] = useState(false);
  const [seeRegisterPass, setSeeRegisterPass] = useState(false);
  
  const [registerFormData, setRegisterFormData] = useState({ nombre: '', usuario: '', email: '', telefono: '', password: '', rol: 'usuario' });
  const [isRegistering, setIsRegistering] = useState(false);

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
    if (roleId === 'alta_cuenta') {
      setRegisterFormData({ nombre: '', usuario: '', email: '', telefono: '', password: '', rol: 'usuario' });
      setShowRegisterModal(true);
      return;
    }

    if (roleId === 'supervision_pagos') {
      fetchPaymentsAndShow();
      return;
    }

    if (roleId === 'gestion_personas') {
      setCurrentSubView('role_selection');
      return;
    }
    
    // Si llegamos aquí es porque seleccionamos un rol específico desde la sub-vista
    const list = allUsers.filter(u => {
      const r = String(u.rol || '').toLowerCase();
      return r === roleId.toLowerCase() && u.id_usuario !== currentUser?.id_usuario;
    });
    
    setFilteredUsers(list);
    setSelectedRole(roleId);
    setShowListModal(true);
  };

  const fetchPaymentsAndShow = async () => {
    setLoadingPagos(true);
    try {
      const response = await fetch(`${getApiUrl()}/admin/payments`);
      const json = await response.json();
      if (json.success) {
        setAllPayments(json.payments);
        const map = new Map();
        json.payments.forEach(p => {
          if (!map.has(p.id_usuario)) {
            map.set(p.id_usuario, {
              id_usuario: p.id_usuario,
              usuario_nombre: p.usuario_nombre,
              usuario_username: p.usuario_username,
              usuario_email: p.usuario_email,
              total_pagos: 0,
              monto_total: 0
            });
          }
          const curr = map.get(p.id_usuario);
          curr.total_pagos += 1;
          curr.monto_total += Number(p.monto) || 0;
        });
        setGroupedPaymentUsers(Array.from(map.values()));
        setShowPagosUsersModal(true);
      } else {
        Alert.alert('Error', 'No se pudieron cargar los pagos');
      }
    } catch(err) {
      Alert.alert('Error', err.message);
    }
    setLoadingPagos(false);
  };

  const handleSelectPaymentUser = (userId) => {
    setSelectedPaymentUser(userId);
    setShowPagosDetailModal(true);
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
      let payload = { ...localFormData };
      
      // Si el superadmin escribió una nueva clave, la hasheamos antes de enviar
      if (localFormData.nuevaPassword?.trim()) {
        payload.passwordHash = await hashPassword(localFormData.nuevaPassword);
      }

      const result = await updateUser(payload);
      if (result.success) {
        Alert.alert('Éxito', result.message);
        setShowDetailModal(false);
        const updatedUsers = await fetchAllUsers();
        setAllUsers(updatedUsers);
        // Usamos una comparación segura por si seleccionRole es null
        setFilteredUsers(updatedUsers.filter(u => {
           if (!selectedRole || selectedRole === 'Usuarios y Administradores') {
              const r = String(u.rol || '').toLowerCase();
              return r !== 'superadmin' && r !== 'superadministrador';
           }
           return String(u.rol).toLowerCase() === selectedRole.toLowerCase();
        }));
      } else { Alert.alert('Error de Guardado', result.message); }
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

  const handleRegister = async () => {
    const { nombre, usuario, email, password, rol } = registerFormData;
    if (!nombre.trim() || !usuario.trim() || !password.trim()) {
      Alert.alert('Incompleto', 'Nombre, Usuario y Contraseña son obligatorios.');
      return;
    }
    
    setIsRegistering(true);
    try {
      // Usamos el servicio oficial que ya maneja el hashing
      const result = await registerUser({
          name: nombre,
          username: usuario,
          email: email,
          phone: registerFormData.telefono,
          password: password,
          rol: rol
      });

      if (result.success) {
        Alert.alert('Éxito', 'Cuenta creada correctamente');
        setShowRegisterModal(false);
        setRegisterFormData({ nombre: '', usuario: '', email: '', telefono: '', password: '', rol: 'usuario' });
        loadUsers();
      } else {
        Alert.alert('Fallo en Registro', result.message);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const toggleBlockUser = async (user) => {
    const isCurrentlyBlocked = user.estado === 'bloqueado';
    const nextBlocked = !isCurrentlyBlocked;
    
    const mappedUsers = allUsers.map(u => u.id_usuario === user.id_usuario ? { ...u, estado: nextBlocked ? 'bloqueado' : 'activo' } : u);
    setAllUsers(mappedUsers);
    setFilteredUsers(prev => prev.map(u => u.id_usuario === user.id_usuario ? { ...u, estado: nextBlocked ? 'bloqueado' : 'activo' } : u));
    
    try {
      const response = await fetch(`${getApiUrl()}/admin/block-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario: user.id_usuario, blocked: nextBlocked })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Fallo de conexión');
    } catch (err) {
      Alert.alert('Error', err.message);
      loadUsers();
    }
  };

  const renderRoleCard = ({ item }) => (
    <TouchableOpacity style={styles.roleCard} onPress={() => handleSelectRole(item.id)} activeOpacity={0.8}>
      <View style={[styles.roleIconBox, { backgroundColor: item.color + '20' }]}><Ionicons name={item.icon} size={30} color={item.color} /></View>
      <View style={styles.roleTextContent}><Text style={styles.roleLabel}>{item.label}</Text><Text style={styles.roleDescription}>{item.description}</Text></View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const renderInicio = () => {
    if (currentSubView === 'role_selection') {
      return (
        <View style={{flex: 1}}>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 20}}>
            <TouchableOpacity onPress={() => setCurrentSubView('main')} style={{marginRight: 15, padding: 5}}>
              <Ionicons name="arrow-back" size={24} color="#0f6d78" />
            </TouchableOpacity>
            <Text style={[styles.sectionTitle, {marginBottom: 0, textAlign: 'left'}]}>Selecciona categoría</Text>
          </View>
          <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'}}>
             {ROLE_MODULES.map(role => (
                <TouchableOpacity key={role.id} style={[styles.roleCard, {width: '48%', flexDirection: 'column', height: 160, padding: 15}]} onPress={() => handleSelectRole(role.id)}>
                   <View style={[styles.roleIconBox, { backgroundColor: role.color + '20', marginBottom: 12 }]}><Ionicons name={role.icon} size={28} color={role.color} /></View>
                   <Text style={[styles.roleLabel, {fontSize: 14, textAlign: 'center'}]}>{role.label}</Text>
                   <Text style={[styles.roleDescription, {textAlign: 'center', fontSize: 10}]}>{role.description}</Text>
                </TouchableOpacity>
             ))}
          </View>
        </View>
      );
    }

    return (
      <View style={{flex:1}}>
        <Text style={styles.sectionTitle}>Panel de Administración Global</Text>
        {ROLES.map((role) => (<View key={role.id}>{renderRoleCard({ item: role })}</View>))}
        {loading && <ActivityIndicator color="#0f6d78" size="large" style={{ marginTop: 20 }} />}
      </View>
    );
  };

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
            <TouchableOpacity key={tab.key} style={[styles.tabButton, active && styles.tabButtonActive]} onPress={() => { setActiveTab(tab.key); setCurrentSubView('main'); }}>
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
              <Text style={styles.modalHeaderTitle}>{selectedRole}</Text>
            </View>
            <FlatList data={filteredUsers} keyExtractor={(item) => String(item.id_usuario)}
              renderItem={({ item }) => (
                <View style={[styles.userListItem, item.estado === 'bloqueado' && { opacity: 0.6 }]}>
                  <View style={[styles.userListAvatar, item.estado === 'bloqueado' && { backgroundColor: '#e74c3c' }]}><Text style={styles.userListAvatarText}>{(item.nombre || 'U')[0].toUpperCase()}</Text></View>
                  <View style={{ flex: 1 }}>
                        <Text style={[styles.userListName, item.estado === 'bloqueado' && { textDecorationLine: 'line-through', color: '#999' }]}>{item.nombre || item.usuario}</Text>
                        <View style={{backgroundColor: item.estado === 'bloqueado' ? '#fbeeee' : '#e8f4f9', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, marginTop: 2}}>
                            <Text style={{fontSize: 9, color: item.estado === 'bloqueado' ? '#e74c3c' : '#0f6d78', fontWeight: 'bold', textTransform: 'uppercase'}}>{item.estado === 'bloqueado' ? 'BLOQUEADO' : item.rol}</Text>
                        </View>
                   </View>
                   <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                      <TouchableOpacity onPress={() => toggleBlockUser(item)} style={{padding: 8, backgroundColor: item.estado === 'bloqueado' ? '#fbeeee' : '#ecf0f1', borderRadius: 8}}>
                         <Ionicons name={item.estado === 'bloqueado' ? 'lock-closed' : 'lock-open-outline'} size={20} color={item.estado === 'bloqueado' ? '#e74c3c' : '#7f8c8d'} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleSelectUser(item)} style={{padding: 8, backgroundColor: '#e8f4f9', borderRadius: 8}}>
                         <Ionicons name="pencil-outline" size={20} color="#0f6d78" />
                      </TouchableOpacity>
                   </View>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No hay personas registradas</Text>}
            />
            <View style={{marginTop: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 15, alignItems: 'center'}}>
                <TouchableOpacity style={[styles.btnSave, {backgroundColor: '#5d7f8d', paddingHorizontal: 40, paddingVertical: 10, minWidth: 120, justifyContent: 'center', alignItems: 'center'}]} onPress={() => setShowListModal(false)}>
                    <Text style={styles.btnSaveText}>Salir</Text>
                </TouchableOpacity>
             </View>
          </View>
        </View>
      </Modal>

      {/* Modal Permisos */}
      <Modal visible={showPermissionsModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, {height: '90%'}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Administradores</Text>
              <TouchableOpacity onPress={() => setShowPermissionsModal(false)}><Ionicons name="close-circle" size={30} color="#ccc" /></TouchableOpacity>
            </View>
            <Text style={{color: '#666', marginBottom: 15, fontSize: 13}}>Define qué acciones específicas puede realizar cada administrador sobre los registros del sistema.</Text>
            <FlatList 
              data={allUsers.filter(u => ['admin', 'administrador'].includes(String(u.rol).toLowerCase()))}
              keyExtractor={(i) => String(i.id_usuario)}
              renderItem={({ item }) => (
                <TouchableOpacity 
                   style={[styles.whiteCard, {marginBottom: 15, padding: 15, borderLeftWidth: 4, borderLeftColor: '#e67e22', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}]}
                   onPress={() => {
                       setSelectedAdminForRestrictions(item);
                       setShowAdminPermissionsModal(true);
                   }}
                >
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <View style={[styles.userListAvatar, {backgroundColor: '#e67e22', width: 35, height: 35}]}><Text style={[styles.userListAvatarText, {fontSize: 14}]}>{(item.nombre || 'A')[0].toUpperCase()}</Text></View>
                        <View style={{ marginLeft: 10 }}>
                            <Text style={[styles.userListName, {fontSize: 14}]}>{item.nombre || item.usuario}</Text>
                            <Text style={{fontSize: 11, color: '#666', marginTop: 2}}>Toca para ver o modificar accesos</Text>
                        </View>
                    </View>
                    <Ionicons name="settings-outline" size={20} color="#e67e22" />
                </TouchableOpacity>
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
              
              <View style={{marginTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 15}}>
                <Text style={[styles.inputLabel, {color: '#d35400'}]}>Nueva Contraseña (Dejar vacío para no cambiar)</Text>
                <View style={[styles.input, {flexDirection: 'row', alignItems: 'center', paddingRight: 10, borderColor: '#e67e2220'}]}>
                    <TextInput 
                        style={{flex: 1, paddingVertical: 10}} 
                        placeholder="Escribe la nueva clave aquí..." 
                        secureTextEntry={!seeNuevaPass} 
                        value={localFormData.nuevaPassword || ''} 
                        onChangeText={(t) => setLocalFormData({...localFormData, nuevaPassword: t})} 
                    />
                    <TouchableOpacity onPress={() => setSeeNuevaPass(!seeNuevaPass)}>
                        <Ionicons name={seeNuevaPass ? "eye-off-outline" : "eye-outline"} size={20} color="#0f6d78" />
                    </TouchableOpacity>
                </View>
              </View>

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

      {/* Modal Registro de Nueva Cuenta */}
      <Modal visible={showRegisterModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlayDark}>
          <View style={styles.detailCard}>
             <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>Nueva Cuenta</Text>
                <TouchableOpacity onPress={() => setShowRegisterModal(false)}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
             </View>
             <ScrollView style={styles.detailForm}>
                <Text style={styles.inputLabel}>Nombre completo</Text>
                <TextInput style={styles.input} placeholder="P. ej. Juan Pérez" value={registerFormData.nombre} onChangeText={t => setRegisterFormData({...registerFormData, nombre: t})} />
                
                <Text style={styles.inputLabel}>Usuario (Login)</Text>
                <TextInput style={styles.input} placeholder="usuario123" autoCapitalize="none" value={registerFormData.usuario} onChangeText={t => setRegisterFormData({...registerFormData, usuario: t})} />
                
                <Text style={styles.inputLabel}>Correo electrónico</Text>
                <TextInput style={styles.input} placeholder="correo@ejemplo.com" keyboardType="email-address" autoCapitalize="none" value={registerFormData.email} onChangeText={t => setRegisterFormData({...registerFormData, email: t})} />
                
                <Text style={styles.inputLabel}>Contraseña</Text>
                <View style={[styles.input, {flexDirection: 'row', alignItems: 'center', paddingRight: 10}]}>
                    <TextInput 
                        style={{flex: 1, paddingVertical: 10}} 
                        placeholder="********" 
                        secureTextEntry={!seeRegisterPass} 
                        value={registerFormData.password} 
                        onChangeText={t => setRegisterFormData({...registerFormData, password: t})} 
                    />
                    <TouchableOpacity onPress={() => setSeeRegisterPass(!seeRegisterPass)}>
                        <Ionicons name={seeRegisterPass ? "eye-off-outline" : "eye-outline"} size={20} color="#0f6d78" />
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.inputLabel}>Rol de Sistema</Text>
                <View style={[styles.roleSelector, {flexWrap: 'wrap'}]}>
                    {['usuario', 'administrador', 'enfermero', 'doctor'].map(r => (
                        <TouchableOpacity 
                            key={r} 
                            style={[styles.roleChip, registerFormData.rol === r && styles.roleChipActive, {marginBottom: 8}]} 
                            onPress={() => setRegisterFormData({...registerFormData, rol: r})}
                        >
                            <Text style={[styles.roleChipText, registerFormData.rol === r && styles.roleChipTextActive]}>
                                {r.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
             </ScrollView>
             <View style={styles.detailFooter}>
                <TouchableOpacity style={styles.btnDelete} onPress={() => setShowRegisterModal(false)}>
                    <Text style={{color: '#666'}}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSave} onPress={handleRegister} disabled={isRegistering}>
                    <Text style={styles.btnSaveText}>{isRegistering ? 'Creando...' : 'Crear Cuenta'}</Text>
                </TouchableOpacity>
             </View>
          </View>
        </View>
      </Modal>

      {/* Modal Permisos Específicos por Admin */}
      <Modal visible={showAdminPermissionsModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, {height: 'auto', minHeight: '60%'}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Accesos de Administrador</Text>
              <TouchableOpacity onPress={() => setShowAdminPermissionsModal(false)}><Ionicons name="close-circle" size={30} color="#ccc" /></TouchableOpacity>
            </View>
            <Text style={{color: '#666', marginBottom: 15, fontSize: 13}}>Administrando restricciones para: {selectedAdminForRestrictions?.nombre || selectedAdminForRestrictions?.usuario}</Text>
            {selectedAdminForRestrictions && (
              <ScrollView style={{gap: 12, paddingBottom: 20}}>
                  <View style={styles.permissionToggleRow}>
                      <Text style={styles.permissionToggleLabel}>Módulo "Nuevo Paciente"</Text>
                      <Switch
                          value={selectedAdminForRestrictions.mod_nuevo_paciente === 1 || selectedAdminForRestrictions.mod_nuevo_paciente === true}
                          onValueChange={(val) => {
                              handleToggleAdminPermission(selectedAdminForRestrictions.id_usuario, 'mod_nuevo_paciente', val);
                              setSelectedAdminForRestrictions({...selectedAdminForRestrictions, mod_nuevo_paciente: val ? 1 : 0});
                          }}
                          trackColor={{ false: "#d9dbda", true: "#0f6d78" }}
                          thumbColor="#fff"
                      />
                  </View>
                  <View style={styles.permissionToggleRow}>
                      <Text style={styles.permissionToggleLabel}>Módulo "Gestión de Usuarios"</Text>
                      <Switch
                          value={selectedAdminForRestrictions.mod_gestion_usuarios === 1 || selectedAdminForRestrictions.mod_gestion_usuarios === true}
                          onValueChange={(val) => {
                              handleToggleAdminPermission(selectedAdminForRestrictions.id_usuario, 'mod_gestion_usuarios', val);
                              setSelectedAdminForRestrictions({...selectedAdminForRestrictions, mod_gestion_usuarios: val ? 1 : 0});
                          }}
                          trackColor={{ false: "#d9dbda", true: "#0f6d78" }}
                          thumbColor="#fff"
                      />
                  </View>
                  <View style={styles.permissionToggleRow}>
                      <Text style={styles.permissionToggleLabel}>Módulo "Reportes"</Text>
                      <Switch
                          value={selectedAdminForRestrictions.mod_reportes === 1 || selectedAdminForRestrictions.mod_reportes === true}
                          onValueChange={(val) => {
                              handleToggleAdminPermission(selectedAdminForRestrictions.id_usuario, 'mod_reportes', val);
                              setSelectedAdminForRestrictions({...selectedAdminForRestrictions, mod_reportes: val ? 1 : 0});
                          }}
                          trackColor={{ false: "#d9dbda", true: "#0f6d78" }}
                          thumbColor="#fff"
                      />
                  </View>
                  <View style={styles.permissionToggleRow}>
                      <Text style={styles.permissionToggleLabel}>Módulo "Actividad"</Text>
                      <Switch
                          value={selectedAdminForRestrictions.mod_actividad === 1 || selectedAdminForRestrictions.mod_actividad === true}
                          onValueChange={(val) => {
                              handleToggleAdminPermission(selectedAdminForRestrictions.id_usuario, 'mod_actividad', val);
                              setSelectedAdminForRestrictions({...selectedAdminForRestrictions, mod_actividad: val ? 1 : 0});
                          }}
                          trackColor={{ false: "#d9dbda", true: "#0f6d78" }}
                          thumbColor="#fff"
                      />
                  </View>
                  <View style={styles.permissionToggleRow}>
                      <Text style={styles.permissionToggleLabel}>Módulo "Alertas"</Text>
                      <Switch
                          value={selectedAdminForRestrictions.mod_alertas === 1 || selectedAdminForRestrictions.mod_alertas === true}
                          onValueChange={(val) => {
                              handleToggleAdminPermission(selectedAdminForRestrictions.id_usuario, 'mod_alertas', val);
                              setSelectedAdminForRestrictions({...selectedAdminForRestrictions, mod_alertas: val ? 1 : 0});
                          }}
                          trackColor={{ false: "#d9dbda", true: "#0f6d78" }}
                          thumbColor="#fff"
                      />
                  </View>
                  <View style={styles.permissionToggleRow}>
                      <Text style={styles.permissionToggleLabel}>Módulo "Pagos"</Text>
                      <Switch
                          value={selectedAdminForRestrictions.mod_pagos === 1 || selectedAdminForRestrictions.mod_pagos === true}
                          onValueChange={(val) => {
                              handleToggleAdminPermission(selectedAdminForRestrictions.id_usuario, 'mod_pagos', val);
                              setSelectedAdminForRestrictions({...selectedAdminForRestrictions, mod_pagos: val ? 1 : 0});
                          }}
                          trackColor={{ false: "#d9dbda", true: "#0f6d78" }}
                          thumbColor="#fff"
                      />
                  </View>
              </ScrollView>
            )}
            <View style={{marginTop: 20, alignItems: 'center'}}>
                <TouchableOpacity style={[styles.btnSave, {backgroundColor: '#e67e22', minWidth: 150, justifyContent: 'center', alignItems: 'center'}]} onPress={() => {
                     setShowAdminPermissionsModal(false);
                     // Refrescar lista madre para que se reflejen los cambios visualmente al reingresar
                     loadUsers();
                }}>
                    <Text style={styles.btnSaveText}>Aceptar Cambios</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Pagos - Listado de Usuarios */}
      <Modal visible={showPagosUsersModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Supervisión de Pagos</Text>
              <TouchableOpacity onPress={() => setShowPagosUsersModal(false)}><Ionicons name="close-circle" size={30} color="#ccc" /></TouchableOpacity>
            </View>
            <Text style={{color: '#666', marginBottom: 15, fontSize: 13}}>Toca un usuario para ver el historial detallado de sus facturas.</Text>
            
            {loadingPagos ? (
                <View style={{flex: 1, justifyContent: 'center'}}><ActivityIndicator size="large" color="#e67e22" /></View>
            ) : (
                <FlatList data={groupedPaymentUsers} keyExtractor={(i) => String(i.id_usuario)}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={[styles.userListItem, {borderColor: '#f0f0f0', borderWidth: 1, borderRadius: 15, paddingHorizontal: 15, marginBottom: 10, paddingVertical: 12}]} onPress={() => handleSelectPaymentUser(item.id_usuario)}>
                      <View style={[styles.userListAvatar, {backgroundColor: '#e67e22'}]}><Text style={styles.userListAvatarText}>{(item.usuario_nombre || 'U')[0].toUpperCase()}</Text></View>
                      <View style={{ flex: 1 }}>
                            <Text style={styles.userListName}>{item.usuario_nombre || item.usuario_username}</Text>
                            <Text style={styles.userListEmail}>{item.usuario_email}</Text>
                       </View>
                       <View style={{alignItems: 'flex-end'}}>
                           <Text style={{fontWeight: 'bold', color: '#0f6d78'}}>${Number(item.monto_total).toLocaleString('en-US')}</Text>
                           <Text style={{fontSize: 11, color: '#888'}}>{item.total_pagos} Transacciones</Text>
                       </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={<Text style={styles.emptyText}>No hay pagos registrados</Text>}
                />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Pagos - Detalle por Usuario */}
      <Modal visible={showPagosDetailModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlayDark}>
          <View style={styles.detailCard}>
             <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>Reportes de Pago</Text>
                <TouchableOpacity onPress={() => setShowPagosDetailModal(false)}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
             </View>
             <ScrollView style={{maxHeight: 500}}>
                {allPayments.filter(p => p.id_usuario === selectedPaymentUser).map((p, idx) => (
                    <View key={`hist-pago-${idx}`} style={{backgroundColor: '#f9f9f9', padding: 15, borderRadius: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#e67e22'}}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5}}>
                            <Text style={{fontWeight: 'bold', color: '#333'}}>Pago #{p.id_pago}</Text>
                            <Text style={{fontWeight: 'bold', color: '#0f6d78'}}>${Number(p.monto).toLocaleString('en-US')}</Text>
                        </View>
                        <Text style={{fontSize: 13, color: '#555', marginBottom: 5}}>{p.descripcion}</Text>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <Text style={{fontSize: 11, color: '#888'}}>{new Date(p.created_at).toLocaleString()}</Text>
                            <Text style={{fontSize: 11, color: '#e67e22', fontWeight: 'bold'}}>{p.metodo_pago}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
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
  roleChip: {
    borderWidth: 1,
    borderColor: '#c8dfe9',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f4fbfd',
  },
  roleChipActive: {
    backgroundColor: '#2f7a96',
    borderColor: '#2f7a96',
  },
  roleChipText: {
    color: '#2f7a96',
    fontSize: 12,
    fontWeight: '700',
  },
  roleChipTextActive: {
    color: '#ffffff',
  },
});
