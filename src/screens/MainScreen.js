// src/screens/MainScreen.js
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCameraPermissions } from 'expo-camera';
import { BloodPressureModal } from '../components/health/BloodPressureModal';
import { HeartRateModal } from '../components/health/HeartRateModal';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { storageService } from '../services/storage/storageService';

const icon = require('../../assets/lumex.jpeg');

const ANALYSIS_TYPES = [
  { value: 'anomalias', label: 'Deteccion de anomalias', icon: 'alert-circle-outline' },
  { value: 'clasificacion', label: 'Clasificacion', icon: 'git-branch-outline' },
  { value: 'regresion', label: 'Regresion', icon: 'trending-up-outline' },
  { value: 'clustering', label: 'Clustering', icon: 'radio-button-on-outline' },
];

const MOCK_HISTORY = [
  { id: '1', name: 'Dataset_Ventas_Q1.csv', type: 'Anomalias', date: '01/04/2026', status: 'completado', anomalies: 4 },
  { id: '2', name: 'Sensor_Temp_Marzo.csv', type: 'Clasificacion', date: '28/03/2026', status: 'completado', anomalies: 0 },
  { id: '3', name: 'Logs_Acceso.txt', type: 'Anomalias', date: '25/03/2026', status: 'error', anomalies: 0 },
];

const HEALTH = {
  riesgo: 'medio',
  ultimoAnalisis: { fecha: '01/04/2026', tipo: 'Deteccion de anomalias', anomalias: 4 },
  frecuenciaCardiaca: { valor: 78, unidad: 'bpm', estado: 'normal' },
  presionArterial: { sistolica: 122, diastolica: 80, estado: 'normal' },
};

const RIESGO_META = {
  bajo: { color: '#2e9e54', bg: '#eaf7ed', label: 'Riesgo bajo', icon: 'shield-checkmark' },
  medio: { color: '#e07b21', bg: '#fef3e7', label: 'Riesgo medio', icon: 'warning' },
  alto: { color: '#e05a21', bg: '#fceee7', label: 'Riesgo alto', icon: 'alert-circle' },
};

const ESTADO_COLOR = { normal: '#2e9e54', alto: '#e05a21', bajo: '#e07b21' };
const T = '#0f6d78';
const BG = '#eaf6f5';

export default function MainScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('inicio');

  const [datasetName, setDatasetName] = useState('');
  const [datasetContent, setDatasetContent] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState('anomalias');
  const [analysisTypeOpen, setAnalysisTypeOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [heartRate, setHeartRate] = useState(HEALTH.frecuenciaCardiaca.valor);
  const [heartRateStatus, setHeartRateStatus] = useState(HEALTH.frecuenciaCardiaca.estado);
  const [bloodPressureSystolic, setBloodPressureSystolic] = useState(HEALTH.presionArterial.sistolica);
  const [bloodPressureDiastolic, setBloodPressureDiastolic] = useState(HEALTH.presionArterial.diastolica);
  const [bloodPressureStatus, setBloodPressureStatus] = useState(HEALTH.presionArterial.estado);
  const [bloodPressureMode, setBloodPressureMode] = useState('sample');
  const [isMeasuringBloodPressure, setIsMeasuringBloodPressure] = useState(false);
  const [bloodPressureSecondsLeft, setBloodPressureSecondsLeft] = useState(10);

  const [showHeartRateModal, setShowHeartRateModal] = useState(false);
  const [showBloodPressureModal, setShowBloodPressureModal] = useState(false);
  const [showUserMenuModal, setShowUserMenuModal] = useState(false);
  const [showAboutLumexModal, setShowAboutLumexModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileAge, setProfileAge] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileErrors, setProfileErrors] = useState({ age: '', phone: '' });
  const [isCameraMeasuring, setIsCameraMeasuring] = useState(false);
  const [cameraSecondsLeft, setCameraSecondsLeft] = useState(15);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();

    const getUser = async () => {
      try {
        const userData = await storageService.getUser();
        if (userData) {
          setUser(userData);
          setProfileAge(userData?.edad ? String(userData.edad) : '');
          setProfileAddress(userData?.direccion || '');
          setProfilePhone(userData?.telefono || '');
        } else {
          navigation.replace('Login');
        }
      } catch (error) {
        console.log('Error getting user:', error);
      }
    };

    getUser();
  }, [fadeAnim, navigation]);

  useEffect(() => {
    if (!isCameraMeasuring) return;
    if (cameraSecondsLeft <= 0) return;

    const countdown = setTimeout(() => {
      setCameraSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(countdown);
  }, [isCameraMeasuring, cameraSecondsLeft]);

  useEffect(() => {
    if (!isMeasuringBloodPressure) return;
    if (bloodPressureSecondsLeft <= 0) return;

    const countdown = setTimeout(() => {
      setBloodPressureSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(countdown);
  }, [isMeasuringBloodPressure, bloodPressureSecondsLeft]);

  useEffect(() => {
    if (!isCameraMeasuring) return;
    if (cameraSecondsLeft > 0) return;

    const bpm = Math.round(62 + Math.random() * 34);
    let newStatus = 'normal';
    if (bpm < 60) newStatus = 'bajo';
    if (bpm > 100) newStatus = 'alto';

    setHeartRate(bpm);
    setHeartRateStatus(newStatus);
    setIsCameraMeasuring(false);

    Alert.alert('Medicion por camara completada', `Frecuencia cardiaca estimada: ${bpm} bpm`);
  }, [isCameraMeasuring, cameraSecondsLeft]);

  useEffect(() => {
    if (!isMeasuringBloodPressure) return;
    if (bloodPressureSecondsLeft > 0) return;

    const cameraOffset = bloodPressureMode === 'camera' ? 4 : 0;
    const heartRateInfluence = Math.max(-6, Math.min(8, Math.round((heartRate - 78) / 4)));
    const systolic = Math.round(104 + Math.random() * 34 + cameraOffset + heartRateInfluence);
    const diastolic = Math.round(66 + Math.random() * 20 + Math.round(heartRateInfluence / 2));
    let newStatus = 'normal';
    if (systolic >= 140 || diastolic >= 90) newStatus = 'alto';
    else if (systolic < 90 || diastolic < 60) newStatus = 'bajo';

    setBloodPressureSystolic(systolic);
    setBloodPressureDiastolic(diastolic);
    setBloodPressureStatus(newStatus);
    setIsMeasuringBloodPressure(false);

    Alert.alert(
      bloodPressureMode === 'camera' ? 'Estimacion por camara completada' : 'Muestra completada',
      `Presion arterial estimada: ${systolic}/${diastolic} mmHg`
    );
  }, [isMeasuringBloodPressure, bloodPressureSecondsLeft, bloodPressureMode, heartRate]);

  const openHeartRateModule = () => {
    setShowHeartRateModal(true);
    setIsCameraMeasuring(false);
    setCameraSecondsLeft(15);
  };

  const closeHeartRateModal = () => {
    setIsCameraMeasuring(false);
    setShowHeartRateModal(false);
  };

  const openBloodPressureModule = () => {
    setBloodPressureMode('sample');
    setIsMeasuringBloodPressure(false);
    setBloodPressureSecondsLeft(10);
    setShowBloodPressureModal(true);
  };

  const closeBloodPressureModal = () => {
    setIsMeasuringBloodPressure(false);
    setBloodPressureMode('sample');
    setShowBloodPressureModal(false);
  };

  const startBloodPressureMeasurement = () => {
    if (bloodPressureMode === 'camera' && !cameraPermission?.granted) {
      Alert.alert('Camara no habilitada', 'Activa permisos de camara para iniciar esta estimacion.');
      return;
    }
    setBloodPressureSecondsLeft(10);
    setIsMeasuringBloodPressure(true);
  };

  const enableBloodPressureCameraMode = async () => {
    const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!permission?.granted) {
      Alert.alert('Permiso requerido', 'Debes permitir el acceso a la camara para usar esta estimacion.');
      return;
    }
    setBloodPressureMode('camera');
    setIsMeasuringBloodPressure(false);
    setBloodPressureSecondsLeft(10);
  };

  const enableHeartRateCameraMode = async () => {
    const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!permission?.granted) {
      Alert.alert('Permiso requerido', 'Debes permitir el acceso a la camara para medir por camara.');
      return;
    }
    setCameraSecondsLeft(15);
  };

  const startHeartRateCameraMeasurement = () => {
    if (!cameraPermission?.granted) {
      Alert.alert('Camara no habilitada', 'Activa permisos de camara para iniciar esta medicion.');
      return;
    }
    setCameraSecondsLeft(15);
    setIsCameraMeasuring(true);
  };

  const stopHeartRateCameraMeasurement = () => {
    setIsCameraMeasuring(false);
    setCameraSecondsLeft(15);
  };

  const stopBloodPressureMeasurement = () => {
    setIsMeasuringBloodPressure(false);
    setBloodPressureSecondsLeft(10);
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesion', 'Estas seguro de que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          try {
            await storageService.removeUser();
            navigation.replace('Login');
          } catch (error) {
            console.log('Error logging out:', error);
          }
        },
      },
    ]);
  };

  const handleAnalyze = () => {
    if (!datasetName.trim()) {
      Alert.alert('Campo requerido', 'Ingresa un nombre para el dataset.');
      return;
    }

    if (!datasetContent.trim()) {
      Alert.alert('Datos requeridos', 'Ingresa el contenido del dataset.');
      return;
    }

    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      Alert.alert(
        'Analisis completado',
        `Dataset "${datasetName}" procesado correctamente. Tipo: ${ANALYSIS_TYPES.find((a) => a.value === selectedAnalysis)?.label}`,
        [{ text: 'Ver historial', onPress: () => setActiveTab('historial') }]
      );
      setDatasetName('');
      setDatasetContent('');
    }, 1800);
  };

  const openProfileEditor = () => {
    setProfileAge(user?.edad ? String(user.edad) : '');
    setProfileAddress(user?.direccion || '');
    setProfilePhone(user?.telefono || '');
    setProfileErrors({ age: '', phone: '' });
    setIsEditingProfile(true);
  };

  const openProfileFromMenu = () => {
    setShowUserMenuModal(false);
    setActiveTab('perfil');
    setTimeout(() => {
      openProfileEditor();
    }, 150);
  };

  const openAboutFromMenu = () => {
    setShowUserMenuModal(false);
    setShowAboutLumexModal(true);
  };

  const saveProfileDetails = async () => {
    const ageValue = profileAge.trim();
    const phoneDigits = profilePhone.replace(/\D/g, '').trim();
    const errors = { age: '', phone: '' };

    if (ageValue && (!/^\d{1,3}$/.test(ageValue) || Number(ageValue) < 1 || Number(ageValue) > 120)) {
      errors.age = 'Ingresa una edad valida entre 1 y 120.';
    }

    if (phoneDigits && !/^\d{7,15}$/.test(phoneDigits)) {
      errors.phone = 'Ingresa un celular valido (7 a 15 digitos).';
    }

    if (errors.age || errors.phone) {
      setProfileErrors(errors);
      return;
    }

    setProfileErrors({ age: '', phone: '' });

    const updatedUser = {
      ...(user || {}),
      edad: ageValue ? Number(ageValue) : '',
      direccion: profileAddress.trim(),
      telefono: phoneDigits,
    };

    try {
      const saved = await storageService.saveUser(updatedUser);
      if (!saved) {
        Alert.alert('Error', 'No se pudieron guardar los datos del perfil.');
        return;
      }
      setUser(updatedUser);
      setIsEditingProfile(false);
      Alert.alert('Perfil actualizado', 'Tus datos personales se guardaron correctamente.');
    } catch (error) {
      console.log('Error saving profile details:', error);
      Alert.alert('Error', 'Ocurrio un problema al guardar tus datos.');
    }
  };

  const loadSample = () => {
    setDatasetName('Muestra_Sensores');
    setDatasetContent(
      'timestamp,temperatura,presion,humedad,estado\n' +
        '2026-01-01 08:00,22.4,1013.2,55.1,normal\n' +
        '2026-01-01 08:05,22.6,1013.0,55.3,normal\n' +
        '2026-01-01 08:10,45.9,980.1,90.0,anomalia\n' +
        '2026-01-01 08:15,22.8,1012.8,55.5,normal'
    );
  };

  const getGeneralStatus = () => {
    const hasHigh = heartRateStatus === 'alto' || bloodPressureStatus === 'alto';
    const hasLow = heartRateStatus === 'bajo' || bloodPressureStatus === 'bajo';
    const heartStatusLabel = heartRateStatus === 'alto' ? 'alta' : heartRateStatus === 'bajo' ? 'baja' : 'normal';
    const pressureStatusLabel = bloodPressureStatus === 'alto' ? 'alta' : bloodPressureStatus === 'bajo' ? 'baja' : 'normal';

    const heartSummary = `Frecuencia cardiaca: ${heartRate} bpm (${heartStatusLabel}).`;
    const pressureSummary = `Presion arterial: ${bloodPressureSystolic}/${bloodPressureDiastolic} mmHg (${pressureStatusLabel}).`;

    if (hasHigh) {
      return {
        riesgo: 'alto',
        heartSummary,
        pressureSummary,
        conclusion: 'Estado general: riesgo alto. Se recomienda control clinico cercano y repetir mediciones en reposo.',
      };
    }

    if (hasLow) {
      return {
        riesgo: 'medio',
        heartSummary,
        pressureSummary,
        conclusion: 'Estado general: riesgo medio. Hay variaciones en los signos vitales; mantente en observacion.',
      };
    }

    return {
      riesgo: 'bajo',
      heartSummary,
      pressureSummary,
      conclusion: 'Estado general: riesgo bajo. Tus signos vitales se encuentran en rango estable actualmente.',
    };
  };

  const renderInicio = () => {
    const generalStatus = getGeneralStatus();
    const riesgoMeta = RIESGO_META[generalStatus.riesgo];

    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeading}>Estado general</Text>
        <View style={[styles.estadoCard, { borderColor: riesgoMeta.color, backgroundColor: riesgoMeta.bg }]}>
          <View style={styles.estadoLeft}>
            <Ionicons name={riesgoMeta.icon} size={40} color={riesgoMeta.color} />
          </View>
          <View style={styles.estadoRight}>
            <Text style={[styles.estadoLabel, { color: riesgoMeta.color }]}>{riesgoMeta.label}</Text>
            <Text style={styles.estadoMetrics}>{generalStatus.heartSummary}</Text>
            <Text style={styles.estadoMetrics}>{generalStatus.pressureSummary}</Text>
            <Text style={styles.estadoSub}>{generalStatus.conclusion}</Text>
            <View style={[styles.riesgoPill, { backgroundColor: riesgoMeta.color }]}>
              <Text style={styles.riesgoPillText}>{generalStatus.riesgo.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Ultimo analisis realizado</Text>
          <Text style={styles.moduleDescription}>Resumen del ultimo procesamiento del usuario.</Text>
          <View style={styles.moduleList}>
            <TouchableOpacity style={styles.moduleItem} activeOpacity={0.85} onPress={() => setActiveTab('historial')}>
              <Ionicons name="calendar-outline" size={18} color="#2f7a96" />
              <Text style={styles.moduleItemText}>Fecha: {HEALTH.ultimoAnalisis.fecha}</Text>
              <Ionicons name="chevron-forward-outline" size={18} color="#7da6b7" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.moduleItem} activeOpacity={0.85} onPress={() => setActiveTab('historial')}>
              <Ionicons name="git-branch-outline" size={18} color="#2f7a96" />
              <Text style={styles.moduleItemText}>Tipo: {HEALTH.ultimoAnalisis.tipo}</Text>
              <Ionicons name="chevron-forward-outline" size={18} color="#7da6b7" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.moduleItem} activeOpacity={0.85} onPress={() => setActiveTab('historial')}>
              <Ionicons name="alert-circle-outline" size={18} color="#e07b21" />
              <Text style={styles.moduleItemText}>Anomalias detectadas: {HEALTH.ultimoAnalisis.anomalias}</Text>
              <View style={styles.moduleBadgeWarn}>
                <Text style={styles.moduleBadgeWarnText}>Atencion</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Indicadores basicos</Text>
          <Text style={styles.moduleDescription}>Indicadores clinicos principales del usuario.</Text>
          <View style={styles.moduleList}>
            <TouchableOpacity style={styles.moduleItem} activeOpacity={0.85} onPress={openHeartRateModule}>
              <Ionicons name="heart-outline" size={18} color="#2f7a96" />
              <View style={styles.moduleTextWrap}>
                <Text style={styles.moduleItemText}>Frecuencia cardiaca</Text>
                <Text style={styles.moduleMetaText}>{heartRate} {HEALTH.frecuenciaCardiaca.unidad}</Text>
              </View>
              <View style={[styles.moduleStatePill, { backgroundColor: ESTADO_COLOR[heartRateStatus] + '22' }]}>
                <Text style={[styles.moduleStatePillText, { color: ESTADO_COLOR[heartRateStatus] }]}>{heartRateStatus}</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color="#7da6b7" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.moduleItem} activeOpacity={0.85} onPress={openBloodPressureModule}>
              <Ionicons name="pulse-outline" size={18} color="#2f7a96" />
              <View style={styles.moduleTextWrap}>
                <Text style={styles.moduleItemText}>Presion arterial</Text>
                <Text style={styles.moduleMetaText}>{bloodPressureSystolic}/{bloodPressureDiastolic} mmHg</Text>
              </View>
              <View style={[styles.moduleStatePill, { backgroundColor: ESTADO_COLOR[bloodPressureStatus] + '22' }]}> 
                <Text style={[styles.moduleStatePillText, { color: ESTADO_COLOR[bloodPressureStatus] }]}>{bloodPressureStatus}</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color="#7da6b7" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderDataset = () => (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.tabPageTitle}>Ingresar dataset</Text>
        <Text style={styles.tabPageSub}>Pega o escribe tus datos en formato CSV, JSON o texto separado por comas.</Text>

        <Text style={styles.fieldLabel}>Nombre del dataset *</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="document-text-outline" size={18} color={T} style={styles.inputIcon} />
          <TextInput
            style={styles.inputField}
            placeholder="Ej: Datos_Sensor_Abril"
            placeholderTextColor="#9ab4b8"
            value={datasetName}
            onChangeText={setDatasetName}
          />
        </View>

        <Text style={styles.fieldLabel}>Tipo de analisis *</Text>
        <TouchableOpacity style={styles.selectorButton} onPress={() => setAnalysisTypeOpen((v) => !v)} activeOpacity={0.85}>
          <Ionicons
            name={ANALYSIS_TYPES.find((a) => a.value === selectedAnalysis)?.icon || 'options-outline'}
            size={18}
            color={T}
            style={styles.inputIcon}
          />
          <Text style={styles.selectorText}>{ANALYSIS_TYPES.find((a) => a.value === selectedAnalysis)?.label}</Text>
          <Ionicons name={analysisTypeOpen ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color="#4f666c" />
        </TouchableOpacity>

        {analysisTypeOpen && (
          <View style={styles.dropdownMenu}>
            {ANALYSIS_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[styles.dropdownItem, selectedAnalysis === type.value && styles.dropdownItemActive]}
                onPress={() => {
                  setSelectedAnalysis(type.value);
                  setAnalysisTypeOpen(false);
                }}
              >
                <Ionicons
                  name={type.icon}
                  size={16}
                  color={selectedAnalysis === type.value ? T : '#4f666c'}
                  style={styles.dropdownItemIcon}
                />
                <Text style={[styles.dropdownItemText, selectedAnalysis === type.value && styles.dropdownItemTextActive]}>
                  {type.label}
                </Text>
                {selectedAnalysis === type.value && <Ionicons name="checkmark-outline" size={16} color={T} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.dataHeaderRow}>
          <Text style={styles.fieldLabel}>Datos del dataset *</Text>
          <TouchableOpacity onPress={loadSample}>
            <Text style={styles.loadSampleText}>Cargar ejemplo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dataTextAreaWrap}>
          <TextInput
            style={styles.dataTextArea}
            multiline
            numberOfLines={10}
            placeholder={
              'Pega aqui tus datos en formato CSV:\n\ncol1,col2,col3\n1.0,2.5,normal\n3.2,8.1,anomalia\n...'
            }
            placeholderTextColor="#9ab4b8"
            value={datasetContent}
            onChangeText={setDatasetContent}
            textAlignVertical="top"
          />
        </View>

        <Text style={styles.dataHint}>Formatos soportados: CSV, JSON, valores separados por comas.</Text>

        <TouchableOpacity
          style={[styles.analyzeBtn, isAnalyzing && styles.analyzeBtnDisabled]}
          onPress={handleAnalyze}
          disabled={isAnalyzing}
          activeOpacity={0.85}
        >
          <Ionicons name={isAnalyzing ? 'hourglass-outline' : 'analytics-outline'} size={20} color="#fff" style={styles.analyzeIcon} />
          <Text style={styles.analyzeBtnText}>{isAnalyzing ? 'Analizando...' : 'Iniciar analisis'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderHistorial = () => (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.tabPageTitle}>Historial de analisis</Text>
      <Text style={styles.tabPageSub}>{MOCK_HISTORY.length} analisis realizados</Text>
      {MOCK_HISTORY.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.historyCard}
          activeOpacity={0.85}
          onPress={() =>
            Alert.alert(item.name, `Tipo: ${item.type}\nFecha: ${item.date}\nEstado: ${item.status}\nAnomalias: ${item.anomalies}`)
          }
        >
          <View style={[styles.historyStatusBar, { backgroundColor: item.status === 'completado' ? '#2e9e54' : '#e05a21' }]} />
          <View style={styles.historyCardBody}>
            <View style={styles.historyTop}>
              <Ionicons name="document-attach-outline" size={20} color={T} />
              <Text style={styles.historyName} numberOfLines={1}>{item.name}</Text>
            </View>
            <View style={styles.historyMeta}>
              <Text style={styles.historyMetaText}>{item.type}</Text>
              <Text style={styles.historyMetaText}>{item.date}</Text>
              <Text style={[styles.historyMetaText, { color: '#e07b21' }]}>{item.anomalies} anomalias</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward-outline" size={16} color="#9ab4b8" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderPerfil = () => (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.avatarWrap}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={44} color={T} />
        </View>
        <Text style={styles.avatarName}>{user?.nombre || user?.usuario || 'Usuario'}</Text>
        <Text style={styles.avatarEmail}>{user?.email || 'usuario@lumex.app'}</Text>
      </View>

      <Text style={styles.sectionHeading}>Informacion de cuenta</Text>
      <View style={styles.profileCard}>
        <View style={[styles.profileRow, styles.profileRowBorder]}>
          <Ionicons name="person-outline" size={18} color={T} style={styles.profileIcon} />
          <Text style={styles.profileRowValue}>Nombre: {user?.nombre || 'No especificado'}</Text>
        </View>
        <View style={[styles.profileRow, styles.profileRowBorder]}>
          <Ionicons name="at-outline" size={18} color={T} style={styles.profileIcon} />
          <Text style={styles.profileRowValue}>Usuario: {user?.usuario || 'No especificado'}</Text>
        </View>
        <View style={styles.profileRow}>
          <Ionicons name="mail-outline" size={18} color={T} style={styles.profileIcon} />
          <Text style={styles.profileRowValue}>Correo: {user?.email || 'No especificado'}</Text>
        </View>
      </View>

      <View style={styles.profileCard}>
        <View style={[styles.profileRow, styles.profileRowBorder]}>
          <Ionicons name="calendar-outline" size={18} color={T} style={styles.profileIcon} />
          <Text style={styles.profileRowValue}>Edad: {user?.edad || 'No especificado'}</Text>
        </View>
        <View style={[styles.profileRow, styles.profileRowBorder]}>
          <Ionicons name="location-outline" size={18} color={T} style={styles.profileIcon} />
          <Text style={styles.profileRowValue}>Direccion: {user?.direccion || 'No especificado'}</Text>
        </View>
        <View style={styles.profileRow}>
          <Ionicons name="call-outline" size={18} color={T} style={styles.profileIcon} />
          <Text style={styles.profileRowValue}>Celular: {user?.telefono || 'No especificado'}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.editProfileBtn} onPress={openProfileEditor} activeOpacity={0.85}>
        <Ionicons name="create-outline" size={18} color="#ffffff" style={styles.analyzeIcon} />
        <Text style={styles.editProfileBtnText}>{isEditingProfile ? 'Editando perfil...' : 'Editar perfil'}</Text>
      </TouchableOpacity>

      {isEditingProfile && (
        <View style={styles.profileEditorCard}>
          <Text style={styles.profileEditorTitle}>Editar datos personales</Text>

          <Text style={styles.fieldLabel}>Edad</Text>
          <View style={[styles.inputWrap, profileErrors.age ? styles.inputWrapError : null]}>
            <Ionicons name="calendar-outline" size={18} color={T} style={styles.inputIcon} />
            <TextInput
              style={styles.inputField}
              placeholder="Ej: 34"
              placeholderTextColor="#9ab4b8"
              value={profileAge}
              onChangeText={(text) => {
                setProfileAge(text.replace(/\D/g, ''));
                if (profileErrors.age) {
                  setProfileErrors((prev) => ({ ...prev, age: '' }));
                }
              }}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
          {!!profileErrors.age && <Text style={styles.inputErrorText}>{profileErrors.age}</Text>}

          <Text style={styles.fieldLabel}>Direccion de residencia</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="location-outline" size={18} color={T} style={styles.inputIcon} />
            <TextInput
              style={styles.inputField}
              placeholder="Ej: Calle 10 #20-30"
              placeholderTextColor="#9ab4b8"
              value={profileAddress}
              onChangeText={setProfileAddress}
            />
          </View>

          <Text style={styles.fieldLabel}>Telefono celular</Text>
          <View style={[styles.inputWrap, profileErrors.phone ? styles.inputWrapError : null]}>
            <Ionicons name="call-outline" size={18} color={T} style={styles.inputIcon} />
            <TextInput
              style={styles.inputField}
              placeholder="Ej: 3001234567"
              placeholderTextColor="#9ab4b8"
              value={profilePhone}
              onChangeText={(text) => {
                setProfilePhone(text.replace(/\D/g, ''));
                if (profileErrors.phone) {
                  setProfileErrors((prev) => ({ ...prev, phone: '' }));
                }
              }}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>
          {!!profileErrors.phone && <Text style={styles.inputErrorText}>{profileErrors.phone}</Text>}

          <View style={styles.profileEditorActions}>
            <TouchableOpacity style={[styles.modalActionBtn, styles.modalActionBtnPrimary]} onPress={saveProfileDetails} activeOpacity={0.85}>
              <Text style={styles.modalActionBtnPrimaryText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalActionBtn, styles.modalActionBtnSecondary]}
              onPress={() => {
                setProfileErrors({ age: '', phone: '' });
                setIsEditingProfile(false);
                setActiveTab('inicio');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalActionBtnSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.langRow}>
        <LanguageSelector />
      </View>
    </ScrollView>
  );

  const userName = user?.nombre || user?.usuario || 'Usuario';
  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <Animated.View style={[styles.screen, { opacity: fadeAnim }]}> 
      <View style={styles.blob1} pointerEvents="none" />
      <View style={styles.blob2} pointerEvents="none" />

      <View style={styles.header}>
        <Image source={icon} style={styles.logo} resizeMode="cover" />
        <View style={styles.headerCenter}>
          <Text style={styles.headerGreeting}>Hola, {userName.split(' ')[0]}</Text>
          <Text style={styles.headerSub}>Panel de usuario</Text>
        </View>
        <TouchableOpacity style={styles.initialsCircle} onPress={() => setShowUserMenuModal(true)} activeOpacity={0.85}>
          <Text style={styles.initialsText}>{initials}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentArea}>
        {activeTab === 'inicio' && renderInicio()}
        {activeTab === 'dataset' && renderDataset()}
        {activeTab === 'historial' && renderHistorial()}
        {activeTab === 'perfil' && renderPerfil()}
      </View>

      <View style={styles.tabBar}>
        {[
          { key: 'inicio', icon: 'home-outline', iconActive: 'home', label: 'Inicio' },
          { key: 'dataset', icon: 'cloud-upload-outline', iconActive: 'cloud-upload', label: 'Dataset' },
          { key: 'historial', icon: 'time-outline', iconActive: 'time', label: 'Historial' },
        ].map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={styles.tabBarItem} onPress={() => setActiveTab(tab.key)} activeOpacity={0.8}>
              <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
                <Ionicons name={active ? tab.iconActive : tab.icon} size={22} color={active ? T : '#7a9fa6'} />
              </View>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <HeartRateModal
        visible={showHeartRateModal}
        onClose={closeHeartRateModal}
        cameraSecondsLeft={cameraSecondsLeft}
        isCameraMeasuring={isCameraMeasuring}
        cameraPermission={cameraPermission}
        onSelectCameraMode={enableHeartRateCameraMode}
        onPrimaryAction={
          isCameraMeasuring
            ? stopHeartRateCameraMeasurement
            : startHeartRateCameraMeasurement
        }
      />

      <BloodPressureModal
        visible={showBloodPressureModal}
        onClose={closeBloodPressureModal}
        bloodPressureMode={bloodPressureMode}
        isMeasuringBloodPressure={isMeasuringBloodPressure}
        bloodPressureSecondsLeft={bloodPressureSecondsLeft}
        bloodPressureSystolic={bloodPressureSystolic}
        bloodPressureDiastolic={bloodPressureDiastolic}
        cameraPermission={cameraPermission}
        onSelectSampleMode={() => {
          setBloodPressureMode('sample');
          setIsMeasuringBloodPressure(false);
        }}
        onSelectCameraMode={enableBloodPressureCameraMode}
        onPrimaryAction={
          bloodPressureMode === 'camera' && isMeasuringBloodPressure
            ? stopBloodPressureMeasurement
            : startBloodPressureMeasurement
        }
      />

      <Modal visible={showUserMenuModal} animationType="fade" transparent onRequestClose={() => setShowUserMenuModal(false)}>
        <View style={styles.userMenuDropdownOverlay}>
          <TouchableOpacity style={styles.userMenuBackdrop} activeOpacity={1} onPress={() => setShowUserMenuModal(false)} />
          <View style={styles.userMenuDropdownCard}>
            <TouchableOpacity style={styles.userMenuItemCompact} onPress={openProfileFromMenu} activeOpacity={0.85}>
              <Ionicons name="person-circle-outline" size={18} color={T} />
              <View style={styles.userMenuItemTextWrap}>
                <Text style={styles.userMenuItemTitle}>Editar perfil</Text>
                <Text style={styles.userMenuItemDesc}>Actualiza tus datos</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.userMenuItemCompact} onPress={openAboutFromMenu} activeOpacity={0.85}>
              <Ionicons name="people-outline" size={18} color={T} />
              <View style={styles.userMenuItemTextWrap}>
                <Text style={styles.userMenuItemTitle}>Conocenos</Text>
                <Text style={styles.userMenuItemDesc}>Sobre Lumex y creadores</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.userMenuItemCompact}
              onPress={() => {
                setShowUserMenuModal(false);
                handleLogout();
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="log-out-outline" size={18} color={T} />
              <View style={styles.userMenuItemTextWrap}>
                <Text style={styles.userMenuItemTitle}>Cerrar sesion</Text>
                <Text style={styles.userMenuItemDesc}>Salir de tu cuenta actual</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showAboutLumexModal} animationType="fade" transparent onRequestClose={() => setShowAboutLumexModal(false)}>
        <View style={styles.userMenuOverlay}>
          <View style={styles.userMenuCard}>
            <Text style={styles.userMenuTitle}>Conocenos</Text>
            <Text style={styles.aboutModalText}>
              Lumex es una aplicacion orientada al seguimiento de salud y analisis de datos, disenada para que los usuarios comprendan su estado general de forma simple.
            </Text>
            <Text style={styles.aboutModalText}>
              Creadores y propietarios: Equipo Lumex. Nuestro objetivo es acercar tecnologia de analitica y bienestar a mas personas.
            </Text>

            <TouchableOpacity style={styles.userMenuCloseBtn} onPress={() => setShowAboutLumexModal(false)} activeOpacity={0.85}>
              <Text style={styles.userMenuCloseText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  blob1: {
    position: 'absolute',
    top: -80,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(15,109,120,0.08)',
  },
  blob2: {
    position: 'absolute',
    bottom: 90,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(15,109,120,0.06)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 18,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15,109,120,0.1)',
  },
  logo: {
    width: 62,
    height: 62,
    borderRadius: 31,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(15,109,120,0.2)',
    backgroundColor: '#ffffff',
  },
  headerCenter: { flex: 1 },
  headerGreeting: { fontSize: 17, fontWeight: '700', color: '#15333d' },
  headerSub: { fontSize: 12, color: '#4f666c', marginTop: 1 },
  initialsCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(15,109,120,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: { fontSize: 15, fontWeight: '700', color: T },
  userMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16,32,38,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  userMenuDropdownOverlay: {
    flex: 1,
  },
  userMenuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(16,32,38,0.2)',
  },
  userMenuDropdownCard: {
    position: 'absolute',
    top: 98,
    right: 16,
    width: 246,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d4e7ee',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  userMenuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d4e7ee',
    padding: 16,
  },
  userMenuTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#173746',
    marginBottom: 4,
  },
  userMenuSub: {
    color: '#587886',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  userMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f3fafc',
    borderWidth: 1,
    borderColor: '#deedf3',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  userMenuItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  userMenuItemTextWrap: {
    flex: 1,
  },
  userMenuItemTitle: {
    color: '#2d5b6d',
    fontSize: 13,
    fontWeight: '700',
  },
  userMenuItemDesc: {
    color: '#5d7f8e',
    fontSize: 12,
    marginTop: 1,
  },
  userMenuCloseBtn: {
    marginTop: 8,
    backgroundColor: '#2f7a96',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  userMenuCloseText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  aboutModalText: {
    color: '#325764',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  contentArea: { flex: 1, overflow: 'hidden' },
  tabContent: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 30 },
  tabPageTitle: { fontSize: 20, fontWeight: '700', color: '#15333d', marginBottom: 4 },
  tabPageSub: { fontSize: 13, color: '#4f666c', marginBottom: 18 },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15333d',
    marginTop: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  estadoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 18,
    gap: 16,
    backgroundColor: '#fff',
  },
  estadoLeft: { alignItems: 'center', justifyContent: 'center' },
  estadoRight: { flex: 1 },
  estadoLabel: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  estadoSub: { fontSize: 12, color: '#4f666c', marginBottom: 10, lineHeight: 16 },
  estadoMetrics: { fontSize: 12, color: '#2d5b6d', marginBottom: 4, fontWeight: '700' },
  riesgoPill: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  riesgoPillText: { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d4e7ee',
    padding: 14,
    marginTop: 14,
  },
  sectionTitle: {
    color: '#173746',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  moduleDescription: {
    color: '#587886',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
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
  moduleTextWrap: {
    flex: 1,
  },
  moduleMetaText: {
    color: '#5d7f8e',
    fontSize: 12,
    marginTop: 1,
  },
  moduleStatePill: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 56,
  },
  moduleStatePillText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  moduleBadgeWarn: {
    borderRadius: 999,
    backgroundColor: '#fcefdc',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  moduleBadgeWarnText: {
    color: '#a45a12',
    fontSize: 11,
    fontWeight: '700',
  },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#15333d', marginBottom: 6, marginTop: 14 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4fbfb',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(15,109,120,0.18)',
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: { marginRight: 8 },
  inputField: { flex: 1, fontSize: 14, color: '#15333d' },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4fbfb',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(15,109,120,0.18)',
    paddingHorizontal: 12,
    height: 48,
  },
  selectorText: { flex: 1, fontSize: 14, color: '#15333d' },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(15,109,120,0.15)',
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eaf6f5',
  },
  dropdownItemActive: { backgroundColor: '#f0fafb' },
  dropdownItemIcon: { marginRight: 8 },
  dropdownItemText: { fontSize: 14, color: '#4f666c', flex: 1 },
  dropdownItemTextActive: { color: T, fontWeight: '600' },
  dataHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 6 },
  loadSampleText: { fontSize: 13, color: T, fontWeight: '600' },
  dataTextAreaWrap: {
    backgroundColor: '#f4fbfb',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(15,109,120,0.18)',
    overflow: 'hidden',
  },
  dataTextArea: {
    padding: 12,
    fontSize: 13,
    color: '#15333d',
    minHeight: 170,
    maxHeight: 260,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  dataHint: { fontSize: 11, color: '#4f666c', marginTop: 6, lineHeight: 16 },
  analyzeBtn: {
    marginTop: 22,
    backgroundColor: T,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  analyzeBtnDisabled: { backgroundColor: '#7ab5bb' },
  analyzeIcon: { marginRight: 8 },
  analyzeBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  historyStatusBar: { width: 4, alignSelf: 'stretch' },
  historyCardBody: { flex: 1, padding: 12 },
  historyTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  historyName: { flex: 1, fontSize: 13, fontWeight: '700', color: '#15333d' },
  historyMeta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  historyMetaText: { fontSize: 11, color: '#4f666c' },
  avatarWrap: { alignItems: 'center', paddingVertical: 24 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#e7f4f5', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarName: { fontSize: 20, fontWeight: '700', color: '#15333d' },
  avatarEmail: { fontSize: 13, color: '#4f666c', marginTop: 4 },
  profileCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 8 },
  profileRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  profileRowBorder: { borderBottomWidth: 1, borderBottomColor: '#eaf6f5' },
  profileIcon: { marginRight: 10 },
  profileRowValue: { fontSize: 14, color: '#15333d', fontWeight: '500', flex: 1 },
  langRow: { alignItems: 'flex-start', paddingVertical: 6, marginLeft: 2 },
  editProfileBtn: {
    marginTop: 10,
    backgroundColor: '#2f7a96',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  editProfileBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  profileEditorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d4e7ee',
    padding: 14,
    marginTop: 10,
  },
  profileEditorTitle: {
    color: '#173746',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  profileEditorActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  inputWrapError: {
    borderColor: '#e05a21',
  },
  inputErrorText: {
    color: '#e05a21',
    fontSize: 12,
    marginTop: 6,
    marginBottom: 2,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 32 : 22,
    paddingTop: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15,109,120,0.12)',
  },
  tabBarItem: { flex: 1, alignItems: 'center' },
  tabIconWrap: { width: 42, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabIconWrapActive: { backgroundColor: 'rgba(15,109,120,0.1)' },
  tabLabel: { fontSize: 10, color: '#7a9fa6', marginTop: 2, fontWeight: '500' },
  tabLabelActive: { color: T, fontWeight: '700' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16,32,38,0.45)',
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
  modalCardCompact: {
    paddingBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    color: '#173746',
    fontSize: 17,
    fontWeight: '700',
  },
  modalDescription: {
    color: '#587886',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  measureModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  measureModeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f3fafc',
    borderWidth: 1,
    borderColor: '#deedf3',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  measureModeChipActive: {
    backgroundColor: '#2f7a96',
    borderColor: '#2f7a96',
  },
  measureModeText: {
    color: '#2d5b6d',
    fontSize: 12,
    fontWeight: '700',
  },
  measureModeTextActive: {
    color: '#ffffff',
  },
  measureInfoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  measureInfoItem: {
    flex: 1,
    backgroundColor: '#f3fafc',
    borderWidth: 1,
    borderColor: '#deedf3',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  measureInfoLabel: {
    color: '#5d7f8e',
    fontSize: 12,
  },
  measureInfoValue: {
    color: '#173746',
    fontSize: 20,
    fontWeight: '800',
  },
  heartTapArea: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff4f7',
    borderWidth: 1,
    borderColor: '#f3ccd5',
    borderRadius: 16,
    paddingVertical: 26,
    marginBottom: 14,
  },
  heartTapAreaDisabled: {
    backgroundColor: '#f5f8f9',
    borderColor: '#dce7eb',
  },
  heartTapText: {
    color: '#587886',
    fontSize: 13,
    marginTop: 8,
    fontWeight: '600',
  },
  heartCameraArea: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#deedf3',
    backgroundColor: '#0f1820',
    marginBottom: 14,
    height: 180,
  },
  heartCameraPreview: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8,22,28,0.55)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cameraOverlayText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  heartCameraPermissionWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f5f8f9',
  },
  cameraPermissionText: {
    color: '#5d7f8e',
    fontSize: 13,
    fontWeight: '600',
  },
  bpCameraAreaCompact: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#deedf3',
    backgroundColor: '#0f1820',
    marginBottom: 10,
    height: 132,
  },
  bpCameraPreviewCompact: {
    ...StyleSheet.absoluteFillObject,
  },
  bpCameraPermissionWrapCompact: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f5f8f9',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalActionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalActionBtnPrimary: {
    backgroundColor: '#2f7a96',
  },
  modalActionBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalActionBtnSecondary: {
    backgroundColor: '#f3fafc',
    borderWidth: 1,
    borderColor: '#deedf3',
  },
  modalActionBtnSecondaryText: {
    color: '#2d5b6d',
    fontSize: 14,
    fontWeight: '700',
  },
  bpSampleArea: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3fafc',
    borderWidth: 1,
    borderColor: '#deedf3',
    borderRadius: 14,
    paddingVertical: 20,
    marginBottom: 12,
  },
  bpInstructionsCard: {
    backgroundColor: '#f8fcfd',
    borderWidth: 1,
    borderColor: '#deedf3',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    gap: 6,
  },
  bpInstructionsTitle: {
    color: '#214b5d',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  bpInstructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bpInstructionStep: {
    width: 18,
    color: '#2f7a96',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  bpVisualGuide: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d7edf5',
    backgroundColor: '#f5fbfe',
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  bpVisualItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  bpVisualIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f5fb',
    borderWidth: 1,
    borderColor: '#c9e7f2',
  },
  bpVisualText: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 14,
    color: '#21556b',
    fontWeight: '700',
  },
  bpInstructionText: {
    flex: 1,
    color: '#4f6f7b',
    fontSize: 12,
    lineHeight: 17,
  },
  bpSampleText: {
    color: '#2d5b6d',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  bpHelpText: {
    color: '#5d7f8e',
    fontSize: 12,
    marginTop: 6,
  },
  bpCameraNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f3fafc',
    borderWidth: 1,
    borderColor: '#deedf3',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 12,
  },
  bpCameraNoteCompact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f3fafc',
    borderWidth: 1,
    borderColor: '#deedf3',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  bpCameraNoteText: {
    flex: 1,
    color: '#4f6f7b',
    fontSize: 12,
    lineHeight: 17,
  },
  bpCameraGuideCard: {
    backgroundColor: '#f8fcfd',
    borderWidth: 1,
    borderColor: '#deedf3',
    borderRadius: 12,
    padding: 10,
    gap: 6,
    marginBottom: 12,
  },
  bpCameraGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  bpCameraGuideTitle: {
    color: '#214b5d',
    fontSize: 12,
    fontWeight: '700',
  },
  bpCameraGuideText: {
    color: '#4f6f7b',
    fontSize: 12,
    lineHeight: 17,
  },
});
