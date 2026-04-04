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
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../services/supabase/supabaseClient';
import { registerUser } from '../services/supabase/authService';
import { getApiUrl } from '../services/services/api/apiConfig';

const TABS = [
  { key: 'inicio', label: 'Inicio', icon: 'home-outline' },
  { key: 'pacientes', label: 'Pacientes', icon: 'people-outline' },
  { key: 'citas', label: 'Citas', icon: 'calendar-outline' },
  { key: 'ajustes', label: 'Ajustes', icon: 'settings-outline' },
];

function ReporteGenBtn({ listo, generando, onPress }) {
  return (
    <TouchableOpacity
      style={[genBtnStyles.btn, (!listo || generando) && genBtnStyles.btnDisabled]}
      activeOpacity={0.85}
      disabled={!listo || generando}
      onPress={onPress}
    >
      <Ionicons name={generando ? 'hourglass-outline' : 'download-outline'} size={18} color="#ffffff" />
      <Text style={genBtnStyles.text}>
        {generando ? 'Generando reporte...' : 'Generar y exportar'}
      </Text>
    </TouchableOpacity>
  );
}

const genBtnStyles = {
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2f7a96',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 4,
  },
  btnDisabled: { opacity: 0.4 },
  text: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
};

export default function AdminDashboardScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('inicio');
  const [usuariosRegistrados, setUsuariosRegistrados] = useState(0);
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [showPatientModulesModal, setShowPatientModulesModal] = useState(false);
  const [citasHoy, setCitasHoy] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUserAdminModal, setShowUserAdminModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showCitasModal, setShowCitasModal] = useState(false);
  const [citasModalType, setCitasModalType] = useState(null);
  const [citasRows, setCitasRows] = useState([]);
  const [loadingCitasRows, setLoadingCitasRows] = useState(false);
  const [agendaFecha, setAgendaFecha] = useState(new Date());
  const [showAgendaDatePicker, setShowAgendaDatePicker] = useState(false);
  const [agendaPaciente, setAgendaPaciente] = useState('');
  const [agendaEmail, setAgendaEmail] = useState('');
  const [agendaCelular, setAgendaCelular] = useState('');
  const [agendaFamiliar, setAgendaFamiliar] = useState('');
  const [agendaHora, setAgendaHora] = useState('');
  const [agendaDoctor, setAgendaDoctor] = useState('');
  const [savingAgendaCita, setSavingAgendaCita] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [alertRows, setAlertRows] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [lastSystemError, setLastSystemError] = useState('');
  const [lastDataLoadError, setLastDataLoadError] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUsuario, setNewUsuario] = useState('');
  const [newTelefono, setNewTelefono] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [blockedUsers, setBlockedUsers] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRol, setEditRol] = useState('usuario');
  const [savingEdit, setSavingEdit] = useState(false);
  const [activityRows, setActivityRows] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activityUserFilter, setActivityUserFilter] = useState('');
  const [selectedActivityUser, setSelectedActivityUser] = useState('');
  const [selectedActivityReportId, setSelectedActivityReportId] = useState(null);
  const [showActivityReportDetailModal, setShowActivityReportDetailModal] = useState(false);
  const [showReportesModal, setShowReportesModal] = useState(false);
  const [reporteTipo, setReporteTipo] = useState(null);
  const [reporteFormato, setReporteFormato] = useState(null);
  const [reporteUsuario, setReporteUsuario] = useState(null);
  const [reporteDataset, setReporteDataset] = useState(null);
  const [reporteResultado, setReporteResultado] = useState(null);
  const [generandoReporte, setGenerandoReporte] = useState(false);
  const [showPickUserModal, setShowPickUserModal] = useState(false);
  const [buscarUsuario, setBuscarUsuario] = useState('');
  const [showPickDatasetModal, setShowPickDatasetModal] = useState(false);
  const [buscarDataset, setBuscarDataset] = useState('');
  const [datasetMetodo, setDatasetMetodo] = useState(null);
  const [datasetFecha, setDatasetFecha] = useState(new Date());
  const [showDatasetDatePicker, setShowDatasetDatePicker] = useState(false);
  const [showPickResultadoModal, setShowPickResultadoModal] = useState(false);
  const [buscarResultado, setBuscarResultado] = useState('');

  const resultadoOptions = [
    { id: 'diagnosticos', nombre: 'Diagnósticos', detalle: 'Resultados de valoración clínica' },
    { id: 'laboratorio', nombre: 'Laboratorio', detalle: 'Resultados de pruebas de laboratorio' },
    { id: 'imagenes', nombre: 'Imágenes médicas', detalle: 'Reportes de estudios e imágenes' },
  ];

  const formatDate = (date) => {
    if (!date) return '';
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const formatDateTime = (value) => {
    if (!value) return 'Sin datos';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return parsed.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const normalizeUserKey = (value) => {
    if (value === null || value === undefined) return '';
    const raw = String(value).trim();
    if (!raw) return '';
    const asNumber = Number(raw);
    if (Number.isFinite(asNumber)) return String(asNumber);
    return raw.toLowerCase();
  };

  const formatUserDisplayLabel = (value, fallback = 'Usuario') => {
    const raw = String(value || '').trim();
    if (!raw) return fallback;
    if (raw.includes('@')) return raw.toLowerCase();
    return raw
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const resolveAnalysisTypeLabel = (modelRow) => {
    const tipoModelo = String(modelRow?.tipo_modelo || '').toLowerCase();
    const descripcion = String(modelRow?.descripcion || '').toLowerCase();
    const nombreModelo = String(modelRow?.nombre_modelo || '').toLowerCase();
    const combined = `${tipoModelo} ${descripcion} ${nombreModelo}`;

    if (combined.includes('anomalia') || combined.includes('anomaly')) return 'Detección de anomalías';
    if (combined.includes('clustering') || combined.includes('kmeans')) return 'Clustering';
    if (combined.includes('regresion') || combined.includes('regression')) return 'Regresión';
    if (combined.includes('clasificacion') || combined.includes('classification')) return 'Clasificación';
    return 'Análisis de dataset';
  };

  const resetCreateForm = () => {
    setNewNombre('');
    setNewEmail('');
    setNewUsuario('');
    setNewTelefono('');
    setNewPassword('');
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditNombre(user?.nombre || '');
    setEditEmail(user?.email || '');
    setEditRol((user?.rol || 'usuario').toLowerCase());
    setShowEditModal(true);
  };

  const getUserId = (user) => user?._dbId ?? user?.id_usuario ?? user?.id ?? user?.uuid ?? user?.user_id ?? user?._localId ?? null;

  const getUserIdField = (user) => {
    if (user?._dbIdField) return user._dbIdField;
    if (user?.user_id !== undefined && user?.user_id !== null) return 'user_id';
    if (user?.id_usuario !== undefined && user?.id_usuario !== null) return 'id_usuario';
    if (user?.id !== undefined && user?.id !== null) return 'id';
    if (user?.uuid !== undefined && user?.uuid !== null) return 'uuid';
    return null;
  };

  const isUserBlockedFromRow = (user) => {
    if (!user || typeof user !== 'object') return false;

    const directBlockedFields = [user?.bloqueado, user?.blocked, user?.acceso_bloqueado, user?.esta_bloqueado, user?.inactivo];
    for (const raw of directBlockedFields) {
      if (raw === null || raw === undefined) continue;
      if (typeof raw === 'boolean') return raw;
      const normalized = String(raw).trim().toLowerCase();
      if (['1', 'true', 't', 'yes', 'si', 'sí', 'bloqueado', 'inactivo', 'inactive', 'blocked', 'suspendido'].includes(normalized)) return true;
      if (['0', 'false', 'f', 'no', 'activo', 'active', 'habilitado'].includes(normalized)) return false;
    }

    const enabledFields = [user?.habilitado, user?.activo];
    for (const raw of enabledFields) {
      if (raw === null || raw === undefined) continue;
      if (typeof raw === 'boolean') return !raw;
      const normalized = String(raw).trim().toLowerCase();
      if (['1', 'true', 't', 'yes', 'si', 'sí', 'activo', 'active', 'habilitado'].includes(normalized)) return false;
      if (['0', 'false', 'f', 'no', 'bloqueado', 'inactivo', 'inactive', 'blocked', 'suspendido'].includes(normalized)) return true;
    }

    const statusFields = [user?.estado_acceso, user?.estado];
    for (const raw of statusFields) {
      if (raw === null || raw === undefined) continue;
      const normalized = String(raw).trim().toLowerCase();
      if (['bloqueado', 'inactivo', 'inactive', 'blocked', 'suspendido'].includes(normalized)) return true;
      if (['activo', 'active', 'habilitado'].includes(normalized)) return false;
    }

    return false;
  };

  const getBlockedValueFromStateOrRow = (user) => {
    const userId = getUserId(user);
    if (userId !== null && typeof blockedUsers[userId] === 'boolean') {
      return blockedUsers[userId];
    }
    return isUserBlockedFromRow(user);
  };

  const tryPersistBlockedStatus = async (user, blocked) => {
    const idField = getUserIdField(user);
    const userId = getUserId(user);

    if (!idField || userId === null) {
      return { success: false, message: 'No se pudo identificar el usuario.' };
    }

    const attempts = [
      { col: 'bloqueado', value: blocked },
      { col: 'blocked', value: blocked },
      { col: 'acceso_bloqueado', value: blocked },
      { col: 'esta_bloqueado', value: blocked },
      { col: 'inactivo', value: blocked },
      { col: 'habilitado', value: !blocked },
      { col: 'activo', value: !blocked },
      { col: 'estado_acceso', value: blocked ? 'bloqueado' : 'activo' },
      { col: 'estado', value: blocked ? 'bloqueado' : 'activo' },
    ];

    let lastError = null;
    for (const attempt of attempts) {
      const { error } = await supabase
        .from('usuarios')
        .update({ [attempt.col]: attempt.value })
        .eq(idField, userId)
        .select(idField)
        .limit(1);

      if (!error) {
        return { success: true, column: attempt.col };
      }

      lastError = error;
    }

    return {
      success: false,
      message: lastError?.message || 'No se encontró una columna de bloqueo compatible en la tabla usuarios.',
    };
  };

  const deleteUserViaServer = async (user, attempts = []) => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/admin/delete-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: {
            id_usuario: user?.id_usuario ?? null,
            id: user?.id ?? null,
            uuid: user?.uuid ?? null,
            user_id: user?.user_id ?? null,
            email: user?.email ?? null,
            usuario: user?.usuario ?? null,
          },
          attempts,
        }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { success: false, message: json?.message || `Servidor respondió ${response.status}` };
      }

      return {
        success: !!json?.success,
        deletedRows: Number(json?.deletedRows || 0),
        usedField: json?.usedField || null,
        usedValue: json?.usedValue ?? null,
        message: json?.message || '',
      };
    } catch (e) {
      return { success: false, message: e?.message || 'No se pudo contactar el servidor de respaldo.' };
    }
  };

  const handleSaveUserEdit = async () => {
    if (!editingUser || savingEdit) return;

    if (!editNombre.trim() || !editEmail.trim() || !editRol.trim()) {
      Alert.alert('Datos incompletos', 'Completa nombre, correo y rol.');
      return;
    }

    setSavingEdit(true);
    try {
      const idField = getUserIdField(editingUser);
      const userId = getUserId(editingUser);

      if (!idField || userId === null) {
        Alert.alert('Error', 'No se pudo identificar el usuario a actualizar.');
        return;
      }

      const { error } = await supabase
        .from('usuarios')
        .update({
          nombre: editNombre.trim(),
          email: editEmail.trim().toLowerCase(),
          rol: editRol.trim().toLowerCase(),
        })
        .eq(idField, userId);

      if (error) {
        Alert.alert('Error', error.message || 'No se pudo actualizar el usuario.');
        return;
      }

      setShowEditModal(false);
      setEditingUser(null);
      await loadDashboardData();
      Alert.alert('Éxito', 'Usuario actualizado correctamente.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteUser = async (user) => {
    Alert.alert(
      'Eliminar usuario',
      `¿Deseas eliminar a ${user.nombre || user.usuario || 'este usuario'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const idField = getUserIdField(user);
            const userId = getUserId(user);

            if (!idField || userId === null) {
              Alert.alert('Error', 'No se pudo identificar el usuario a eliminar.');
              return;
            }

            const attempts = [];
            const pushAttempt = (field, value) => {
              if (!field || value === null || value === undefined) return;
              if (!attempts.find((a) => a.field === field && String(a.value) === String(value))) {
                attempts.push({ field, value });
              }

              // Intenta ambas variantes cuando el valor parece numérico (string/number).
              if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
                const numVal = Number(value);
                if (!Number.isNaN(numVal) && !attempts.find((a) => a.field === field && String(a.value) === String(numVal))) {
                  attempts.push({ field, value: numVal });
                }
              }
              if (typeof value === 'number') {
                const strVal = String(value);
                if (!attempts.find((a) => a.field === field && String(a.value) === strVal)) {
                  attempts.push({ field, value: strVal });
                }
              }
            };

            pushAttempt(idField, userId);
            pushAttempt('id_usuario', user?.id_usuario);
            pushAttempt('id', user?.id);
            pushAttempt('uuid', user?.uuid);
            pushAttempt('user_id', user?.user_id);
            pushAttempt('email', user?.email);
            pushAttempt('usuario', user?.usuario);

            let deletedRows = 0;
            let lastError = null;
            let usedField = idField;
            let usedValue = userId;

            for (const attempt of attempts) {
              const { data: deletedData, error } = await supabase
                .from('usuarios')
                .delete()
                .eq(attempt.field, attempt.value)
                .select('id,id_usuario,uuid,user_id');

              if (error) {
                lastError = error;
                continue;
              }

              if (Array.isArray(deletedData) && deletedData.length > 0) {
                // Verificación adicional: confirma que el registro ya no existe por el mismo criterio.
                const { data: stillThere, error: verifyError } = await supabase
                  .from('usuarios')
                  .select('*')
                  .eq(attempt.field, attempt.value)
                  .limit(1);

                if (!verifyError && (!Array.isArray(stillThere) || stillThere.length === 0)) {
                  deletedRows = deletedData.length;
                  usedField = attempt.field;
                  usedValue = attempt.value;
                  break;
                }
              }
            }

            if (deletedRows === 0) {
              // Respaldo por backend con service role (evita bloqueos por RLS desde móvil).
              const serverResult = await deleteUserViaServer(user, attempts);

              if (!(serverResult.success && serverResult.deletedRows > 0)) {
                await loadDashboardData();
                Alert.alert(
                  'No se eliminó',
                  serverResult.message || lastError?.message || 'Supabase no eliminó filas del usuario seleccionado. Verifica permisos RLS o el identificador del registro.',
                );
                return;
              }

              usedField = serverResult.usedField || usedField;
              usedValue = serverResult.usedValue ?? usedValue;
            }

            setSelectedUsuario((prev) => (prev && getUserId(prev) === userId ? null : prev));
            setBlockedUsers((prev) => {
              const next = { ...prev };
              delete next[userId];
              return next;
            });

            await loadDashboardData();
            Alert.alert(
              'Eliminación confirmada',
              `Usuario eliminado en Supabase (${usedField}: ${String(usedValue)}) y retirado de la tabla de administración.`,
            );
          }
        }
      ]
    );
  };

  const toggleBlockAccess = async (user) => {
    const userId = getUserId(user);
    if (userId === null) return;

    const currentBlocked = getBlockedValueFromStateOrRow(user);
    const nextValue = !currentBlocked;

    // Refleja el cambio de inmediato en UI.
    setBlockedUsers((prev) => ({ ...prev, [userId]: nextValue }));

    const persistResult = await tryPersistBlockedStatus(user, nextValue);
    if (!persistResult.success) {
      setBlockedUsers((prev) => ({ ...prev, [userId]: currentBlocked }));
      Alert.alert('No se pudo actualizar', persistResult.message || 'No se logró actualizar el estado de acceso.');
      return;
    }

    Alert.alert('Acceso actualizado', nextValue ? 'El usuario quedó bloqueado para iniciar sesión.' : 'El usuario fue habilitado para iniciar sesión.');
    await loadDashboardData();
  };

  const loadUserActivity = async () => {
    setLoadingActivity(true);
    try {
      const { data: usersData } = await supabase
        .from('usuarios')
        .select('id_usuario, id, uuid, user_id, nombre, usuario, email')
        .limit(500);

      const userById = new Map();
      for (const user of usersData || []) {
        const label = formatUserDisplayLabel(user?.nombre || user?.usuario || user?.email, 'Usuario');
        const ids = [user?.id_usuario, user?.id, user?.uuid, user?.user_id];
        for (const id of ids) {
          const key = normalizeUserKey(id);
          if (key) {
            userById.set(key, label);
          }
        }
      }

      // Fallback con usuarios ya cargados en el panel para evitar casos "Usuario ID X" cuando sí existe nombre.
      for (const user of usuarios || []) {
        const label = formatUserDisplayLabel(user?.nombre || user?.usuario || user?.email, 'Usuario');
        const key = normalizeUserKey(getUserId(user));
        if (key && !userById.has(key)) {
          userById.set(key, label);
        }
      }

      let analysisResult = await supabase
        .from('analisis')
        .select('id_analisis, id_usuario, id_dataset, fecha_analisis, total_registros, total_anomalias, datasets(nombre_archivo), modelos(tipo_modelo,descripcion,nombre_modelo)')
        .order('fecha_analisis', { ascending: false })
        .limit(40);

      if (analysisResult.error) {
        analysisResult = await supabase
          .from('analisis')
          .select('id_analisis, id_usuario, id_dataset, fecha_analisis, total_registros, total_anomalias')
          .order('fecha_analisis', { ascending: false })
          .limit(40);
      }

      const { data, error } = analysisResult;

      if (error || !Array.isArray(data)) {
        setActivityRows([]);
        return;
      }

      const mapped = data.map((row, idx) => {
        const totalRegistros = Number(row?.total_registros || 0);
        const totalAnomalias = Number(row?.total_anomalias || 0);
        const tasa = totalRegistros > 0 ? `${((totalAnomalias / totalRegistros) * 100).toFixed(1)}%` : '0.0%';
        const datasetName = row?.datasets?.nombre_archivo || `dataset_${row?.id_dataset || row?.id_analisis || idx}`;
        const analysisLabel = resolveAnalysisTypeLabel(row?.modelos);
        const userKey = normalizeUserKey(row?.id_usuario);
        const userLabel = userById.get(userKey) || `Usuario ID ${row?.id_usuario || 'N/D'}`;

        return {
          id: row?.id_analisis || idx,
          idAnalisis: row?.id_analisis || idx,
          idDataset: row?.id_dataset || null,
          quienKey: userKey || `unknown-${idx}`,
          quien: formatUserDisplayLabel(userLabel, 'Usuario'),
          analysisType: analysisLabel,
          consultas: `${analysisLabel} | ID análisis #${row?.id_analisis || 'N/D'}`,
          datasetName,
          datosSubio: `${datasetName} · Registros: ${totalRegistros} · Anomalías: ${totalAnomalias} · Tasa: ${tasa}`,
          totalRegistros,
          totalAnomalias,
          tasa,
          fechaRaw: row?.fecha_analisis || null,
          fechaHora: formatDateTime(row?.fecha_analisis),
        };
      });

      setActivityRows(mapped);
    } catch {
      setActivityRows([]);
    } finally {
      setLoadingActivity(false);
    }
  };

  const normalizedActivityUserFilter = activityUserFilter.trim().toLowerCase();
  const activityUsersByKey = new Map();

  for (const user of usuarios || []) {
    const key = normalizeUserKey(getUserId(user));
    if (!key) continue;
    const label = formatUserDisplayLabel(user?.nombre || user?.usuario || user?.email, `Usuario ID ${key}`);
    activityUsersByKey.set(key, { key, label });
  }

  for (const row of activityRows || []) {
    const key = normalizeUserKey(row?.quienKey);
    if (!key) continue;
    const label = formatUserDisplayLabel(row?.quien, `Usuario ID ${key}`);
    const prev = activityUsersByKey.get(key);
    if (!prev || String(prev.label).startsWith('Usuario ID')) {
      activityUsersByKey.set(key, { key, label });
    }
  }

  const activityReportCountByUserKey = new Map();
  for (const row of activityRows || []) {
    const key = normalizeUserKey(row?.quienKey);
    if (!key) continue;
    activityReportCountByUserKey.set(key, (activityReportCountByUserKey.get(key) || 0) + 1);
  }

  const activityUserOptions = Array.from(activityUsersByKey.values())
    .map((u) => ({ ...u, reportCount: activityReportCountByUserKey.get(u.key) || 0 }))
    .sort((a, b) =>
    String(a.label).localeCompare(String(b.label), 'es', { sensitivity: 'base' })
  );

  const filteredActivityUsers = normalizedActivityUserFilter
    ? activityUserOptions.filter((user) =>
        String(user.label).toLowerCase().includes(normalizedActivityUserFilter) || String(user.key).includes(normalizedActivityUserFilter)
      )
    : activityUserOptions;

  const selectedActivityRows = selectedActivityUser
    ? activityRows
        .filter((row) => normalizeUserKey(row?.quienKey) === selectedActivityUser)
        .sort((a, b) => {
          const timeA = a?.fechaRaw ? new Date(a.fechaRaw).getTime() : 0;
          const timeB = b?.fechaRaw ? new Date(b.fechaRaw).getTime() : 0;
          return timeA - timeB;
        })
    : [];

  const selectedActivityReport = selectedActivityRows.find((row) => String(row?.id) === String(selectedActivityReportId)) || null;

  const selectedActivityUserLabel = filteredActivityUsers.find((u) => u.key === selectedActivityUser)?.label
    || activityUserOptions.find((u) => u.key === selectedActivityUser)?.label
    || '';

  const loadSystemAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const rows = [];

      if (lastSystemError) {
        rows.push({
          id: 'system-error',
          level: 'alta',
          title: 'Errores en el sistema',
          detail: lastSystemError,
          possible: 'Posible causa: fallo en consulta principal de usuarios o conectividad con Supabase.',
        });
      }

      if (lastDataLoadError) {
        rows.push({
          id: 'load-error',
          level: 'media',
          title: 'Fallos en carga de datos',
          detail: lastDataLoadError,
          possible: 'Posible causa: tabla faltante, permisos de lectura o nombre de columna incorrecto.',
        });
      }

      const { data: activityData, error: activityError } = await supabase
        .from('actividad_usuarios')
        .select('consultas_realizadas, consulta, accion, activity')
        .limit(120);

      if (activityError) {
        rows.push({
          id: 'activity-read-fail',
          level: 'media',
          title: 'Fallos en carga de datos',
          detail: activityError.message || 'No se pudo leer actividad_usuarios.',
          possible: 'Posible causa: la tabla actividad_usuarios no existe o la política RLS bloquea lectura.',
        });
      } else {
        const riskCount = (activityData || []).filter((a) => {
          const text = `${a.consultas_realizadas || ''} ${a.consulta || ''} ${a.accion || ''} ${a.activity || ''}`.toLowerCase();
          return text.includes('alto riesgo') || text.includes('riesgo alto') || text.includes('high risk');
        }).length;

        if (riskCount >= 5) {
          rows.push({
            id: 'high-risk-cases',
            level: 'alta',
            title: 'Muchos casos de alto riesgo detectados',
            detail: `Se detectaron ${riskCount} eventos con referencia a alto riesgo en actividad de usuarios.`,
            possible: 'Posible causa: incremento real de casos críticos o reglas de clasificación demasiado sensibles.',
          });
        }
      }

      const incompleteUsers = (usuarios || []).filter((u) => !u.email || !u.nombre).length;
      if (incompleteUsers > 0) {
        rows.push({
          id: 'incomplete-users',
          level: 'media',
          title: 'Fallos en carga de datos',
          detail: `Se detectaron ${incompleteUsers} usuarios con datos incompletos (nombre o correo).`,
          possible: 'Posible causa: registros incompletos al crear usuarios o migraciones de datos previas.',
        });
      }

      if (rows.length === 0) {
        rows.push({
          id: 'ok',
          level: 'baja',
          title: 'Sin alertas críticas',
          detail: 'No se detectaron errores del sistema ni eventos críticos en esta revisión.',
          possible: 'Sugerencia: mantener monitoreo periódico de actividad y calidad de datos.',
        });
      }

      setAlertRows(rows);
    } catch (e) {
      setAlertRows([
        {
          id: 'unexpected',
          level: 'alta',
          title: 'Errores en el sistema',
          detail: e?.message || 'Error inesperado al construir alertas.',
          possible: 'Posible causa: excepción no controlada en el módulo de Alertas.',
        },
      ]);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const loadCitasRows = async () => {
    setLoadingCitasRows(true);
    try {
      const { data, error } = await supabase
        .from('citas')
        .select('*')
        .order('id', { ascending: false })
        .limit(80);

      if (error || !Array.isArray(data)) {
        setCitasRows([]);
        return;
      }

      const mapped = data.map((row, idx) => ({
        id: row.id || row.id_cita || idx,
        rowId: row.id || row.id_cita || null,
        rowIdField: row.id ? 'id' : (row.id_cita ? 'id_cita' : null),
        paciente: row.paciente || row.nombre_paciente || row.usuario || row.email || 'Sin datos',
        email: row.email || row.correo || row.mail || 'Sin datos',
        celular: row.celular || row.telefono || row.telefono_celular || 'Sin datos',
        celularFamiliar: row.telefono_familiar || row.celular_familiar || row.telefono_contacto || 'Sin datos',
        fecha: row.fecha || row.fecha_cita || row.created_at || 'Sin datos',
        hora: row.hora || row.hora_cita || row.time || 'Sin datos',
        estado: (row.estado || row.status || 'pendiente').toString().toLowerCase(),
      }));

      setCitasRows(mapped);
    } catch {
      setCitasRows([]);
    } finally {
      setLoadingCitasRows(false);
    }
  };

  const handleUpdateCitaEstado = async (cita, nuevoEstado) => {
    if (!cita?.rowId || !cita?.rowIdField) {
      Alert.alert('No disponible', 'No se pudo identificar esta cita para actualizar su estado.');
      return;
    }

    let query = supabase.from('citas').update({ estado: nuevoEstado });
    query = query.eq(cita.rowIdField, cita.rowId);

    const { error } = await query;
    if (error) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el estado de la cita.');
      return;
    }

    await loadCitasRows();
    Alert.alert('Estado actualizado', `La cita quedó en estado ${nuevoEstado}.`);
  };

  const handleCreateAgendaCita = async () => {
    if (savingAgendaCita) return;

    if (
      !agendaPaciente.trim() ||
      !agendaEmail.trim() ||
      !agendaCelular.trim() ||
      !agendaFamiliar.trim() ||
      !agendaHora.trim() ||
      !agendaDoctor.trim()
    ) {
      Alert.alert('Datos incompletos', 'Completa paciente, email, celular, contacto familiar, hora y doctor.');
      return;
    }

    setSavingAgendaCita(true);
    try {
      const payload = {
        paciente: agendaPaciente.trim(),
        email: agendaEmail.trim().toLowerCase(),
        celular: agendaCelular.trim(),
        telefono_familiar: agendaFamiliar.trim(),
        fecha: agendaFecha.toISOString().slice(0, 10),
        hora: agendaHora.trim(),
        doctor: agendaDoctor.trim(),
        estado: 'pendiente',
      };

      let { error } = await supabase.from('citas').insert(payload);

      // Compatibilidad: si la tabla aun no tiene columnas de contacto, guarda la cita con esquema base.
      if (error && /column .* does not exist/i.test(error.message || '')) {
        const fallbackPayload = {
          paciente: agendaPaciente.trim(),
          fecha: agendaFecha.toISOString().slice(0, 10),
          hora: agendaHora.trim(),
          doctor: agendaDoctor.trim(),
          estado: 'pendiente',
        };

        const fallbackResult = await supabase.from('citas').insert(fallbackPayload);
        error = fallbackResult.error;
      }

      if (error) {
        Alert.alert('Error', error.message || 'No se pudo agendar la cita.');
        return;
      }

      setAgendaPaciente('');
      setAgendaEmail('');
      setAgendaCelular('');
      setAgendaFamiliar('');
      setAgendaHora('');
      setAgendaDoctor('');
      await loadCitasRows();
      Alert.alert('Éxito', 'Cita agendada correctamente.');
    } finally {
      setSavingAgendaCita(false);
    }
  };

  const loadDashboardData = async () => {
    setLoadingUsuarios(true);
    try {
      let queryResult = await supabase
        .from('usuarios')
        .select('*', { count: 'exact' })
        .order('id_usuario', { ascending: false });

      // Fallbacks para esquemas con columnas distintas.
      if (queryResult.error) {
        queryResult = await supabase
          .from('usuarios')
          .select('*', { count: 'exact' })
          .order('id', { ascending: false });
      }
      if (queryResult.error) {
        queryResult = await supabase
          .from('usuarios')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });
      }
      if (queryResult.error) {
        queryResult = await supabase
          .from('usuarios')
          .select('*', { count: 'exact' });
      }

      const { data, error, count } = queryResult;

      if (error) {
        console.log('Error cargando usuarios admin:', error.message);
        setLastSystemError(error.message || 'Error desconocido al cargar usuarios.');
        setUsuarios([]);
        setUsuariosRegistrados(0);
        return;
      }

      setLastSystemError('');

      const rows = Array.isArray(data) ? data : [];
      const nonAdminRows = rows.filter((u) => {
        const normalizedRole = String(u?.rol || u?.role || '').trim().toLowerCase();
        return normalizedRole !== 'admin' && normalizedRole !== 'administrador';
      });

      const list = nonAdminRows.map((u, idx) => {
        const dbIdField =
          u?.id_usuario !== undefined && u?.id_usuario !== null ? 'id_usuario' :
          u?.id !== undefined && u?.id !== null ? 'id' :
          u?.uuid !== undefined && u?.uuid !== null ? 'uuid' :
          u?.user_id !== undefined && u?.user_id !== null ? 'user_id' :
          null;

        const dbId = dbIdField ? u[dbIdField] : null;

        return {
          ...u,
          _dbIdField: dbIdField,
          _dbId: dbId,
          _localId: `u_${idx}_${u?.email || u?.usuario || u?.username || 'sinid'}`,
          nombre: u.nombre ?? u.name ?? u.nombres ?? u.usuario ?? u.username ?? 'Usuario',
          usuario: u.usuario ?? u.username ?? u.user_name ?? u.email ?? `usuario_${idx + 1}`,
          email: u.email ?? u.correo ?? u.mail ?? 'Sin email',
        };
      });
      setUsuarios(list);
      setBlockedUsers(() => {
        const next = {};
        for (const u of list) {
          const id = getUserId(u);
          if (id !== null) next[id] = isUserBlockedFromRow(u);
        }
        return next;
      });
      setUsuariosRegistrados(list.length);
      if (list.length > 0) {
        setSelectedUsuario((prev) => {
          if (!prev) return list[0];
          const prevId = getUserId(prev);
          const stillExists = list.find((u) => getUserId(u) === prevId);
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
          setLastDataLoadError('');
        } else {
          setCitasHoy(null);
          if (citasError?.message) {
            setLastDataLoadError(citasError.message);
          }
        }
      } catch {
        setCitasHoy(null);
        setLastDataLoadError('No se pudo consultar la tabla de citas.');
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
          <Text style={styles.statLabel}>Usuarios activos</Text>
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
          <TouchableOpacity
            style={styles.quickItem}
            activeOpacity={0.85}
            onPress={() => setShowUserAdminModal(true)}
          >
            <Ionicons name="people-circle-outline" size={20} color="#2f7a96" />
            <Text style={styles.quickText}>Administración usuarios</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickItem}
            activeOpacity={0.85}
            onPress={() => {
              setReporteTipo(null);
              setReporteFormato(null);
              setReporteUsuario(null);
              setReporteDataset(null);
              setReporteResultado(null);
              setDatasetMetodo(null);
              setBuscarDataset('');
              setShowDatasetDatePicker(false);
              setDatasetFecha(new Date());
              setShowReportesModal(true);
            }}
          >
            <Ionicons name="document-text-outline" size={20} color="#2f7a96" />
            <Text style={styles.quickText}>Reportes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickItem}
            activeOpacity={0.85}
            onPress={async () => {
              setActivityUserFilter('');
              setSelectedActivityUser('');
              setSelectedActivityReportId(null);
              setShowActivityReportDetailModal(false);
              setShowActivityModal(true);
              await loadUserActivity();
            }}
          >
            <Ionicons name="reader-outline" size={20} color="#2f7a96" />
            <Text style={styles.quickText}>Actividad de Usuarios</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickItem}
            activeOpacity={0.85}
            onPress={async () => {
              setShowAlertsModal(true);
              await loadSystemAlerts();
            }}
          >
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
            const active = getUserId(selectedUsuario) === getUserId(u);
            return (
              <TouchableOpacity
                key={`pac-user-${getUserId(u)}`}
                style={[styles.userRow, active && styles.userRowActive]}
                onPress={() => {
                  setSelectedUsuario(u);
                  setShowPatientModulesModal(true);
                }}
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


    </View>
  );

  const renderCitas = () => (
    <View style={styles.actionsCard}>
      <Text style={styles.sectionTitle}>Módulo de citas</Text>
      <Text style={styles.moduleDescription}>Coordina agenda médica, disponibilidad y turnos para optimizar la atención.</Text>
      <View style={styles.moduleList}>
        <TouchableOpacity
          style={styles.moduleItem}
          activeOpacity={0.85}
          onPress={async () => {
            setCitasModalType('agenda');
            setAgendaFecha(new Date());
            setShowAgendaDatePicker(false);
            setAgendaPaciente('');
            setAgendaEmail('');
            setAgendaCelular('');
            setAgendaFamiliar('');
            setAgendaHora('');
            setAgendaDoctor('');
            setShowCitasModal(true);
            await loadCitasRows();
          }}
        >
          <Ionicons name="calendar-number-outline" size={18} color="#2f7a96" />
          <Text style={styles.moduleItemText}>Agenda diaria y semanal</Text>
          <Ionicons name="chevron-forward-outline" size={18} color="#7da6b7" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.moduleItem}
          activeOpacity={0.85}
          onPress={async () => {
            setCitasModalType('estados');
            setShowCitasModal(true);
            await loadCitasRows();
          }}
        >
          <Ionicons name="checkmark-done-outline" size={18} color="#2f7a96" />
          <Text style={styles.moduleItemText}>Confirmación de citas y estados</Text>
          <Ionicons name="chevron-forward-outline" size={18} color="#7da6b7" />
        </TouchableOpacity>
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

      <Modal
        visible={showUserAdminModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowUserAdminModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalLargeCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Administración de Usuarios</Text>
              <TouchableOpacity onPress={() => setShowUserAdminModal(false)} activeOpacity={0.85}>
                <Ionicons name="close-outline" size={24} color="#2f7a96" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubTitle}>Gestiona usuarios, roles y estado de acceso.</Text>

            <ScrollView style={styles.modalListArea} showsVerticalScrollIndicator={false}>
              {usuarios.length === 0 ? (
                <Text style={styles.emptyText}>Sin usuarios para administrar.</Text>
              ) : (
                <View style={styles.adminRowsWrap}>
                  {usuarios.slice(0, 20).map((u) => {
                    const userId = getUserId(u);
                    const blocked = getBlockedValueFromStateOrRow(u);
                    const rol = (u.rol || 'usuario').toLowerCase();

                    return (
                      <View key={`admin-row-${userId}`} style={styles.adminRowCard}>
                        <View style={styles.adminCardTop}>
                          <View style={styles.adminCardAvatar}>
                            <Ionicons name="person-circle-outline" size={36} color="#2f7a96" />
                          </View>
                          <View style={styles.adminCardInfo}>
                            <Text style={styles.adminCardName}>{u.nombre || u.usuario || 'Usuario'}</Text>
                            <Text style={styles.adminCardEmail}>{u.email || 'Sin email'}</Text>
                            <Text style={styles.adminCardUser}>{u.usuario ? `@${u.usuario}` : ''}</Text>
                          </View>
                        </View>

                        <View style={styles.adminCardBadgeRow}>
                          <View style={styles.adminRolBadge}>
                            <Ionicons name="shield-outline" size={12} color="#2f7a96" />
                            <Text style={styles.adminRolBadgeText}>{rol}</Text>
                          </View>
                          <View style={[styles.adminEstadoBadge, blocked ? styles.estadoBadgeInactivo : styles.estadoBadgeActivo]}>
                            <View style={[styles.estadoDot, blocked ? styles.estadoDotInactivo : styles.estadoDotActivo]} />
                            <Text style={[styles.adminEstadoBadgeText, blocked ? styles.estadoTextInactivo : styles.estadoTextActivo]}>
                              {blocked ? 'Inactivo' : 'Activo'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.actionEdit]}
                            onPress={() => openEditModal(u)}
                            activeOpacity={0.85}
                          >
                            <Ionicons name="create-outline" size={13} color="#2f7a96" />
                            <Text style={styles.actionEditText}>Editar</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionBtn, styles.actionBlock]}
                            onPress={() => toggleBlockAccess(u)}
                            activeOpacity={0.85}
                          >
                            <Ionicons name={blocked ? 'lock-open-outline' : 'lock-closed-outline'} size={13} color="#7a7545" />
                            <Text style={styles.actionBlockText}>{blocked ? 'Habilitar' : 'Bloquear'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showActivityModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowActivityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalLargeCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Actividad de Usuarios</Text>
              <TouchableOpacity onPress={() => setShowActivityModal(false)} activeOpacity={0.85}>
                <Ionicons name="close-outline" size={24} color="#2f7a96" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubTitle}>Registro de actividad operativa del sistema.</Text>

            <View style={styles.activitySearchWrap}>
              <Ionicons name="search-outline" size={16} color="#5d7f8d" />
              <TextInput
                style={styles.activitySearchInput}
                placeholder="Buscar por usuario"
                placeholderTextColor="#7f98a2"
                value={activityUserFilter}
                onChangeText={setActivityUserFilter}
                autoCapitalize="none"
                returnKeyType="search"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
              {activityUserFilter.trim().length > 0 && (
                <TouchableOpacity onPress={() => setActivityUserFilter('')} activeOpacity={0.8}>
                  <Ionicons name="close-circle" size={18} color="#6b8791" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.activityResultCount}>
              {selectedActivityUser
                ? `Reportes de ${selectedActivityUserLabel || 'Usuario'} (ID ${selectedActivityUser}): ${selectedActivityRows.length}`
                : `Usuarios encontrados: ${filteredActivityUsers.length}`}
            </Text>

            <ScrollView
              style={styles.activityUsersList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.activityUsersListContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {filteredActivityUsers.length === 0 ? (
                <Text style={styles.activityHint}>No hay usuarios que coincidan con el filtro.</Text>
              ) : (
                filteredActivityUsers.map((userItem) => {
                  const isActive = selectedActivityUser === userItem.key;
                  return (
                    <TouchableOpacity
                      key={`activity-user-${String(userItem.key)}`}
                      style={[styles.activityUserChip, isActive && styles.activityUserChipActive]}
                      activeOpacity={0.85}
                      onPress={() => {
                        Keyboard.dismiss();
                        setSelectedActivityUser(String(userItem.key));
                        setSelectedActivityReportId(null);
                        setShowActivityReportDetailModal(false);
                      }}
                    >
                      <Ionicons
                        name={isActive ? 'checkmark-circle-outline' : 'person-outline'}
                        size={13}
                        color={isActive ? '#ffffff' : '#2f7a96'}
                      />
                      <Text style={[styles.activityUserChipText, isActive && styles.activityUserChipTextActive]}>
                        {String(userItem.label)}
                      </Text>
                      <View style={[styles.activityUserCountChip, isActive && styles.activityUserCountChipActive]}>
                        <Text style={[styles.activityUserCountText, isActive && styles.activityUserCountTextActive]}>{userItem.reportCount}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <ScrollView
              style={styles.modalListArea}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {loadingActivity ? (
                <Text style={styles.emptyText}>Cargando actividad...</Text>
              ) : (
                <View style={styles.activityRowsWrap}>
                  {!selectedActivityUser && (
                    <Text style={styles.activityHint}>
                      Selecciona un usuario en la lista para ver sus reportes de análisis.
                    </Text>
                  )}
                  {selectedActivityUser && selectedActivityRows.length === 0 && (
                    <Text style={styles.activityHint}>Este usuario no tiene reportes de análisis registrados.</Text>
                  )}
                  {selectedActivityUser && selectedActivityRows.length > 0 && (
                    <View style={styles.activityModuleCard}>
                      <View style={styles.activityModuleHeader}>
                        <Ionicons name="calendar-outline" size={16} color="#2f7a96" />
                        <Text style={styles.activityModuleTitle}>Reportes del usuario</Text>
                      </View>
                      <Text style={styles.activityModuleSubTitle}>Total de reportes: {selectedActivityRows.length}. Selecciona uno por fecha.</Text>
                      <View style={styles.activityReportsListWrap}>
                        {selectedActivityRows.map((report, idx) => {
                          const isSelected = String(selectedActivityReportId) === String(report.id);
                          return (
                            <TouchableOpacity
                              key={`activity-report-option-${report.id}`}
                              style={[styles.activityReportOption, isSelected && styles.activityReportOptionActive]}
                              activeOpacity={0.86}
                              onPress={() => {
                                setSelectedActivityReportId(report.id);
                                setShowActivityReportDetailModal(true);
                              }}
                            >
                              <View>
                                <Text style={[styles.activityReportOptionTitle, isSelected && styles.activityReportOptionTitleActive]}>
                                  Reporte {idx + 1}
                                </Text>
                                <Text style={[styles.activityReportOptionMeta, isSelected && styles.activityReportOptionMetaActive]}>
                                  {report.analysisType}
                                </Text>
                              </View>
                              <Text style={[styles.activityReportOptionDate, isSelected && styles.activityReportOptionDateActive]}>
                                {report.fechaHora}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {selectedActivityUser && selectedActivityRows.length > 0 && !selectedActivityReport && (
                    <Text style={styles.activityHint}>Selecciona un reporte para abrir su detalle.</Text>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showActivityReportDetailModal && !!selectedActivityReport}
        animationType="fade"
        transparent
        onRequestClose={() => setShowActivityReportDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalLargeCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Detalle del Reporte</Text>
              <TouchableOpacity onPress={() => setShowActivityReportDetailModal(false)} activeOpacity={0.85}>
                <Ionicons name="close-outline" size={24} color="#2f7a96" />
              </TouchableOpacity>
            </View>

            {selectedActivityReport && (
              <ScrollView style={styles.modalListArea} showsVerticalScrollIndicator={false}>
                <View style={styles.activityRowCard}>
                  <View style={styles.activityCardHeader}>
                    <View style={styles.activityBadge}>
                      <Text style={styles.activityBadgeText}>Reporte seleccionado</Text>
                    </View>
                    <Text style={styles.activityDateChip}>{String(selectedActivityReport.fechaHora)}</Text>
                  </View>

                  <View style={styles.activityField}>
                    <View style={styles.activityLabelWrap}>
                      <Ionicons name="person-outline" size={13} color="#5d7f8d" />
                      <Text style={styles.activityLabel}>Quién ingresó</Text>
                    </View>
                    <Text style={styles.activityValue}>{selectedActivityReport.quien}</Text>
                  </View>

                  <View style={styles.activityField}>
                    <View style={styles.activityLabelWrap}>
                      <Ionicons name="analytics-outline" size={13} color="#5d7f8d" />
                      <Text style={styles.activityLabel}>Análisis seleccionado</Text>
                    </View>
                    <Text style={styles.activityValue}>{selectedActivityReport.analysisType} (ID análisis #{selectedActivityReport.idAnalisis})</Text>
                  </View>

                  <View style={styles.activityField}>
                    <View style={styles.activityLabelWrap}>
                      <Ionicons name="document-outline" size={13} color="#5d7f8d" />
                      <Text style={styles.activityLabel}>Dataset cargado</Text>
                    </View>
                    <Text style={styles.activityValue}>{selectedActivityReport.datasetName} (ID dataset: {selectedActivityReport.idDataset || 'N/D'})</Text>
                  </View>

                  <View style={styles.activityField}>
                    <View style={styles.activityLabelWrap}>
                      <Ionicons name="bar-chart-outline" size={13} color="#5d7f8d" />
                      <Text style={styles.activityLabel}>Resultado del análisis</Text>
                    </View>
                    <Text style={styles.activityValue}>Registros: {selectedActivityReport.totalRegistros} · Anomalías: {selectedActivityReport.totalAnomalias} · Tasa: {selectedActivityReport.tasa}</Text>
                  </View>

                  <View style={[styles.activityField, styles.activityFieldLast]}>
                    <View style={styles.activityLabelWrap}>
                      <Ionicons name="time-outline" size={13} color="#5d7f8d" />
                      <Text style={styles.activityLabel}>Hora y fecha</Text>
                    </View>
                    <Text style={styles.activityValue}>{String(selectedActivityReport.fechaHora)}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.activityCloseDetailButton}
                  activeOpacity={0.88}
                  onPress={() => setShowActivityReportDetailModal(false)}
                >
                  <Ionicons name="arrow-back-outline" size={16} color="#ffffff" />
                  <Text style={styles.activityCloseDetailButtonText}>Salir y volver a reportes del usuario</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAlertsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAlertsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalLargeCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Alertas del sistema</Text>
              <TouchableOpacity onPress={() => setShowAlertsModal(false)} activeOpacity={0.85}>
                <Ionicons name="close-outline" size={24} color="#2f7a96" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubTitle}>Monitoreo de riesgo clínico, errores técnicos y fallos de carga de datos.</Text>

            <ScrollView style={styles.modalListArea} showsVerticalScrollIndicator={false}>
              {loadingAlerts ? (
                <Text style={styles.emptyText}>Analizando alertas...</Text>
              ) : (
                <View style={styles.alertRowsWrap}>
                  {alertRows.map((a) => {
                    const isHigh = a.level === 'alta';
                    const isMedium = a.level === 'media';
                    return (
                      <View
                        key={a.id}
                        style={[
                          styles.alertCard,
                          isHigh && styles.alertCardHigh,
                          isMedium && styles.alertCardMedium,
                        ]}
                      >
                        <View style={styles.alertHeader}>
                          <Ionicons
                            name={isHigh ? 'warning-outline' : isMedium ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                            size={18}
                            color={isHigh ? '#b85a5a' : isMedium ? '#9a6b15' : '#2f9b6f'}
                          />
                          <Text style={styles.alertTitle}>{a.title}</Text>
                          <Text style={[styles.alertLevelChip, isHigh && styles.alertLevelHigh, isMedium && styles.alertLevelMedium]}>
                            {a.level.toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.alertDetail}>{a.detail}</Text>
                        <Text style={styles.alertPossible}>{a.possible}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPatientModulesModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPatientModulesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Módulo de paciente</Text>
              <TouchableOpacity onPress={() => setShowPatientModulesModal(false)} activeOpacity={0.85}>
                <Ionicons name="close-outline" size={24} color="#2f7a96" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubTitle}>
              {selectedUsuario
                ? `Opciones para ${selectedUsuario.nombre || selectedUsuario.usuario}`
                : 'Selecciona un usuario para ver sus opciones.'}
            </Text>

            <View style={styles.moduleList}>
              <TouchableOpacity
                style={styles.moduleItem}
                activeOpacity={0.85}
                onPress={() => {
                  if (!selectedUsuario) return;
                  setShowPatientModulesModal(false);
                  navigation.navigate('AdminPatientRecords', { user: selectedUsuario });
                }}
              >
                <Ionicons name="folder-open-outline" size={18} color="#2f7a96" />
                <Text style={styles.moduleItemText}>Historias clínicas digitalizadas</Text>
                <Ionicons name="chevron-forward-outline" size={18} color="#7da6b7" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.moduleItem}
                activeOpacity={0.85}
                onPress={() => {
                  if (!selectedUsuario) return;
                  setShowPatientModulesModal(false);
                  navigation.navigate('AdminPatientTracking', { user: selectedUsuario });
                }}
              >
                <Ionicons name="pulse-outline" size={18} color="#2f7a96" />
                <Text style={styles.moduleItemText}>Seguimiento de indicadores médicos</Text>
                <Ionicons name="chevron-forward-outline" size={18} color="#7da6b7" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.moduleItem}
                activeOpacity={0.85}
                onPress={() => {
                  if (!selectedUsuario) return;
                  setShowPatientModulesModal(false);
                  navigation.navigate('AdminPatientAccess', { user: selectedUsuario });
                }}
              >
                <Ionicons name="shield-checkmark-outline" size={18} color="#2f7a96" />
                <Text style={styles.moduleItemText}>Control de acceso por personal autorizado</Text>
                <Ionicons name="chevron-forward-outline" size={18} color="#7da6b7" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showReportesModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowReportesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalLargeCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Reportes</Text>
              <TouchableOpacity onPress={() => setShowReportesModal(false)} activeOpacity={0.85}>
                <Ionicons name="close-outline" size={24} color="#2f7a96" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubTitle}>Configura y exporta reportes del sistema clínico.</Text>

            <ScrollView showsVerticalScrollIndicator={false}>

              {/* --- Exportar análisis en --- */}
              <View style={styles.reportSection}>
                <View style={styles.reportSectionHeader}>
                  <Ionicons name="share-outline" size={16} color="#2f7a96" />
                  <Text style={styles.reportSectionTitle}>Exportar análisis en</Text>
                </View>
                <View style={styles.reportFormatoRow}>
                  {[
                    { key: 'pdf',   label: 'PDF',   icon: 'document-outline',       color: '#c0392b', bg: '#fdf2f1' },
                    { key: 'excel', label: 'Excel', icon: 'grid-outline',           color: '#1e7e45', bg: '#f0faf4' },
                  ].map((f) => {
                    const active = reporteFormato === f.key;
                    return (
                      <TouchableOpacity
                        key={f.key}
                        style={[styles.formatoCard, { backgroundColor: active ? f.color : f.bg, borderColor: active ? f.color : '#deedf3' }]}
                        activeOpacity={0.85}
                        onPress={() => setReporteFormato(active ? null : f.key)}
                      >
                        <Ionicons name={f.icon} size={28} color={active ? '#ffffff' : f.color} />
                        <Text style={[styles.formatoLabel, { color: active ? '#ffffff' : f.color }]}>{f.label}</Text>
                        {active && <Ionicons name="checkmark-circle" size={16} color="#ffffff" style={styles.formatoCheck} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* --- Reportes por --- */}
              <View style={styles.reportSection}>
                <View style={styles.reportSectionHeader}>
                  <Ionicons name="filter-outline" size={16} color="#2f7a96" />
                  <Text style={styles.reportSectionTitle}>Reportes por</Text>
                </View>
                <View style={styles.reportTipoList}>
                  {[
                    { key: 'usuario',           label: 'Usuario',           desc: 'Actividad y datos por usuario registrado.',        icon: 'person-outline' },
                    { key: 'dataset',           label: 'Dataset',           desc: 'Conjuntos de datos cargados al sistema.',           icon: 'server-outline' },
                    { key: 'resultados_medicos', label: 'Resultados médicos', desc: 'Diagnósticos, exámenes y resultados clínicos.',    icon: 'pulse-outline' },
                  ].map((t) => {
                    const active = reporteTipo === t.key;
                    return (
                      <TouchableOpacity
                        key={t.key}
                        style={[styles.tipoCard, active && styles.tipoCardActive]}
                        activeOpacity={0.85}
                        onPress={() => {
                          const next = active ? null : t.key;
                          setReporteTipo(next);
                          setReporteUsuario(null);
                          setReporteDataset(null);
                          setReporteResultado(null);
                          setDatasetMetodo(null);
                          setBuscarDataset('');
                          setShowDatasetDatePicker(false);
                        }}
                      >
                        <View style={[styles.tipoIconWrap, active && styles.tipoIconWrapActive]}>
                          <Ionicons name={t.icon} size={20} color={active ? '#ffffff' : '#2f7a96'} />
                        </View>
                        <View style={styles.tipoInfo}>
                          <Text style={[styles.tipoLabel, active && styles.tipoLabelActive]}>{t.label}</Text>
                          <Text style={[styles.tipoDesc, active && styles.tipoDescActive]}>{t.desc}</Text>
                        </View>
                        {active && <Ionicons name="checkmark-circle" size={20} color="#2f7a96" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* --- Selector de usuario (visible sólo cuando tipo = usuario) --- */}
              {reporteTipo === 'usuario' && (
                <View style={styles.reportSection}>
                  <View style={styles.reportSectionHeader}>
                    <Ionicons name="people-outline" size={16} color="#2f7a96" />
                    <Text style={styles.reportSectionTitle}>Usuario seleccionado</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.pickUserBtn}
                    activeOpacity={0.85}
                    onPress={() => { setBuscarUsuario(''); setShowPickUserModal(true); }}
                  >
                    {reporteUsuario ? (
                      <View style={styles.pickUserSelected}>
                        <View style={styles.reportUsuarioAvatar}>
                          <Ionicons name="person-outline" size={16} color="#2f7a96" />
                        </View>
                        <View style={styles.reportUsuarioInfo}>
                          <Text style={styles.reportUsuarioNombre}>
                            {reporteUsuario.nombre || reporteUsuario.usuario || 'Usuario'}
                          </Text>
                          <Text style={styles.reportUsuarioEmail}>{reporteUsuario.email || 'Sin email'}</Text>
                        </View>
                        <Ionicons name="checkmark-circle" size={20} color="#2f9b6f" />
                      </View>
                    ) : (
                      <View style={styles.pickUserPlaceholder}>
                        <Ionicons name="person-add-outline" size={18} color="#7da6b7" />
                        <Text style={styles.pickUserPlaceholderText}>Toca para seleccionar un usuario</Text>
                        <Ionicons name="chevron-forward-outline" size={16} color="#b0cdd8" />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {reporteTipo === 'dataset' && (
                <View style={styles.reportSection}>
                  <View style={styles.reportSectionHeader}>
                    <Ionicons name="server-outline" size={16} color="#2f7a96" />
                    <Text style={styles.reportSectionTitle}>Dataset seleccionado</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.pickUserBtn}
                    activeOpacity={0.85}
                    onPress={() => { setBuscarDataset(''); setShowPickDatasetModal(true); }}
                  >
                    {reporteDataset ? (
                      <View style={styles.pickUserSelected}>
                        <View style={styles.reportUsuarioAvatar}>
                          <Ionicons name="server-outline" size={16} color="#2f7a96" />
                        </View>
                        <View style={styles.reportUsuarioInfo}>
                          <Text style={styles.reportUsuarioNombre}>{reporteDataset.nombre}</Text>
                          <Text style={styles.reportUsuarioEmail}>{reporteDataset.detalle}</Text>
                        </View>
                        <Ionicons name="checkmark-circle" size={20} color="#2f9b6f" />
                      </View>
                    ) : (
                      <View style={styles.pickUserPlaceholder}>
                        <Ionicons name="add-circle-outline" size={18} color="#7da6b7" />
                        <Text style={styles.pickUserPlaceholderText}>Toca para seleccionar un dataset</Text>
                        <Ionicons name="chevron-forward-outline" size={16} color="#b0cdd8" />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {reporteTipo === 'resultados_medicos' && (
                <View style={styles.reportSection}>
                  <View style={styles.reportSectionHeader}>
                    <Ionicons name="medkit-outline" size={16} color="#2f7a96" />
                    <Text style={styles.reportSectionTitle}>Resultado médico seleccionado</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.pickUserBtn}
                    activeOpacity={0.85}
                    onPress={() => { setBuscarResultado(''); setShowPickResultadoModal(true); }}
                  >
                    {reporteResultado ? (
                      <View style={styles.pickUserSelected}>
                        <View style={styles.reportUsuarioAvatar}>
                          <Ionicons name="medkit-outline" size={16} color="#2f7a96" />
                        </View>
                        <View style={styles.reportUsuarioInfo}>
                          <Text style={styles.reportUsuarioNombre}>{reporteResultado.nombre}</Text>
                          <Text style={styles.reportUsuarioEmail}>{reporteResultado.detalle}</Text>
                        </View>
                        <Ionicons name="checkmark-circle" size={20} color="#2f9b6f" />
                      </View>
                    ) : (
                      <View style={styles.pickUserPlaceholder}>
                        <Ionicons name="add-circle-outline" size={18} color="#7da6b7" />
                        <Text style={styles.pickUserPlaceholderText}>Toca para seleccionar resultados médicos</Text>
                        <Ionicons name="chevron-forward-outline" size={16} color="#b0cdd8" />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* --- Resumen selección --- */}
              {(reporteTipo || reporteFormato) && (
                <View style={styles.reportResumen}>
                  <Ionicons name="information-circle-outline" size={15} color="#2f7a96" />
                  <Text style={styles.reportResumenText}>
                    {(() => {
                      if (!reporteTipo) return 'Selecciona el tipo de reporte.';
                      if (!reporteFormato) return 'Selecciona el formato de exportación.';
                      if (reporteTipo === 'usuario' && !reporteUsuario) return 'Selecciona el usuario para el reporte.';
                      if (reporteTipo === 'dataset' && !reporteDataset) return 'Selecciona el dataset para el reporte.';
                      if (reporteTipo === 'resultados_medicos' && !reporteResultado) return 'Selecciona el tipo de resultado médico.';
                      const tipoLabel = reporteTipo === 'resultados_medicos' ? 'resultados médicos' : reporteTipo;
                      const target =
                        reporteTipo === 'usuario'
                          ? (reporteUsuario?.nombre || reporteUsuario?.usuario || '')
                          : reporteTipo === 'dataset'
                          ? (reporteDataset?.nombre || '')
                          : reporteTipo === 'resultados_medicos'
                          ? (reporteResultado?.nombre || '')
                          : '';
                      const quien = target ? ` — ${target}` : '';
                      return `Listo para generar reporte de ${tipoLabel}${quien} en formato ${reporteFormato.toUpperCase()}.`;
                    })()}
                  </Text>
                </View>
              )}

              {/* --- Botón generar --- */}
              <ReporteGenBtn
                listo={!!(
                  reporteTipo &&
                  reporteFormato &&
                  ((reporteTipo === 'usuario' && reporteUsuario) ||
                    (reporteTipo === 'dataset' && reporteDataset) ||
                    (reporteTipo === 'resultados_medicos' && reporteResultado))
                )}
                generando={generandoReporte}
                onPress={async () => {
                  setGenerandoReporte(true);
                  await new Promise((r) => setTimeout(r, 1400));
                  setGenerandoReporte(false);
                  const tipoLabel = reporteTipo === 'resultados_medicos' ? 'resultados médicos' : reporteTipo;
                  const target =
                    reporteTipo === 'usuario'
                      ? (reporteUsuario?.nombre || reporteUsuario?.usuario || '')
                      : reporteTipo === 'dataset'
                      ? (reporteDataset?.nombre || '')
                      : reporteTipo === 'resultados_medicos'
                      ? (reporteResultado?.nombre || '')
                      : '';
                  const quien = target ? ` de ${target}` : '';
                  Alert.alert(
                    'Reporte generado',
                    `El reporte de ${tipoLabel}${quien} en ${reporteFormato.toUpperCase()} está listo.`,
                  );
                }}
              />

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* -------- Modal selección de usuario para reporte -------- */}
      <Modal
        visible={showPickUserModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPickUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalLargeCard}>

            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Seleccionar usuario</Text>
              <TouchableOpacity onPress={() => setShowPickUserModal(false)} activeOpacity={0.85}>
                <Ionicons name="close-outline" size={24} color="#2f7a96" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubTitle}>Elige el usuario para el cual deseas generar el reporte.</Text>

            {/* Buscador */}
            <View style={styles.pickUserSearchRow}>
              <Ionicons name="search-outline" size={18} color="#7da6b7" style={styles.pickUserSearchIcon} />
              <TextInput
                style={styles.pickUserSearchInput}
                placeholder="Buscar por nombre, usuario o correo..."
                placeholderTextColor="#9bbeca"
                value={buscarUsuario}
                onChangeText={setBuscarUsuario}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {buscarUsuario.length > 0 && (
                <TouchableOpacity onPress={() => setBuscarUsuario('')} activeOpacity={0.85}>
                  <Ionicons name="close-circle" size={18} color="#b0cdd8" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.modalListArea} showsVerticalScrollIndicator={false}>
              {(() => {
                const q = buscarUsuario.trim().toLowerCase();
                const filtrados = q
                  ? usuarios.filter(
                      (u) =>
                        (u.nombre || '').toLowerCase().includes(q) ||
                        (u.usuario || '').toLowerCase().includes(q) ||
                        (u.email || '').toLowerCase().includes(q),
                    )
                  : usuarios;

                if (filtrados.length === 0) {
                  return (
                    <View style={styles.pickUserEmpty}>
                      <Ionicons name="search-circle-outline" size={40} color="#c8dfe9" />
                      <Text style={styles.pickUserEmptyText}>Sin resultados para "{buscarUsuario}"</Text>
                    </View>
                  );
                }

                return filtrados.map((u) => {
                  const sel = getUserId(reporteUsuario) === getUserId(u);
                  return (
                    <TouchableOpacity
                      key={`report-user-${getUserId(u)}`}
                      style={[styles.pickUserItem, sel && styles.pickUserItemActive]}
                      activeOpacity={0.85}
                      onPress={() => {
                        setReporteUsuario(sel ? null : u);
                        setShowPickUserModal(false);
                      }}
                    >
                      <View style={[styles.pickUserItemAvatar, sel && styles.pickUserItemAvatarActive]}>
                        <Ionicons name="person-outline" size={17} color={sel ? '#ffffff' : '#2f7a96'} />
                      </View>
                      <View style={styles.reportUsuarioInfo}>
                        <Text style={[styles.reportUsuarioNombre, sel && styles.reportUsuarioNombreActive]}>
                          {u.nombre || u.usuario || 'Usuario'}
                        </Text>
                        <Text style={[styles.reportUsuarioEmail, sel && styles.reportUsuarioEmailActive]}>
                          {u.email || 'Sin email'}
                        </Text>
                        {u.usuario ? <Text style={styles.pickUserHandle}>@{u.usuario}</Text> : null}
                      </View>
                      {sel
                        ? <Ionicons name="checkmark-circle" size={22} color="#2f9b6f" />
                        : <Ionicons name="chevron-forward-outline" size={18} color="#b0cdd8" />}
                    </TouchableOpacity>
                  );
                });
              })()}
            </ScrollView>

          </View>
        </View>
      </Modal>

      {/* -------- Modal selección de dataset para reporte -------- */}
      <Modal
        visible={showPickDatasetModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPickDatasetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalLargeCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Seleccionar dataset</Text>
              <TouchableOpacity onPress={() => setShowPickDatasetModal(false)} activeOpacity={0.85}>
                <Ionicons name="close-outline" size={24} color="#2f7a96" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubTitle}>Elige cómo deseas generar el reporte: por fecha o por nombre de archivo.</Text>

            <View style={styles.datasetMethodRow}>
              <TouchableOpacity
                style={[styles.datasetMethodCard, datasetMetodo === 'fecha' && styles.datasetMethodCardActive]}
                activeOpacity={0.85}
                onPress={() => {
                  setDatasetMetodo('fecha');
                  setBuscarDataset('');
                  setReporteDataset(null);
                }}
              >
                <Ionicons name="calendar-outline" size={18} color={datasetMetodo === 'fecha' ? '#ffffff' : '#2f7a96'} />
                <Text style={[styles.datasetMethodText, datasetMetodo === 'fecha' && styles.datasetMethodTextActive]}>Por fecha</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.datasetMethodCard, datasetMetodo === 'archivo' && styles.datasetMethodCardActive]}
                activeOpacity={0.85}
                onPress={() => {
                  setDatasetMetodo('archivo');
                  setShowDatasetDatePicker(false);
                  setReporteDataset(null);
                }}
              >
                <Ionicons name="document-text-outline" size={18} color={datasetMetodo === 'archivo' ? '#ffffff' : '#2f7a96'} />
                <Text style={[styles.datasetMethodText, datasetMetodo === 'archivo' && styles.datasetMethodTextActive]}>Por nombre de archivo</Text>
              </TouchableOpacity>
            </View>

            {datasetMetodo === 'fecha' && (
              <View style={styles.datasetSelectionBlock}>
                <TouchableOpacity
                  style={styles.datasetPickBtn}
                  activeOpacity={0.85}
                  onPress={() => setShowDatasetDatePicker(true)}
                >
                  <Ionicons name="calendar-clear-outline" size={18} color="#2f7a96" />
                  <Text style={styles.datasetPickBtnText}>Elegir fecha</Text>
                  <Text style={styles.datasetPickDateText}>{formatDate(datasetFecha)}</Text>
                </TouchableOpacity>

                {showDatasetDatePicker && (
                  <DateTimePicker
                    value={datasetFecha}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatasetDatePicker(false);
                      if (!selectedDate) return;
                      setDatasetFecha(selectedDate);
                      setReporteDataset({
                        id: `fecha-${selectedDate.toISOString().slice(0, 10)}`,
                        nombre: `Fecha ${formatDate(selectedDate)}`,
                        detalle: 'Reporte generado por fecha seleccionada',
                      });
                      setShowPickDatasetModal(false);
                    }}
                  />
                )}
              </View>
            )}

            {datasetMetodo === 'archivo' && (
              <View style={styles.datasetSelectionBlock}>
                <View style={styles.pickUserSearchRow}>
                  <Ionicons name="search-outline" size={18} color="#7da6b7" style={styles.pickUserSearchIcon} />
                  <TextInput
                    style={styles.pickUserSearchInput}
                    placeholder="Buscar nombre de archivo..."
                    placeholderTextColor="#9bbeca"
                    value={buscarDataset}
                    onChangeText={setBuscarDataset}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {buscarDataset.length > 0 && (
                    <TouchableOpacity onPress={() => setBuscarDataset('')} activeOpacity={0.85}>
                      <Ionicons name="close-circle" size={18} color="#b0cdd8" />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.datasetUseBtn, !buscarDataset.trim() && styles.datasetUseBtnDisabled]}
                  disabled={!buscarDataset.trim()}
                  activeOpacity={0.85}
                  onPress={() => {
                    const fileName = buscarDataset.trim();
                    setReporteDataset({
                      id: `archivo-${fileName.toLowerCase()}`,
                      nombre: fileName,
                      detalle: 'Reporte generado por nombre de archivo',
                    });
                    setShowPickDatasetModal(false);
                  }}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color="#ffffff" />
                  <Text style={styles.datasetUseBtnText}>Usar este nombre de archivo</Text>
                </TouchableOpacity>
              </View>
            )}

            {reporteDataset && (
              <View style={styles.datasetPreview}>
                <Ionicons name="checkmark-circle" size={16} color="#2f9b6f" />
                <Text style={styles.datasetPreviewText}>Seleccionado: {reporteDataset.nombre}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* -------- Modal selección de resultados médicos para reporte -------- */}
      <Modal
        visible={showPickResultadoModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPickResultadoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalLargeCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Seleccionar resultado médico</Text>
              <TouchableOpacity onPress={() => setShowPickResultadoModal(false)} activeOpacity={0.85}>
                <Ionicons name="close-outline" size={24} color="#2f7a96" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubTitle}>Elige el tipo de resultado médico para el reporte.</Text>

            <View style={styles.pickUserSearchRow}>
              <Ionicons name="search-outline" size={18} color="#7da6b7" style={styles.pickUserSearchIcon} />
              <TextInput
                style={styles.pickUserSearchInput}
                placeholder="Buscar resultado médico..."
                placeholderTextColor="#9bbeca"
                value={buscarResultado}
                onChangeText={setBuscarResultado}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {buscarResultado.length > 0 && (
                <TouchableOpacity onPress={() => setBuscarResultado('')} activeOpacity={0.85}>
                  <Ionicons name="close-circle" size={18} color="#b0cdd8" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.modalListArea} showsVerticalScrollIndicator={false}>
              {(() => {
                const q = buscarResultado.trim().toLowerCase();
                const filtrados = q
                  ? resultadoOptions.filter(
                      (r) => r.nombre.toLowerCase().includes(q) || r.detalle.toLowerCase().includes(q),
                    )
                  : resultadoOptions;

                if (filtrados.length === 0) {
                  return (
                    <View style={styles.pickUserEmpty}>
                      <Ionicons name="search-circle-outline" size={40} color="#c8dfe9" />
                      <Text style={styles.pickUserEmptyText}>Sin resultados para "{buscarResultado}"</Text>
                    </View>
                  );
                }

                return filtrados.map((r) => {
                  const sel = reporteResultado?.id === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.pickUserItem, sel && styles.pickUserItemActive]}
                      activeOpacity={0.85}
                      onPress={() => {
                        setReporteResultado(sel ? null : r);
                        setShowPickResultadoModal(false);
                      }}
                    >
                      <View style={[styles.pickUserItemAvatar, sel && styles.pickUserItemAvatarActive]}>
                        <Ionicons name="medkit-outline" size={17} color={sel ? '#ffffff' : '#2f7a96'} />
                      </View>
                      <View style={styles.reportUsuarioInfo}>
                        <Text style={[styles.reportUsuarioNombre, sel && styles.reportUsuarioNombreActive]}>{r.nombre}</Text>
                        <Text style={[styles.reportUsuarioEmail, sel && styles.reportUsuarioEmailActive]}>{r.detalle}</Text>
                      </View>
                      {sel
                        ? <Ionicons name="checkmark-circle" size={22} color="#2f9b6f" />
                        : <Ionicons name="chevron-forward-outline" size={18} color="#b0cdd8" />}
                    </TouchableOpacity>
                  );
                });
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCitasModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCitasModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalLargeCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Gestión de citas</Text>
              <TouchableOpacity onPress={() => setShowCitasModal(false)} activeOpacity={0.85}>
                <Ionicons name="close-outline" size={24} color="#2f7a96" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubTitle}>
              {citasModalType === 'agenda'
                ? 'Agenda diaria y semanal del servicio clínico.'
                : 'Seguimiento de confirmaciones y estado de citas.'}
            </Text>

            <>
              {citasModalType === 'agenda' && (
                <View style={styles.agendaFormCard}>
                  <TouchableOpacity
                    style={styles.agendaDateBtn}
                    activeOpacity={0.85}
                    onPress={() => setShowAgendaDatePicker(true)}
                  >
                    <Ionicons name="calendar-clear-outline" size={18} color="#2f7a96" />
                    <Text style={styles.agendaDateBtnLabel}>Fecha de la cita</Text>
                    <Text style={styles.agendaDateBtnValue}>{formatDate(agendaFecha)}</Text>
                  </TouchableOpacity>

                  {showAgendaDatePicker && (
                    <DateTimePicker
                      value={agendaFecha}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowAgendaDatePicker(false);
                        if (selectedDate) setAgendaFecha(selectedDate);
                      }}
                    />
                  )}

                  <TextInput
                    style={styles.agendaInput}
                    placeholder="Usuario o persona que agenda la cita"
                    placeholderTextColor="#8aaab6"
                    value={agendaPaciente}
                    onChangeText={setAgendaPaciente}
                  />
                  <TextInput
                    style={styles.agendaInput}
                    placeholder="Email"
                    placeholderTextColor="#8aaab6"
                    value={agendaEmail}
                    onChangeText={setAgendaEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={styles.agendaInput}
                    placeholder="Número de celular"
                    placeholderTextColor="#8aaab6"
                    value={agendaCelular}
                    onChangeText={setAgendaCelular}
                    keyboardType="phone-pad"
                  />
                  <TextInput
                    style={styles.agendaInput}
                    placeholder="Número de otro familiar"
                    placeholderTextColor="#8aaab6"
                    value={agendaFamiliar}
                    onChangeText={setAgendaFamiliar}
                    keyboardType="phone-pad"
                  />
                  <TextInput
                    style={styles.agendaInput}
                    placeholder="Hora (ejemplo: 09:30)"
                    placeholderTextColor="#8aaab6"
                    value={agendaHora}
                    onChangeText={setAgendaHora}
                  />
                  <TextInput
                    style={styles.agendaInput}
                    placeholder="Doctor que realizará la consulta"
                    placeholderTextColor="#8aaab6"
                    value={agendaDoctor}
                    onChangeText={setAgendaDoctor}
                  />

                  <TouchableOpacity
                    style={[styles.agendaSaveBtn, savingAgendaCita && styles.reportGenBtnDisabled]}
                    activeOpacity={0.85}
                    onPress={handleCreateAgendaCita}
                    disabled={savingAgendaCita}
                  >
                    <Ionicons name="save-outline" size={16} color="#ffffff" />
                    <Text style={styles.agendaSaveBtnText}>{savingAgendaCita ? 'Guardando...' : 'Agendar cita'}</Text>
                  </TouchableOpacity>
                </View>
              )}

              <ScrollView style={styles.modalListArea} showsVerticalScrollIndicator={false}>
                {loadingCitasRows ? (
                  <Text style={styles.emptyText}>Cargando citas...</Text>
                ) : (
                  <View style={styles.citasRowsWrap}>
                    {(citasRows.length > 0
                      ? citasRows.slice(0, 20)
                      : citasModalType === 'estados'
                      ? [{
                          id: 'cita-estado-empty',
                          paciente: 'Sin datos',
                          email: 'Sin datos',
                          celular: 'Sin datos',
                          celularFamiliar: 'Sin datos',
                          fecha: 'Sin datos',
                          hora: 'Sin datos',
                          estado: 'pendiente',
                        }]
                      : []).map((c) => (
                      <View key={`cita-${c.id}`} style={styles.citaRowCard}>
                        <View style={styles.citaRowTop}>
                          <Text style={styles.citaPaciente}>{c.paciente}</Text>
                          <Text style={styles.citaEstado}>{c.estado}</Text>
                        </View>
                        <Text style={styles.citaMeta}>Fecha: {String(c.fecha)}</Text>
                        <Text style={styles.citaMeta}>Hora: {String(c.hora)}</Text>

                        {citasModalType === 'estados' && (
                          <>
                            <View style={styles.citaInfoDivider} />
                            <Text style={styles.citaMeta}><Text style={styles.citaMetaStrong}>Email:</Text> {c.email}</Text>
                            <Text style={styles.citaMeta}><Text style={styles.citaMetaStrong}>Núm. celular:</Text> {c.celular}</Text>
                            <Text style={styles.citaMeta}><Text style={styles.citaMetaStrong}>Núm. familiar:</Text> {c.celularFamiliar}</Text>

                            <View style={styles.citaActionsRow}>
                              <TouchableOpacity
                                style={[styles.citaActionBtn, styles.citaActionContinue, c.id === 'cita-estado-empty' && styles.citaActionBtnDisabled]}
                                activeOpacity={0.85}
                                onPress={() => handleUpdateCitaEstado(c, 'confirmada')}
                                disabled={c.id === 'cita-estado-empty'}
                              >
                                <Ionicons name="checkmark-circle-outline" size={14} color="#2f9b6f" />
                                <Text style={styles.citaActionContinueText}>Sigue con cita</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[styles.citaActionBtn, styles.citaActionCancel, c.id === 'cita-estado-empty' && styles.citaActionBtnDisabled]}
                                activeOpacity={0.85}
                                onPress={() => handleUpdateCitaEstado(c, 'cancelada')}
                                disabled={c.id === 'cita-estado-empty'}
                              >
                                <Ionicons name="close-circle-outline" size={14} color="#b85a5a" />
                                <Text style={styles.citaActionCancelText}>Cancelar cita</Text>
                              </TouchableOpacity>
                            </View>
                          </>
                        )}
                      </View>
                    ))}

                    {citasRows.length === 0 && citasModalType !== 'estados' && (
                      <Text style={styles.emptyText}>Sin datos de citas.</Text>
                    )}
                  </View>
                )}
              </ScrollView>
            </>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar usuario</Text>
            <Text style={styles.modalSubTitle}>Actualiza nombre, correo y rol.</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nombre"
              placeholderTextColor="#7a9aa8"
              value={editNombre}
              onChangeText={setEditNombre}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Correo"
              placeholderTextColor="#7a9aa8"
              value={editEmail}
              onChangeText={setEditEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.modalRoleLabel}>Rol</Text>
            <View style={styles.rolesRow}>
              {['admin', 'medico', 'usuario'].map((rolOpt) => {
                const active = editRol === rolOpt;
                return (
                  <TouchableOpacity
                    key={rolOpt}
                    style={[styles.roleChip, active && styles.roleChipActive]}
                    onPress={() => setEditRol(rolOpt)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.roleChipText, active && styles.roleChipTextActive]}>{rolOpt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, savingEdit && styles.modalButtonDisabled]}
                onPress={handleSaveUserEdit}
                activeOpacity={0.85}
                disabled={savingEdit}
              >
                <Text style={styles.modalButtonText}>{savingEdit ? 'Guardando...' : 'Guardar cambios'}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    color: '#587886',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  statValue: {
    color: '#193f4f',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
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
    justifyContent: 'space-between',
    rowGap: 10,
  },
  quickItem: {
    width: '48%',
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
  adminHeaderRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  adminHeaderText: {
    color: '#5d7f8d',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  adminRowsWrap: {
    gap: 9,
  },
  activityHeaderRow: {
    flexDirection: 'row',
    marginTop: 2,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  activityHeaderText: {
    color: '#5d7f8d',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  activityRowsWrap: {
    gap: 10,
  },
  activitySearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f8fa',
    borderWidth: 1,
    borderColor: '#d9eaf1',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
    marginBottom: 6,
    gap: 7,
  },
  activitySearchInput: {
    flex: 1,
    color: '#214b5d',
    fontSize: 13,
    paddingVertical: 0,
  },
  activityResultCount: {
    color: '#5d7f8d',
    fontSize: 12,
    marginBottom: 8,
  },
  activityUsersList: {
    marginBottom: 10,
    maxHeight: 132,
  },
  activityUsersListContent: {
    gap: 7,
    paddingRight: 2,
  },
  activityUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    width: '100%',
    borderWidth: 1,
    borderColor: '#cfe4ec',
    backgroundColor: '#eff7fa',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  activityUserChipActive: {
    borderColor: '#2f7a96',
    backgroundColor: '#2f7a96',
  },
  activityUserChipText: {
    flex: 1,
    color: '#2f7a96',
    fontSize: 12,
    fontWeight: '700',
  },
  activityUserChipTextActive: {
    color: '#ffffff',
  },
  activityUserCountChip: {
    backgroundColor: '#d9ebf2',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  activityUserCountChipActive: {
    backgroundColor: '#1d5f77',
  },
  activityUserCountText: {
    color: '#2f7a96',
    fontSize: 11,
    fontWeight: '800',
  },
  activityUserCountTextActive: {
    color: '#ffffff',
  },
  activityRowCard: {
    borderWidth: 1,
    borderColor: '#d9eaf1',
    backgroundColor: '#fbfeff',
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2f7a96',
    shadowColor: '#123746',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  activityModuleCard: {
    borderWidth: 1,
    borderColor: '#d9eaf1',
    backgroundColor: '#f8fcfd',
    borderRadius: 12,
    padding: 10,
  },
  activityModuleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  activityModuleTitle: {
    color: '#1d4d5f',
    fontSize: 13,
    fontWeight: '800',
  },
  activityModuleSubTitle: {
    color: '#5d7f8d',
    fontSize: 12,
    marginBottom: 8,
  },
  activityReportsListWrap: {
    gap: 7,
  },
  activityReportOption: {
    borderWidth: 1,
    borderColor: '#d3e5ec',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  activityReportOptionActive: {
    borderColor: '#2f7a96',
    backgroundColor: '#e8f4f9',
  },
  activityReportOptionTitle: {
    color: '#1f4f62',
    fontSize: 12,
    fontWeight: '800',
  },
  activityReportOptionTitleActive: {
    color: '#14546b',
  },
  activityReportOptionMeta: {
    color: '#5f7f8d',
    fontSize: 11,
  },
  activityReportOptionMetaActive: {
    color: '#2f7a96',
  },
  activityReportOptionDate: {
    color: '#5f7f8d',
    fontSize: 11,
    fontWeight: '700',
  },
  activityReportOptionDateActive: {
    color: '#2f7a96',
  },
  activityCloseDetailButton: {
    marginTop: 12,
    backgroundColor: '#2f7a96',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  activityCloseDetailButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  colQuien: {
    flex: 1,
  },
  colConsultas: {
    flex: 1.2,
  },
  colSubio: {
    flex: 1.1,
  },
  colFecha: {
    flex: 1,
  },
  adminRowCard: {
    borderWidth: 1,
    borderColor: '#deedf3',
    backgroundColor: '#f8fcfd',
    borderRadius: 12,
    padding: 10,
  },
  adminDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adminDataText: {
    color: '#214b5d',
    fontSize: 12,
  },
  colNombre: {
    flex: 1.2,
    paddingRight: 4,
  },
  colEmail: {
    flex: 1.4,
    paddingRight: 4,
  },
  colRol: {
    flex: 0.8,
    textAlign: 'center',
    paddingRight: 4,
  },
  colEstado: {
    flex: 0.8,
    textAlign: 'center',
  },
  estadoActivo: {
    color: '#2f9b6f',
    fontWeight: '700',
  },
  estadoInactivo: {
    color: '#b85a5a',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adminCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  adminCardAvatar: {
    marginRight: 10,
  },
  adminCardInfo: {
    flex: 1,
  },
  adminCardName: {
    color: '#173746',
    fontSize: 14,
    fontWeight: '700',
  },
  adminCardEmail: {
    color: '#587886',
    fontSize: 12,
    marginTop: 2,
  },
  adminCardUser: {
    color: '#8aaab6',
    fontSize: 11,
    marginTop: 1,
  },
  adminCardBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  adminRolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e8f4f9',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  adminRolBadgeText: {
    color: '#2f7a96',
    fontSize: 11,
    fontWeight: '700',
  },
  adminEstadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  estadoBadgeActivo: {
    backgroundColor: '#e2f4ed',
  },
  estadoBadgeInactivo: {
    backgroundColor: '#f9ebeb',
  },
  estadoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  estadoDotActivo: {
    backgroundColor: '#2f9b6f',
  },
  estadoDotInactivo: {
    backgroundColor: '#b85a5a',
  },
  adminEstadoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  estadoTextActivo: {
    color: '#2f9b6f',
  },
  estadoTextInactivo: {
    color: '#b85a5a',
  },
  activityField: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#edf4f7',
  },
  activityFieldLast: {
    borderBottomWidth: 0,
  },
  activityLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  activityLabel: {
    color: '#4f7281',
    fontSize: 12,
    fontWeight: '700',
  },
  activityValue: {
    color: '#214b5d',
    fontSize: 13,
    lineHeight: 19,
    paddingLeft: 18,
  },
  activityHint: {
    color: '#7a9aaa',
    fontSize: 12,
    marginBottom: 6,
  },
  activityCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  activityBadge: {
    backgroundColor: '#e8f4f9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activityBadgeText: {
    color: '#2f7a96',
    fontSize: 11,
    fontWeight: '700',
  },
  activityDateChip: {
    color: '#6d8d9a',
    fontSize: 11,
    fontWeight: '600',
  },
  reportSection: {
    marginBottom: 18,
  },
  reportSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  reportSectionTitle: {
    color: '#173746',
    fontSize: 14,
    fontWeight: '700',
  },
  reportFormatoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formatoCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  formatoLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  formatoCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  reportTipoList: {
    gap: 10,
  },
  tipoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#deedf3',
    borderRadius: 14,
    backgroundColor: '#f8fcfd',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tipoCardActive: {
    borderColor: '#2f7a96',
    backgroundColor: '#eaf5fa',
  },
  tipoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#e8f4f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipoIconWrapActive: {
    backgroundColor: '#2f7a96',
  },
  tipoInfo: {
    flex: 1,
  },
  tipoLabel: {
    color: '#173746',
    fontSize: 13,
    fontWeight: '700',
  },
  tipoLabelActive: {
    color: '#1b5f79',
  },
  tipoDesc: {
    color: '#7da6b7',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  tipoDescActive: {
    color: '#4a7f94',
  },
  reportResumen: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#e8f4f9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  reportResumenText: {
    flex: 1,
    color: '#2f7a96',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  reportGenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2f7a96',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 4,
  },
  reportGenBtnDisabled: {
    opacity: 0.4,
  },
  reportGenBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  reportUsuarioList: {
    gap: 8,
  },
  reportUsuarioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#deedf3',
    borderRadius: 12,
    backgroundColor: '#f8fcfd',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  reportUsuarioRowActive: {
    borderColor: '#2f7a96',
    backgroundColor: '#eaf5fa',
  },
  reportUsuarioAvatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#e8f4f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportUsuarioAvatarActive: {
    backgroundColor: '#2f7a96',
  },
  reportUsuarioInfo: {
    flex: 1,
  },
  reportUsuarioNombre: {
    color: '#173746',
    fontSize: 13,
    fontWeight: '700',
  },
  reportUsuarioNombreActive: {
    color: '#1b5f79',
  },
  reportUsuarioEmail: {
    color: '#7da6b7',
    fontSize: 11,
    marginTop: 2,
  },
  reportUsuarioEmailActive: {
    color: '#4a7f94',
  },
  pickUserBtn: {
    borderWidth: 1.5,
    borderColor: '#deedf3',
    borderRadius: 14,
    backgroundColor: '#f8fcfd',
    overflow: 'hidden',
  },
  pickUserSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  pickUserPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  pickUserPlaceholderText: {
    flex: 1,
    color: '#7da6b7',
    fontSize: 13,
  },
  pickUserSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#d4e7ee',
    borderRadius: 12,
    backgroundColor: '#f4fbfd',
    paddingHorizontal: 10,
    marginBottom: 10,
    gap: 6,
  },
  pickUserSearchIcon: {
    flexShrink: 0,
  },
  pickUserSearchInput: {
    flex: 1,
    paddingVertical: 11,
    color: '#20495a',
    fontSize: 14,
  },
  pickUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#deedf3',
    borderRadius: 12,
    backgroundColor: '#f8fcfd',
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  pickUserItemActive: {
    borderColor: '#2f7a96',
    backgroundColor: '#eaf5fa',
  },
  pickUserItemAvatar: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#e8f4f9',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pickUserItemAvatarActive: {
    backgroundColor: '#2f7a96',
  },
  pickUserHandle: {
    color: '#8aaab6',
    fontSize: 11,
    marginTop: 2,
  },
  pickUserEmpty: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 8,
  },
  pickUserEmptyText: {
    color: '#8aaab6',
    fontSize: 13,
    textAlign: 'center',
  },
  datasetMethodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  datasetMethodCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#c8dfe9',
    borderRadius: 12,
    backgroundColor: '#f4fbfd',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  datasetMethodCardActive: {
    backgroundColor: '#2f7a96',
    borderColor: '#2f7a96',
  },
  datasetMethodText: {
    color: '#2f7a96',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  datasetMethodTextActive: {
    color: '#ffffff',
  },
  datasetSelectionBlock: {
    marginBottom: 10,
  },
  datasetPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d4e7ee',
    borderRadius: 12,
    backgroundColor: '#f4fbfd',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  datasetPickBtnText: {
    color: '#2f7a96',
    fontSize: 13,
    fontWeight: '700',
  },
  datasetPickDateText: {
    marginLeft: 'auto',
    color: '#173746',
    fontSize: 13,
    fontWeight: '700',
  },
  datasetUseBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2f7a96',
    borderRadius: 12,
    paddingVertical: 11,
  },
  datasetUseBtnDisabled: {
    opacity: 0.45,
  },
  datasetUseBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  datasetPreview: {
    marginTop: 2,
    backgroundColor: '#ecfaf3',
    borderWidth: 1,
    borderColor: '#ccebdc',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  datasetPreviewText: {
    color: '#2f9b6f',
    fontSize: 12,
    fontWeight: '700',
  },
  alertRowsWrap: {
    gap: 10,
  },
  alertCard: {
    borderWidth: 1,
    borderColor: '#deedf3',
    backgroundColor: '#f8fcfd',
    borderRadius: 12,
    padding: 10,
  },
  alertCardHigh: {
    borderColor: '#f0c6c6',
    backgroundColor: '#fff6f6',
  },
  alertCardMedium: {
    borderColor: '#f1dfb7',
    backgroundColor: '#fffaf0',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  alertTitle: {
    flex: 1,
    color: '#173746',
    fontSize: 13,
    fontWeight: '700',
  },
  alertLevelChip: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2f9b6f',
    backgroundColor: '#e2f4ed',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  alertLevelHigh: {
    color: '#b85a5a',
    backgroundColor: '#f9e7e7',
  },
  alertLevelMedium: {
    color: '#9a6b15',
    backgroundColor: '#fff2d8',
  },
  alertDetail: {
    color: '#214b5d',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 4,
  },
  alertPossible: {
    color: '#5d7f8d',
    fontSize: 11,
    lineHeight: 16,
  },
  citasMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  citasMetricCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#deedf3',
    backgroundColor: '#f8fcfd',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  citasMetricLabel: {
    color: '#5d7f8d',
    fontSize: 11,
    marginBottom: 4,
  },
  citasMetricValue: {
    color: '#173746',
    fontSize: 20,
    fontWeight: '800',
  },
  citasRowsWrap: {
    gap: 8,
  },
  citaRowCard: {
    borderWidth: 1,
    borderColor: '#deedf3',
    borderRadius: 12,
    backgroundColor: '#f8fcfd',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  citaRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  citaPaciente: {
    flex: 1,
    color: '#173746',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 8,
  },
  citaEstado: {
    color: '#2f7a96',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  citaMeta: {
    color: '#5d7f8d',
    fontSize: 12,
    lineHeight: 17,
  },
  citaMetaStrong: {
    color: '#173746',
    fontWeight: '700',
  },
  citaInfoDivider: {
    height: 1,
    backgroundColor: '#e6f1f5',
    marginVertical: 8,
  },
  citaActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  citaActionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  citaActionBtnDisabled: {
    opacity: 0.45,
  },
  citaActionContinue: {
    backgroundColor: '#e7f6ee',
    borderWidth: 1,
    borderColor: '#cbe9d8',
  },
  citaActionCancel: {
    backgroundColor: '#fdeeee',
    borderWidth: 1,
    borderColor: '#f3cece',
  },
  citaActionContinueText: {
    color: '#2f9b6f',
    fontSize: 12,
    fontWeight: '700',
  },
  citaActionCancelText: {
    color: '#b85a5a',
    fontSize: 12,
    fontWeight: '700',
  },
  agendaFormCard: {
    borderWidth: 1,
    borderColor: '#deedf3',
    backgroundColor: '#f8fcfd',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  agendaDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#d4e7ee',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  agendaDateBtnLabel: {
    color: '#2f7a96',
    fontSize: 12,
    fontWeight: '700',
  },
  agendaDateBtnValue: {
    marginLeft: 'auto',
    color: '#173746',
    fontSize: 12,
    fontWeight: '700',
  },
  agendaInput: {
    borderWidth: 1,
    borderColor: '#d4e7ee',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: '#20495a',
    fontSize: 13,
    marginBottom: 8,
  },
  agendaSaveBtn: {
    marginTop: 2,
    borderRadius: 10,
    backgroundColor: '#2f7a96',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  agendaSaveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  actionEdit: {
    backgroundColor: '#e8f4f9',
  },
  actionDelete: {
    backgroundColor: '#f9ebeb',
  },
  actionBlock: {
    backgroundColor: '#f3f2e8',
  },
  actionEditText: {
    color: '#2f7a96',
    fontSize: 12,
    fontWeight: '700',
  },
  actionDeleteText: {
    color: '#b35a5a',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBlockText: {
    color: '#7a7545',
    fontSize: 12,
    fontWeight: '700',
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
  modalLargeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d4e7ee',
    padding: 16,
    maxHeight: '82%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalListArea: {
    marginTop: 6,
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
  modalRoleLabel: {
    color: '#587886',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 2,
  },
  rolesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
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
