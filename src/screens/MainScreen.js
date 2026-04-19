// src/screens/MainScreen.js
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { BloodPressureModal } from '../components/health/BloodPressureModal';
import { HeartRateModal } from '../components/health/HeartRateModal';
import { storageService } from '../services/storage/storageService';
import { Toast } from '../components/common/Toast';
import {
  fetchAnalysisHistoryByUser,
  isDatasetFileSupported,
  parseDatasetContent,
  readDatasetAsset,
  saveAnalysis
} from '../services/api/datasetAnalysisService';
import { 
  registerPayment, 
  consumeAnalysisCredit 
} from '../services/api/paymentService';
import { 
  fetchLatestUserData 
} from '../services/api/authService';

const icon = require('../../assets/lumex.jpeg');
const alexPhoto = require('../../assets/Alexander.jpg');
const lunaPhoto = require('../../assets/luna.jpeg');

const ANALYSIS_TYPES = [
  { value: 'anomalias', label: 'Deteccion de anomalias', icon: 'alert-circle-outline' },
  { value: 'clasificacion', label: 'Clasificacion', icon: 'git-branch-outline' },
  { value: 'regresion', label: 'Regresion', icon: 'trending-up-outline' },
  { value: 'clustering', label: 'Clustering', icon: 'radio-button-on-outline' },
];

const ANALYSIS_VISUALS = {
  anomalias: {
    title: 'Deteccion de anomalias',
    subtitle: 'Encuentra comportamientos fuera de patron y prioriza alertas clinicas.',
    focus: 'Enfoque: variaciones atipicas frente al comportamiento esperado.',
    tip: 'Ideal cuando no tienes etiquetas claras y necesitas detectar riesgo temprano.',
    imageUri: 'https://images.unsplash.com/photo-1576671081837-49000212a370?auto=format&fit=crop&w=1200&q=80',
  },
  clasificacion: {
    title: 'Clasificacion',
    subtitle: 'Asigna cada registro a una clase clinica definida.',
    focus: 'Enfoque: decision por categoria (normal, sospechoso, critico).',
    tip: 'Util cuando ya conoces categorias objetivo para cada muestra.',
    imageUri: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=1200&q=80',
  },
  regresion: {
    title: 'Regresion',
    subtitle: 'Estima valores continuos para apoyar pronostico y seguimiento.',
    focus: 'Enfoque: prediccion numerica (ej: valor esperado de una medicion).',
    tip: 'Recomendado para proyecciones de tendencia y evolucion temporal.',
    imageUri: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
  },
  clustering: {
    title: 'Clustering',
    subtitle: 'Agrupa registros similares para descubrir perfiles ocultos.',
    focus: 'Enfoque: segmentacion automatica por similitud de comportamiento.',
    tip: 'Util para explorar subgrupos de pacientes sin etiquetas previas.',
    imageUri: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
  },
};

const VISUALIZATION_OPTIONS = [
  {
    value: 'matriz_correlacion',
    label: 'Matriz de correlacion',
    icon: 'grid-outline',
    detail: 'Vista de relaciones entre variables para identificar patrones de correlacion.',
  },
  {
    value: 'histograma',
    label: 'Histograma',
    icon: 'stats-chart-outline',
    detail: 'Distribucion de frecuencias para entender concentraciones y dispersion.',
  },
  {
    value: 'dispersion',
    label: 'Dispersion',
    icon: 'share-social-outline',
    detail: 'Relacion entre dos variables para observar tendencias y valores atipicos.',
  },
  {
    value: 'boxplot',
    label: 'Boxplot',
    icon: 'albums-outline',
    detail: 'Resumen estadistico con cuartiles, mediana y posibles outliers.',
  },
];

const HEALTH = {
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

const formatDate = (isoDate) => {
  if (!isoDate) return '-';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateTime = (isoDate) => {
  if (!isoDate) return '-';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const formatAnalysisLabel = (analysisType) => {
  const match = ANALYSIS_TYPES.find((item) => item.value === analysisType);
  if (match) return match.label;

  const normalized = String(analysisType || '').trim();
  if (!normalized) return 'Analisis';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const getAnalysisVisual = (analysisType) => {
  return ANALYSIS_VISUALS[analysisType] || ANALYSIS_VISUALS.anomalias;
};

const getVisualizationOption = (visualizationType) => {
  return VISUALIZATION_OPTIONS.find((item) => item.value === visualizationType) || VISUALIZATION_OPTIONS[0];
};

const FIXED_ANALYSIS_TYPE = 'anomalias';

const QUICKCHART_URL = 'https://quickchart.io/chart';

const getNumericColumns = (parsedDataset) => {
  const headers = Array.isArray(parsedDataset?.headers) ? parsedDataset.headers : [];
  const rows = Array.isArray(parsedDataset?.rows) ? parsedDataset.rows : [];

  return headers
    .map((header) => {
      const values = rows
        .map((row) => Number(String(row?.[header] ?? '').replace(',', '.')))
        .filter((value) => Number.isFinite(value));

      return { header, values };
    })
    .filter((item) => item.values.length > 0);
};

const quantile = (sortedValues, q) => {
  if (!sortedValues.length) return 0;
  const pos = (sortedValues.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sortedValues[base + 1] ?? sortedValues[base];
  return sortedValues[base] + rest * (next - sortedValues[base]);
};

const buildVisualizationChartConfig = (parsedDataset, visualizationType) => {
  const numericCols = getNumericColumns(parsedDataset);
  if (!numericCols.length) return null;

  const first = numericCols[0];
  const second = numericCols[1] || numericCols[0];

  if (visualizationType === 'histograma') {
    const values = [...first.values].sort((a, b) => a - b);
    const bins = 8;
    const min = values[0];
    const max = values[values.length - 1];
    const step = max === min ? 1 : (max - min) / bins;
    const counts = new Array(bins).fill(0);

    values.forEach((value) => {
      const idx = Math.min(bins - 1, Math.floor((value - min) / step));
      counts[idx] += 1;
    });

    const labels = counts.map((_, idx) => {
      const start = min + (step * idx);
      const end = start + step;
      return `${start.toFixed(1)}-${end.toFixed(1)}`;
    });

    return {
      type: 'bar',
      data: { labels, datasets: [{ label: `Histograma ${first.header}`, data: counts, backgroundColor: '#2f7a96' }] },
      options: { plugins: { legend: { display: false }, title: { display: true, text: 'Histograma' } } },
    };
  }

  if (visualizationType === 'dispersion') {
    const points = [];
    const limit = Math.min(first.values.length, second.values.length, 80);
    for (let i = 0; i < limit; i += 1) {
      points.push({ x: first.values[i], y: second.values[i] });
    }

    return {
      type: 'scatter',
      data: { datasets: [{ label: `${first.header} vs ${second.header}`, data: points, backgroundColor: '#0f6d78' }] },
      options: { plugins: { title: { display: true, text: 'Grafico de dispersion' } } },
    };
  }

  if (visualizationType === 'boxplot') {
    const sorted = [...first.values].sort((a, b) => a - b);
    const min = sorted[0];
    const q1 = quantile(sorted, 0.25);
    const median = quantile(sorted, 0.5);
    const q3 = quantile(sorted, 0.75);
    const max = sorted[sorted.length - 1];

    return {
      type: 'line',
      data: {
        labels: ['Min', 'Q1', 'Mediana', 'Q3', 'Max'],
        datasets: [{
          label: `Resumen ${first.header}`,
          data: [min, q1, median, q3, max],
          borderColor: '#4f9db8',
          backgroundColor: 'rgba(79,157,184,0.2)',
          pointBackgroundColor: '#0d607a',
          pointRadius: 4,
          fill: true,
          tension: 0.2,
        }],
      },
      options: { plugins: { legend: { display: false }, title: { display: true, text: 'Resumen tipo boxplot' } } },
    };
  }

  const baseValues = first.values;
  const labels = [];
  const correlations = [];

  numericCols.slice(0, 8).forEach((col) => {
    const size = Math.min(baseValues.length, col.values.length);
    const xs = baseValues.slice(0, size);
    const ys = col.values.slice(0, size);
    const meanX = xs.reduce((sum, v) => sum + v, 0) / (size || 1);
    const meanY = ys.reduce((sum, v) => sum + v, 0) / (size || 1);
    const cov = xs.reduce((sum, x, i) => sum + ((x - meanX) * (ys[i] - meanY)), 0) / (size || 1);
    const stdX = Math.sqrt(xs.reduce((sum, x) => sum + ((x - meanX) ** 2), 0) / (size || 1)) || 1;
    const stdY = Math.sqrt(ys.reduce((sum, y) => sum + ((y - meanY) ** 2), 0) / (size || 1)) || 1;
    const corr = cov / (stdX * stdY);
    labels.push(col.header);
    correlations.push(Number(corr.toFixed(3)));
  });

  return {
    type: 'radar',
    data: {
      labels,
      datasets: [{
        label: `Correlacion con ${first.header}`,
        data: correlations,
        borderColor: '#1b5f79',
        backgroundColor: 'rgba(27,95,121,0.22)',
        pointBackgroundColor: '#1b5f79',
      }],
    },
    options: { plugins: { title: { display: true, text: 'Matriz de correlacion (resumen)' } } },
  };
};

const buildVisualizationImageUri = (parsedDataset, visualizationType) => {
  const chartConfig = buildVisualizationChartConfig(parsedDataset, visualizationType);
  if (!chartConfig) return null;
  return `${QUICKCHART_URL}?width=720&height=360&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
};

const buildSummaryVisualizationImageUri = (visualizationType, totalRegistros, totalAnomalias) => {
  const total = Math.max(1, Number(totalRegistros || 0));
  const anomalies = Math.max(0, Math.min(total, Number(totalAnomalias || 0)));
  const normal = Math.max(0, total - anomalies);
  const anomalyRate = anomalies / total;

  if (visualizationType === 'histograma') {
    const chartConfig = {
      type: 'bar',
      data: {
        labels: ['Registros normales', 'Registros con anomalia'],
        datasets: [{ data: [normal, anomalies], backgroundColor: ['#2f7a96', '#e05a21'] }],
      },
      options: { plugins: { legend: { display: false }, title: { display: true, text: 'Histograma de resultado' } } },
    };
    return `${QUICKCHART_URL}?width=720&height=360&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
  }

  if (visualizationType === 'dispersion') {
    const chartConfig = {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Distribucion analisis',
          data: [{ x: normal, y: anomalies }, { x: total, y: Math.round(anomalyRate * 100) }],
          backgroundColor: '#0f6d78',
        }],
      },
      options: { plugins: { title: { display: true, text: 'Dispersion del resultado' } } },
    };
    return `${QUICKCHART_URL}?width=720&height=360&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
  }

  if (visualizationType === 'boxplot') {
    const q1 = normal * 0.25;
    const median = normal * 0.5;
    const q3 = normal * 0.75;
    const chartConfig = {
      type: 'line',
      data: {
        labels: ['Min', 'Q1', 'Mediana', 'Q3', 'Max'],
        datasets: [{
          data: [0, q1, median, q3, total],
          borderColor: '#4f9db8',
          backgroundColor: 'rgba(79,157,184,0.2)',
          pointBackgroundColor: '#0d607a',
          fill: true,
          tension: 0.2,
        }],
      },
      options: { plugins: { legend: { display: false }, title: { display: true, text: 'Boxplot del resultado' } } },
    };
    return `${QUICKCHART_URL}?width=720&height=360&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
  }

  const chartConfig = {
    type: 'radar',
    data: {
      labels: ['Registros', 'Anomalias', 'Normales', 'Tasa de anomalia'],
      datasets: [{
        data: [total, anomalies, normal, Math.round(anomalyRate * 100)],
        borderColor: '#1b5f79',
        backgroundColor: 'rgba(27,95,121,0.22)',
        pointBackgroundColor: '#1b5f79',
      }],
    },
    options: { plugins: { legend: { display: false }, title: { display: true, text: 'Matriz de correlacion (resumen)' } } },
  };

  return `${QUICKCHART_URL}?width=720&height=360&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
};

const getSummaryVisualizationUri = (summary) => {
  if (!summary) return null;
  return (
    summary.visualizationImageUri
    || buildSummaryVisualizationImageUri(
      summary.visualizationType,
      summary.totalRegistros,
      summary.totalAnomalias
    )
  );
};

const FINDINGS_VISUALS = {
  bajo: {
    label: 'Hallazgos bajos',
    imageUri: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80',
    summary: 'Se detectaron pocas anomalias frente al total de registros.',
    guidance: 'Mantener monitoreo periodico y validar tendencias en el tiempo.',
    color: '#2e9e54',
    bg: '#eaf7ed',
  },
  medio: {
    label: 'Hallazgos moderados',
    imageUri: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
    summary: 'Existe una proporcion relevante de anomalias en el dataset.',
    guidance: 'Revisar subgrupos y variables con mayor variacion para descartar riesgo.',
    color: '#e07b21',
    bg: '#fef3e7',
  },
  alto: {
    label: 'Hallazgos altos',
    imageUri: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1200&q=80',
    summary: 'Se detecto alta concentracion de anomalias sobre los registros analizados.',
    guidance: 'Se recomienda revision prioritaria y correlacion con signos clinicos.',
    color: '#e05a21',
    bg: '#fceee7',
  },
};

const getFindingsVisual = (summary) => {
  const total = Number(summary?.totalRegistros || 0);
  const anomalies = Number(summary?.totalAnomalias || 0);

  if (!total || total <= 0) return FINDINGS_VISUALS.bajo;

  const ratio = anomalies / total;
  if (ratio >= 0.3) return FINDINGS_VISUALS.alto;
  if (ratio >= 0.1) return FINDINGS_VISUALS.medio;
  return FINDINGS_VISUALS.bajo;
};

const getFindingsVisualFromCounts = (totalRegistros, totalAnomalias) => {
  return getFindingsVisual({ totalRegistros, totalAnomalias });
};

const getFindingsRateText = (totalRegistros, totalAnomalias) => {
  const total = Number(totalRegistros || 0);
  const anomalies = Number(totalAnomalias || 0);
  if (!total || total <= 0) return '-';
  return `${((anomalies / total) * 100).toFixed(1)}%`;
};

export default function MainScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('inicio');
  const [availableCredits, setAvailableCredits] = useState(0);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  // Toast Config
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };
  
  // Estados para flujo de pago
  const [paymentStep, setPaymentStep] = useState('plans'); // 'plans', 'confirm', 'methods'
  const [pendingPlan, setPendingPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);

  const [datasetName, setDatasetName] = useState('');
  const [datasetContent, setDatasetContent] = useState('');
  const [selectedDatasetMeta, setSelectedDatasetMeta] = useState(null);
  const [parsedDataset, setParsedDataset] = useState(null);
  const [isPickingCsv, setIsPickingCsv] = useState(false);
  const [selectedVisualization, setSelectedVisualization] = useState('matriz_correlacion');
  const [visualizationOpen, setVisualizationOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysisResultModal, setShowAnalysisResultModal] = useState(false);
  const [analysisResultSummary, setAnalysisResultSummary] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
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
  const [showContactModal, setShowContactModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileAge, setProfileAge] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileErrors, setProfileErrors] = useState({ age: '', phone: '' });
  const [isCameraMeasuring, setIsCameraMeasuring] = useState(false);
  const [cameraSecondsLeft, setCameraSecondsLeft] = useState(15);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('pdf');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const analysisExportCardRef = useRef(null);

  const currentUserId = Number(user?.id_usuario ?? user?.id ?? null);

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

          const userId = Number(userData?.id_usuario ?? userData?.id ?? null);
          if (Number.isInteger(userId)) {
            loadHistory(userId);
            // Sincronizar créditos
            fetchLatestUserData(userId).then(latestData => {
              if (latestData) setAvailableCredits(latestData.analisis_disponibles || 0);
            });
          }
        } else {
          navigation.replace('Login');
        }
      } catch (error) {
        console.log('Error getting user:', error);
      }
    };

    getUser();
  }, [fadeAnim, navigation]);

  const loadHistory = async (userIdParam) => {
    const safeUserId = Number(userIdParam);
    if (!Number.isInteger(safeUserId)) return;

    try {
      setIsLoadingHistory(true);
      const history = await fetchAnalysisHistoryByUser(safeUserId);
      setAnalysisHistory(history);
    } catch (error) {
      console.log('Error loading analysis history:', error);
      triggerToast('No se pudo actualizar el historial de analisis.', 'error');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const downloadResultAsImage = async () => {
    try {
      setIsDownloadingReport(true);

      if (!analysisExportCardRef.current) {
        triggerToast('No se pudo preparar el reporte para exportar.', 'error');
        return;
      }

      const chartUri = getSummaryVisualizationUri(analysisResultSummary);
      if (chartUri) {
        try {
          await Image.prefetch(chartUri);
        } catch (prefetchError) {
          console.log('No se pudo precargar la imagen de grafica:', prefetchError);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 180));

      const downloadedUri = await captureRef(analysisExportCardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        backgroundColor: '#ffffff',
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(downloadedUri, {
          mimeType: 'image/png',
          dialogTitle: 'Guardar imagen del informe',
          UTI: 'public.png',
        });
      } else {
        triggerToast('La opcion de compartir no esta disponible.', 'error');
      }
    } catch (e) {
      console.log('Error descargando imagen:', e);
      triggerToast('No se pudo descargar la imagen del resultado.', 'error');
    } finally {
      setIsDownloadingReport(false);
    }
  };

  const downloadResultAsPdf = async () => {
    try {
      setIsDownloadingReport(true);
      const summary = analysisResultSummary;
      const findings = getFindingsVisual(summary);
      const tasa = summary?.totalRegistros
        ? ((Number(summary.totalAnomalias || 0) / Number(summary.totalRegistros || 1)) * 100).toFixed(1) + '%'
        : '-';

      // Obtener la URI del gráfico de visualización
      const chartUri =
        summary?.visualizationImageUri ||
        buildSummaryVisualizationImageUri(
          summary?.visualizationType,
          summary?.totalRegistros,
          summary?.totalAnomalias
        );

      // Convertir la imagen del gráfico a base64 usando fetch + arrayBuffer
      // (más confiable que FileSystem.downloadAsync para URLs externas en React Native)
      let chartBase64Html = '';
      if (chartUri) {
        try {
          const fetchResp = await fetch(chartUri);
          if (fetchResp.ok) {
            const buffer = await fetchResp.arrayBuffer();
            const uint8 = new Uint8Array(buffer);
            let binary = '';
            const chunkSize = 8192;
            for (let i = 0; i < uint8.length; i += chunkSize) {
              const chunk = uint8.subarray(i, Math.min(i + chunkSize, uint8.length));
              binary += String.fromCharCode(...chunk);
            }
            const base64 = btoa(binary);
            chartBase64Html = `
              <div class="chart-section">
                <p class="chart-title">Grafica de visualizacion: ${summary?.visualizationLabel || ''}</p>
                <img src="data:image/png;base64,${base64}" class="chart-img" />
              </div>
            `;
          } else {
            console.log('[PDF] QuickChart respondio con status:', fetchResp.status);
          }
        } catch (imgErr) {
          console.log('[PDF] No se pudo cargar la imagen del grafico:', imgErr?.message);
        }
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8"/>
            <style>
              body { font-family: Arial, sans-serif; padding: 28px; color: #1a3a4a; background: #f6fcfd; }
              h1 { color: #0f6d78; font-size: 22px; margin: 0 0 4px 0; }
              .subtitle { font-size: 13px; color: #4f7f8c; margin: 0 0 4px 0; }
              .badge { display: inline-block; background: ${findings.bg}; color: ${findings.color}; border-radius: 20px; padding: 4px 16px; font-size: 13px; font-weight: bold; margin: 12px 0 10px 0; border: 1px solid ${findings.color}55; }
              .summary-text { font-size: 14px; margin-bottom: 8px; }
              .guidance-text { font-size: 13px; color: #4f7f8c; margin-bottom: 16px; }
              table { width: 100%; border-collapse: collapse; margin-top: 4px; margin-bottom: 16px; }
              th, td { padding: 10px 14px; border: 1px solid #ddeef3; text-align: left; font-size: 13px; }
              th { background: #e8f6f8; font-weight: 700; color: #0f6d78; width: 40%; }
              .metrics { display: flex; gap: 12px; margin-bottom: 16px; }
              .metric { flex: 1; background: #ffffff; border-radius: 10px; padding: 14px; text-align: center; border: 1px solid #ddeef3; }
              .metric-val { font-size: 26px; font-weight: 800; color: #0f6d78; }
              .metric-label { font-size: 11px; color: #4f7f8c; margin-top: 4px; }
              .chart-section { margin: 16px 0; padding: 14px; background: #ffffff; border-radius: 12px; border: 1px solid #ddeef3; }
              .chart-title { font-size: 12px; font-weight: 700; color: #0f6d78; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px; }
              .chart-img { width: 100%; max-width: 520px; display: block; margin: 0 auto; border-radius: 8px; }
              .footer { margin-top: 20px; font-size: 11px; color: #7a99a4; border-top: 1px solid #ddeef3; padding-top: 10px; text-align: center; }
              .divider { border: none; border-top: 1px solid #ddeef3; margin: 14px 0; }
            </style>
          </head>
          <body>
            <h1>Resultado del analisis</h1>
            <p class="subtitle">Generado por Lumex App</p>
            <hr class="divider"/>
            <div class="badge">${findings.label}</div>
            <p class="summary-text">${findings.summary}</p>
            <p class="guidance-text">${findings.guidance}</p>
            ${chartBase64Html}
            <table>
              <tr><th>Tipo de analisis</th><td>${summary?.selectedAnalysisLabel || '-'}</td></tr>
              <tr><th>Dataset</th><td>${summary?.datasetName || '-'}</td></tr>
              <tr><th>Fecha del examen</th><td>${formatDateTime(summary?.analysisDate)}</td></tr>
              <tr><th>Estado</th><td>${summary?.status || 'Completado'}</td></tr>
              <tr><th>Parametro solicitado</th><td>${summary?.visualizationLabel || '-'}</td></tr>
              <tr><th>Nivel de hallazgo</th><td>${findings.label}</td></tr>
            </table>
            <div class="metrics">
              <div class="metric">
                <div class="metric-val">${summary?.totalRegistros ?? '-'}</div>
                <div class="metric-label">Registros</div>
              </div>
              <div class="metric">
                <div class="metric-val">${summary?.totalAnomalias ?? '-'}</div>
                <div class="metric-label">Anomalias</div>
              </div>
              <div class="metric">
                <div class="metric-val">${tasa}</div>
                <div class="metric-label">Tasa anomalias</div>
              </div>
              <div class="metric">
                <div class="metric-val">${summary?.idAnalisis ?? '-'}</div>
                <div class="metric-label">ID Analisis</div>
              </div>
            </div>
            <div class="footer">Lumex App &mdash; ${new Date().toLocaleDateString('es-ES')} &mdash; ID ${summary?.idAnalisis ?? '-'}</div>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Guardar PDF del resultado',
          UTI: 'com.adobe.pdf',
        });
      } else {
        triggerToast('La opcion de compartir no esta disponible.', 'error');
      }
    } catch (e) {
      console.log('Error generando PDF:', e);
      triggerToast('No se pudo generar el PDF del resultado.', 'error');
    } finally {
      setIsDownloadingReport(false);
    }
  };

  const handleDownloadResultChoice = () => {
    Alert.alert(
      'Descargar resultado',
      '¿En que formato deseas guardar el resultado?',
      [
        { text: 'Imagen (.PNG)', onPress: downloadResultAsImage },
        { text: 'PDF (.PDF)', onPress: downloadResultAsPdf },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

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

    triggerToast(`Medicion completada: ${bpm} bpm`);
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

    triggerToast(
      bloodPressureMode === 'camera' ? 'Estimacion por camara completada' : 'Muestra completada'
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
      triggerToast('Activa permisos de camara.', 'error');
      return;
    }
    setBloodPressureSecondsLeft(10);
    setIsMeasuringBloodPressure(true);
  };

  const enableBloodPressureCameraMode = async () => {
    const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!permission?.granted) {
      triggerToast('Permiso de camara requerido.', 'error');
      return;
    }
    setBloodPressureMode('camera');
    setIsMeasuringBloodPressure(false);
    setBloodPressureSecondsLeft(10);
  };

  const enableHeartRateCameraMode = async () => {
    const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!permission?.granted) {
      triggerToast('Permiso de camara requerido.', 'error');
      return;
    }
    setCameraSecondsLeft(15);
  };

  const startHeartRateCameraMeasurement = () => {
    if (!cameraPermission?.granted) {
      triggerToast('Activa permisos de camara.', 'error');
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

  const handleAnalyze = async () => {
    if (!datasetName.trim()) {
      triggerToast('Ingresa un nombre para el dataset.', 'error');
      return;
    }

    if (!datasetContent.trim()) {
      triggerToast('Carga un archivo o ingresa el contenido.', 'error');
      return;
    }

    const currentUserId = user?.id_usuario;
    if (!Number.isInteger(currentUserId)) {
      triggerToast('No se encontro un usuario valido.', 'error');
      return;
    }

    // VERIFICACIÓN DE CRÉDITOS
    if (availableCredits <= 0) {
      setShowCreditsModal(true);
      return;
    }

    try {
      setIsAnalyzing(true);
      const selectedAnalysisLabel = formatAnalysisLabel(FIXED_ANALYSIS_TYPE);
      const selectedVisualizationMeta = getVisualizationOption(selectedVisualization);
      const baseDatasetPath = selectedDatasetMeta?.fileUri || 'movil://dataset/manual';
      const datasetPathWithVisualization = `${baseDatasetPath}|viz=${selectedVisualization}`;

      const parsed = parsedDataset || parseDatasetContent(datasetContent);
      const visualizationImageUri = buildVisualizationImageUri(parsed, selectedVisualization);

      const saveResult = await saveAnalysis({
        userId: currentUserId,
        analysisType: FIXED_ANALYSIS_TYPE,
        visualizationType: selectedVisualization,
        datasetName: datasetName.trim(),
        datasetPath: datasetPathWithVisualization,
        parsedDataset: parsed,
      });

      // DESCONTAR CRÉDITO EXITOSAMENTE
      await consumeAnalysisCredit(currentUserId);
      setAvailableCredits(prev => Math.max(0, prev - 1));

      await loadHistory(currentUserId);

      setIsAnalyzing(false);
      setAnalysisResultSummary({
        selectedAnalysis: FIXED_ANALYSIS_TYPE,
        selectedAnalysisLabel,
        visualizationType: selectedVisualization,
        visualizationLabel: selectedVisualizationMeta.label,
        visualizationImageUri,
        datasetName: datasetName.trim(),
        idDataset: saveResult.idDataset,
        idAnalisis: saveResult.idAnalisis,
        totalRegistros: saveResult.totalRegistros,
        totalAnomalias: saveResult.totalAnomalias,
        analysisDate: new Date().toISOString(),
        source: 'new',
      });
      setShowAnalysisResultModal(true);
      setDatasetName('');
      setDatasetContent('');
      setSelectedDatasetMeta(null);
      setParsedDataset(null);
    } catch (error) {
      console.log('Error saving analysis:', error);
      setIsAnalyzing(false);
      triggerToast(error?.message || 'No se pudo completar el analisis.', 'error');
    }
  };

  const handleSelectPlan = (amount, price, name) => {
    setPendingPlan({ amount, price, name });
    setPaymentStep('confirm');
  };

  const handleExecutePayment = async () => {
    if (!paymentMethod) {
      triggerToast('Selecciona un metodo de pago.', 'error');
      return;
    }

    try {
      setIsPurchasing(true);
      // Simular delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const safeUserId = Number(user?.id_usuario ?? user?.id ?? null);
      if (!safeUserId) {
        triggerToast('Sesion invalida. Por favor reingresa.', 'error');
        return;
      }

      const res = await registerPayment(
        safeUserId, 
        pendingPlan?.amount || 0, 
        pendingPlan?.price || 0, 
        paymentMethod, 
        `Compra de ${pendingPlan?.name || 'creditos'}`,
        pendingPlan?.amount || 0
      );
      if (res.success) {
        setAvailableCredits(prev => prev + (pendingPlan?.amount || 0));
        triggerToast('¡Muchas gracias! Has adquirido tus creditos correctamente.');
        setShowCreditsModal(false);
        // Resetear flujo para la proxima vez
        setPaymentStep('plans');
        setPendingPlan(null);
        setPaymentMethod(null);
      } else {
        triggerToast(res.message || 'No se pudo procesar la carga de creditos.', 'error');
      }
    } catch (error) {
      triggerToast('Hubo un problema con el servidor.', 'error');
    } finally {
      setIsPurchasing(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || Number.isNaN(Number(bytes))) return 'Tamano desconocido';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const pickDatasetFromDevice = async () => {
    if (isPickingCsv) return;

    try {
      setIsPickingCsv(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'text/comma-separated-values',
          'application/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        triggerToast('No fue posible leer el archivo.', 'error');
        return;
      }

      if (!isDatasetFileSupported(asset)) {
        triggerToast('Formato no soportado (.csv, .xlsx, .xls).', 'error');
        return;
      }

      const datasetFile = await readDatasetAsset(asset);
      const suggestedDatasetName = (datasetFile.fileName || 'dataset.csv').replace(/\.(csv|xlsx|xls)$/i, '').trim() || 'dataset';

      setDatasetName((prev) => (prev.trim() ? prev : suggestedDatasetName));
      setDatasetContent(datasetFile.content);
      setParsedDataset({
        headers: datasetFile.headers,
        rows: datasetFile.rows,
        rowCount: datasetFile.rowCount,
      });
      setSelectedDatasetMeta({
        fileName: datasetFile.fileName,
        fileSize: datasetFile.fileSize,
        rows: datasetFile.rowCount,
        format: datasetFile.format,
        fileUri: datasetFile.fileUri,
      });

      triggerToast('Archivo cargado y listo para analizar.');
    } catch (error) {
      console.log('Error loading dataset file:', error);
      triggerToast('No se pudo cargar el archivo seleccionado.', 'error');
    } finally {
      setIsPickingCsv(false);
    }
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

  const openContactFromMenu = () => {
    setShowUserMenuModal(false);
    setShowContactModal(true);
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
        triggerToast('No se pudieron guardar los datos del perfil.', 'error');
        return;
      }
      setUser(updatedUser);
      setIsEditingProfile(false);
      triggerToast('Perfil actualizado correctamente.');
    } catch (error) {
      console.log('Error saving profile details:', error);
      triggerToast('Ocurrio un problema al guardar tus datos.', 'error');
    }
  };

  const loadSample = () => {
    setSelectedDatasetMeta(null);
    setParsedDataset(null);
    setDatasetName('Muestra_Sensores');
    setDatasetContent(
      'timestamp,temperatura,presion,humedad,estado\n' +
        '2026-01-01 08:00,22.4,1013.2,55.1,normal\n' +
        '2026-01-01 08:05,22.6,1013.0,55.3,normal\n' +
        '2026-01-01 08:10,45.9,980.1,90.0,anomalia\n' +
        '2026-01-01 08:15,22.8,1012.8,55.5,normal'
    );
  };

  const handleDatasetContentChange = (text) => {
    setDatasetContent(text);
    setParsedDataset(null);
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
    const latestAnalysis = analysisHistory[0];

    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.tabContent}
        showsVerticalScrollIndicator
        persistentScrollbar
        scrollIndicatorInsets={{ right: 8 }}
      >
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
          {latestAnalysis ? (
            <View style={styles.moduleList}>
              <View style={styles.moduleItem}>
                <Ionicons name="alert-circle-outline" size={18} color="#2f7a96" />
                <Text style={styles.moduleItemText}>Tipo de analisis: {formatAnalysisLabel(FIXED_ANALYSIS_TYPE)}</Text>
              </View>

              <View style={styles.moduleItem}>
                <Ionicons name="calendar-outline" size={18} color="#2f7a96" />
                <Text style={styles.moduleItemText}>Fecha: {formatDate(latestAnalysis.date)}</Text>
              </View>

              <View style={styles.moduleItem}>
                <Ionicons name={getVisualizationOption(latestAnalysis.visualizationType).icon} size={18} color="#2f7a96" />
                <Text style={styles.moduleItemText}>Parametro de visualizacion: {getVisualizationOption(latestAnalysis.visualizationType).label}</Text>
              </View>

              <View style={styles.moduleItem}>
                <Ionicons name="alert-circle-outline" size={18} color="#e07b21" />
                <Text style={styles.moduleItemText}>Anomalias detectadas: {latestAnalysis.anomalies}</Text>
                <View style={styles.moduleBadgeWarn}>
                  <Text style={styles.moduleBadgeWarnText}>Atencion</Text>
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.moduleDescription}>Aun no tienes analisis guardados. Sube un dataset para iniciar.</Text>
          )}
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

  const renderDataset = () => {
    let visualizationPreviewUri = null;
    try {
      if (parsedDataset) {
        visualizationPreviewUri = buildVisualizationImageUri(parsedDataset, selectedVisualization);
      } else if (datasetContent.trim()) {
        visualizationPreviewUri = buildVisualizationImageUri(parseDatasetContent(datasetContent), selectedVisualization);
      }
    } catch (_error) {
      visualizationPreviewUri = null;
    }

    return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.tabContent}
        showsVerticalScrollIndicator
        persistentScrollbar
        scrollIndicatorInsets={{ right: 8 }}
      >
        <Text style={styles.tabPageTitle}>Ingresar dataset</Text>
        <Text style={styles.tabPageSub}>Selecciona un archivo CSV o Excel guardado en el movil o, si prefieres, pega el contenido manualmente.</Text>

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
        <View style={styles.selectorButton}>
          <Ionicons
            name={ANALYSIS_TYPES.find((a) => a.value === FIXED_ANALYSIS_TYPE)?.icon || 'alert-circle-outline'}
            size={18}
            color={T}
            style={styles.inputIcon}
          />
          <Text style={styles.selectorText}>{ANALYSIS_TYPES.find((a) => a.value === FIXED_ANALYSIS_TYPE)?.label}</Text>
        </View>

        <View style={styles.analysisVisualCard}>
          <Image source={{ uri: getAnalysisVisual(FIXED_ANALYSIS_TYPE).imageUri }} style={styles.analysisVisualImage} resizeMode="cover" />
          <View style={styles.analysisVisualOverlay}>
            <Text style={styles.analysisVisualTitle}>{getAnalysisVisual(FIXED_ANALYSIS_TYPE).title}</Text>
            <Text style={styles.analysisVisualSubtitle}>{getAnalysisVisual(FIXED_ANALYSIS_TYPE).subtitle}</Text>
            <Text style={styles.analysisVisualMeta}>{getAnalysisVisual(FIXED_ANALYSIS_TYPE).focus}</Text>
            <Text style={styles.analysisVisualTip}>{getAnalysisVisual(FIXED_ANALYSIS_TYPE).tip}</Text>
          </View>
        </View>

        <Text style={styles.fieldLabel}>Parametro de visualizacion *</Text>
        <TouchableOpacity style={styles.selectorButton} onPress={() => setVisualizationOpen((v) => !v)} activeOpacity={0.85}>
          <Ionicons
            name={getVisualizationOption(selectedVisualization).icon}
            size={18}
            color={T}
            style={styles.inputIcon}
          />
          <Text style={styles.selectorText}>{getVisualizationOption(selectedVisualization).label}</Text>
          <Ionicons name={visualizationOpen ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color="#4f666c" />
        </TouchableOpacity>

        {visualizationOpen && (
          <View style={styles.dropdownMenu}>
            {VISUALIZATION_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.dropdownItem, selectedVisualization === option.value && styles.dropdownItemActive]}
                onPress={() => {
                  setSelectedVisualization(option.value);
                  setVisualizationOpen(false);
                }}
              >
                <Ionicons
                  name={option.icon}
                  size={16}
                  color={selectedVisualization === option.value ? T : '#4f666c'}
                  style={styles.dropdownItemIcon}
                />
                <Text style={[styles.dropdownItemText, selectedVisualization === option.value && styles.dropdownItemTextActive]}>
                  {option.label}
                </Text>
                {selectedVisualization === option.value && <Ionicons name="checkmark-outline" size={16} color={T} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.analysisVisualCard}>
          {visualizationPreviewUri ? (
            <Image
              source={{ uri: visualizationPreviewUri }}
              style={styles.analysisVisualImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.analysisVisualEmpty}>
              <Ionicons name="image-outline" size={22} color="#5d7f8e" />
              <Text style={styles.analysisVisualEmptyText}>Carga datos para generar vista real del parametro.</Text>
            </View>
          )}
          <View style={styles.analysisVisualOverlay}>
            <Text style={styles.analysisVisualTitle}>{getVisualizationOption(selectedVisualization).label}</Text>
            <Text style={styles.analysisVisualSubtitle}>{getVisualizationOption(selectedVisualization).detail}</Text>
            <Text style={styles.analysisVisualMeta}>Parametro seleccionado para generar el resultado visual del analisis.</Text>
          </View>
        </View>

        <Text style={styles.fieldLabel}>Archivo CSV/Excel (recomendado)</Text>
        <View style={styles.csvPickerCard}>
          <View style={styles.csvPickerHeader}>
            <Ionicons name="folder-open-outline" size={18} color={T} />
            <Text style={styles.csvPickerTitle}>Buscar archivo en mi movil</Text>
          </View>
          <Text style={styles.csvPickerSubtext}>Se abriran tus archivos para seleccionar un CSV o Excel almacenado en el dispositivo.</Text>

          <TouchableOpacity
            style={[styles.csvPickerBtn, isPickingCsv && styles.csvPickerBtnDisabled]}
            onPress={pickDatasetFromDevice}
            disabled={isPickingCsv}
            activeOpacity={0.85}
          >
            <Ionicons name={isPickingCsv ? 'hourglass-outline' : 'search-outline'} size={18} color="#ffffff" />
            <Text style={styles.csvPickerBtnText}>{isPickingCsv ? 'Buscando archivo...' : 'Buscar CSV/Excel en mi movil'}</Text>
          </TouchableOpacity>

          {selectedDatasetMeta && (
            <View style={styles.csvMetaCard}>
              <View style={styles.csvMetaRow}>
                <Ionicons name="document-text-outline" size={16} color={T} />
                <Text style={styles.csvMetaFileName} numberOfLines={1}>{selectedDatasetMeta.fileName}</Text>
              </View>
              <Text style={styles.csvMetaText}>Formato: {selectedDatasetMeta.format?.toUpperCase() || 'CSV'}</Text>
              <Text style={styles.csvMetaText}>Tamano: {formatBytes(selectedDatasetMeta.fileSize)}</Text>
              <Text style={styles.csvMetaText}>Registros detectados: {selectedDatasetMeta.rows}</Text>
            </View>
          )}
        </View>

        <View style={styles.dataHeaderRow}>
          <Text style={styles.fieldLabel}>Contenido del dataset *</Text>
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
            onChangeText={handleDatasetContentChange}
            textAlignVertical="top"
          />
        </View>

        <Text style={styles.dataHint}>Tip: si seleccionas un archivo CSV/Excel, este campo se completa automaticamente para facilitar el analisis.</Text>

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
  };

  const renderHistorial = () => (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator
      persistentScrollbar
      scrollIndicatorInsets={{ right: 8 }}
    >
      <Text style={styles.tabPageTitle}>Historial de analisis</Text>
      <Text style={styles.tabPageSub}>{analysisHistory.length} analisis realizados</Text>
      {isLoadingHistory && <Text style={styles.tabPageSub}>Actualizando historial...</Text>}
      {!isLoadingHistory && analysisHistory.length === 0 && (
        <View style={styles.historyEmptyCard}>
          <Ionicons name="cloud-upload-outline" size={18} color={T} />
          <Text style={styles.historyEmptyText}>Aun no hay analisis registrados para tu usuario.</Text>
        </View>
      )}
      {[...analysisHistory]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.historyCard}
          activeOpacity={0.85}
          onPress={() => {
            const visualizationMeta = getVisualizationOption(item.visualizationType);
            setAnalysisResultSummary({
              selectedAnalysis: FIXED_ANALYSIS_TYPE,
              selectedAnalysisLabel: formatAnalysisLabel(FIXED_ANALYSIS_TYPE),
              visualizationType: item.visualizationType,
              visualizationLabel: visualizationMeta.label,
              visualizationImageUri: buildSummaryVisualizationImageUri(item.visualizationType, item.totalRecords, item.anomalies),
              datasetName: item.name,
              idAnalisis: item.idAnalisis,
              totalRegistros: item.totalRecords,
              totalAnomalias: item.anomalies,
              analysisDate: item.date,
              status: item.status,
              findingsLabel: getFindingsVisualFromCounts(item.totalRecords, item.anomalies).label,
              source: 'history',
            });
            setShowAnalysisResultModal(true);
          }}
        >
          <View style={[styles.historyStatusBar, { backgroundColor: item.status === 'completado' ? '#2e9e54' : '#e05a21' }]} />
          <View style={styles.historyCardBody}>
            <View style={styles.historyTop}>
              <Ionicons name="document-attach-outline" size={20} color={T} />
              <Text style={styles.historyName} numberOfLines={1}>Dataset: {item.name}</Text>
              <View style={styles.historyIdBadge}>
                <Text style={styles.historyIdBadgeText}>Analisis #{item.idAnalisis}</Text>
              </View>
            </View>
            <Text style={styles.historyDateText}>Fecha: {formatDate(item.date)}</Text>
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
              <Text style={styles.modalActionBtnSecondaryText}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.langRow}>
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

      {/* MODAL DE CRÉDITOS / PRECIOS */}
      <Modal visible={showCreditsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.creditsModalContainer}>
            
            {paymentStep === 'plans' && (
              <>
                <View style={styles.creditsModalHeader}>
                  <View style={styles.creditsIconBg}>
                    <Ionicons name="cart-outline" size={24} color="#0f6d78" />
                  </View>
                  <Text style={styles.creditsModalTitle}>Analisis agotados</Text>
                  <Text style={styles.creditsModalSubtitle}>Adquiere un plan para iniciar tu analisis de dataset.</Text>
                </View>

                <View style={styles.plansContainer}>
                  <TouchableOpacity style={styles.planCard} onPress={() => handleSelectPlan(1, 5, 'Plan Basico')}>
                    <Ionicons name="flash-outline" size={30} color="#0f6d78" />
                    <Text style={styles.planName}>Plan Basico</Text>
                    <Text style={styles.planValue}>$5 USD</Text>
                    <Text style={styles.planDesc}>1 Credito por analisis</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.planCard, styles.planCardActive]} onPress={() => handleSelectPlan(3, 12, 'Diamante')}>
                    <View style={styles.diamanteBadge}><Text style={styles.diamanteBadgeText}>TOP</Text></View>
                    <Ionicons name="diamond-outline" size={30} color="#fff" />
                    <Text style={[styles.planName, {color:'#fff'}]}>Diamante</Text>
                    <Text style={[styles.planValue, {color:'#fff'}]}>$12 USD</Text>
                    <Text style={[styles.planDesc, {color:'#fff'}]}>3 Creditos por analisis</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {paymentStep === 'confirm' && (
              <View style={styles.paymentStepContainer}>
                <Ionicons name="help-circle-outline" size={60} color="#0f6d78" />
                <Text style={styles.confirmTitle}>¿Deseas realizar la compra?</Text>
                <Text style={styles.confirmSubtitle}>Has seleccionado el {pendingPlan?.name} por ${pendingPlan?.price} USD.</Text>
                
                <View style={styles.confirmActions}>
                  <TouchableOpacity style={styles.backBtn} onPress={() => setPaymentStep('plans')}>
                    <Text style={styles.backBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.continueBtn} onPress={() => setPaymentStep('methods')}>
                    <Text style={styles.continueBtnText}>Continuar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {paymentStep === 'methods' && (
              <View style={styles.paymentStepContainer}>
                <Text style={styles.methodsTitle}>Forma de pago</Text>
                <Text style={styles.methodsSubtitle}>Selecciona como deseas pagar tu plan.</Text>
                
                <View style={styles.methodsList}>
                  {[
                    { id: 'card', label: 'Tarjeta de Credito', icon: 'card-outline' },
                    { id: 'pse', label: 'PSE / Transferencia', icon: 'swap-horizontal-outline' },
                    { id: 'nequi', label: 'Nequi / Daviplata', icon: 'phone-portrait-outline' },
                    { id: 'paypal', label: 'PayPal', icon: 'logo-paypal' },
                    { id: 'mercado-pago', label: 'Mercado Pago', icon: 'wallet-outline' },
                  ].map(method => (
                    <TouchableOpacity 
                      key={method.id} 
                      style={[styles.methodItem, paymentMethod === method.id && styles.methodItemActive]}
                      onPress={() => setPaymentMethod(method.id)}
                    >
                      <Ionicons name={method.icon} size={24} color={paymentMethod === method.id ? '#fff' : '#0f6d78'} />
                      <Text style={[styles.methodLabel, paymentMethod === method.id && styles.methodLabelActive]}>{method.label}</Text>
                      {paymentMethod === method.id && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity 
                  style={[styles.payFinalBtn, (!paymentMethod || isPurchasing) && styles.payFinalBtnDisabled]} 
                  onPress={handleExecutePayment}
                  disabled={!paymentMethod || isPurchasing}
                >
                  {isPurchasing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.payFinalBtnText}>Pagar ${pendingPlan?.price} USD</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.backLink} onPress={() => setPaymentStep('confirm')}>
                  <Text style={styles.backLinkText}>Volver</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity 
              style={styles.closeCreditsBtn} 
              onPress={() => {
                setShowCreditsModal(false);
                setTimeout(() => { setPaymentStep('plans'); setPaymentMethod(null); }, 300);
              }}
            >
              <Text style={styles.closeCreditsText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
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
                <Text style={styles.userMenuItemDesc}>Lumex y desarrolladores</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.userMenuItemCompact} onPress={openContactFromMenu} activeOpacity={0.85}>
              <Ionicons name="mail-outline" size={18} color={T} />
              <View style={styles.userMenuItemTextWrap}>
                <Text style={styles.userMenuItemTitle}>Contactanos</Text>
                <Text style={styles.userMenuItemDesc}>Envianos un mensaje</Text>
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

      <Modal visible={showContactModal} animationType="fade" transparent onRequestClose={() => setShowContactModal(false)}>
        <View style={styles.userMenuOverlay}>
          <View style={styles.userMenuCard}>
            <Text style={styles.userMenuTitle}>Contactanos</Text>
            <Text style={styles.aboutModalText}>
              Tienes alguna pregunta, sugerencia o problema? Estamos aqui para ayudarte.
            </Text>
            <Text style={styles.aboutModalText}>
              Correo: soporte@lumex.app{"\n"}WhatsApp: +57 311 466 1605{"\n"}Horario: Lunes a viernes, 8am - 6pm
            </Text>
            <TouchableOpacity style={styles.userMenuCloseBtn} onPress={() => setShowContactModal(false)} activeOpacity={0.85}>
              <Text style={styles.userMenuCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showAboutLumexModal} animationType="fade" transparent onRequestClose={() => setShowAboutLumexModal(false)}>
        <View style={styles.userMenuOverlay}>
          <View style={styles.userMenuCard}>
            <Text style={styles.userMenuTitle}>Conocenos</Text>
            <ScrollView style={styles.aboutModalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.aboutModalText}>
                LUMEX - Deteccion inteligente de anomalias cardiovasculares
              </Text>
              <Text style={styles.aboutModalText}>
                LUMEX es una aplicacion movil orientada a la deteccion de anomalias cardiovasculares mediante tecnicas de aprendizaje profundo, con proyeccion hacia entornos clinicos y tecnologicos. Su proposito es facilitar la identificacion temprana de alteraciones en variables fisiologicas como la frecuencia cardiaca y la presion arterial, contribuyendo a la prevencion de enfermedades y al monitoreo continuo de la salud.
              </Text>
              <Text style={styles.aboutModalText}>
                El objetivo principal de LUMEX es mejorar la deteccion oportuna de anomalias en datos biomedicos, permitiendo identificar desviaciones en los signos vitales antes de que evolucionen en condiciones criticas. A traves del analisis inteligente de patrones, la aplicacion fortalece el seguimiento de pacientes, optimiza la gestion de datos sensibles y apoya la toma de decisiones medicas mediante la generacion de alertas automatizadas basadas en comportamientos anomalos.
              </Text>
              <Text style={styles.aboutModalText}>
                La aplicacion permite recibir y almacenar datos provenientes de dispositivos moviles, sensores o tensiometros digitales. Posteriormente, estos datos son procesados por modelos de aprendizaje profundo previamente entrenados, los cuales calculan el grado de anomalia asociado a cada registro. Los resultados se presentan de forma clara, interpretativa y accesible, facilitando la comprension tanto para usuarios como para profesionales de la salud.
              </Text>
              <Text style={styles.aboutModalText}>
                En el contexto cardiovascular, LUMEX puede identificar irregularidades como:{'\n'}
                - Alteraciones en la frecuencia cardiaca (taquicardia o bradicardia){'\n'}
                - Posibles episodios de hipertension o hipotension{'\n'}
                - Patrones anomalos en el comportamiento del pulso{'\n'}
                - Variaciones inusuales en series de datos fisiologicos
              </Text>
              <Text style={styles.aboutModalText}>
                El problema que aborda LUMEX radica en la dificultad de detectar comportamientos atipicos dentro de grandes volumenes de datos biomedicos, especialmente cuando no se dispone de informacion previamente etiquetada. En el ambito clinico, una anomalia no detectada a tiempo puede representar un riesgo significativo para la salud del paciente. Estas anomalias pueden originarse por errores en la medicion, fallas en dispositivos o cambios fisiologicos relevantes que requieren atencion inmediata.
              </Text>
              <Text style={styles.aboutModalText}>
                De esta manera, LUMEX se consolida como una herramienta innovadora que integra tecnologia y salud, permitiendo un monitoreo continuo, inteligente y preventivo de anomalias cardiovasculares, reduciendo riesgos y mejorando la calidad de vida de los usuarios.
              </Text>
              <Text style={styles.aboutModalText}>
                Desarrolladores{"\n"}
                Equipo desarrollador de LUMEX
              </Text>
              <View style={styles.aboutTeamSection}>
                <View style={styles.aboutTeamCard}>
                  <View style={styles.aboutTeamPhotoFrame}>
                    <Image source={lunaPhoto} style={styles.aboutTeamPhoto} resizeMode="contain" />
                  </View>
                  <View style={styles.aboutTeamInfo}>
                    <Text style={styles.aboutTeamName}>Luna Tatiana Riveros Rodriguez</Text>
                    <Text style={styles.aboutTeamRole}>Ingeniera de Software</Text>
                  </View>
                </View>

                <View style={styles.aboutTeamCard}>
                  <View style={styles.aboutTeamPhotoFrame}>
                    <Image source={alexPhoto} style={styles.aboutTeamPhoto} resizeMode="contain" />
                  </View>
                  <View style={styles.aboutTeamInfo}>
                    <Text style={styles.aboutTeamName}>Alexander Higuera Paz</Text>
                    <Text style={styles.aboutTeamRole}>Ingeniero de Software</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.aboutModalText}>
                Luna Tatiana Riveros Rodriguez y Alexander Higuera Paz son estudiantes de Ingenieria de Software enfocados en el desarrollo de soluciones tecnologicas innovadoras orientadas al area de la salud.
              </Text>
              <Text style={styles.aboutModalText}>
                Ambos han trabajado en la creacion de LUMEX, una aplicacion movil que emplea aprendizaje profundo para la deteccion de anomalias cardiovasculares, con el proposito de contribuir a la prevencion y monitoreo temprano de posibles riesgos en los signos vitales.
              </Text>
              <Text style={styles.aboutModalText}>
                Su trabajo se caracteriza por la integracion de conocimientos en programacion, analisis de datos y desarrollo de aplicaciones, buscando generar herramientas accesibles, eficientes y con impacto en entornos clinicos y tecnologicos.
              </Text>
            </ScrollView>

            <TouchableOpacity style={styles.userMenuCloseBtn} onPress={() => setShowAboutLumexModal(false)} activeOpacity={0.85}>
              <Text style={styles.userMenuCloseText}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAnalysisResultModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowAnalysisResultModal(false)}
      >
        <View style={styles.userMenuOverlay}>
          <View style={styles.analysisResultCard}>
            <ScrollView
              style={styles.analysisResultScroll}
              contentContainerStyle={styles.analysisResultScrollContent}
              showsVerticalScrollIndicator={!isDownloadingReport}
              persistentScrollbar={!isDownloadingReport}
            >
              <Text style={styles.analysisResultTitle}>{analysisResultSummary?.source === 'history' ? 'Resultado del analisis' : 'Analisis completado'}</Text>

              <View
                style={[
                  styles.analysisFindingsPill,
                  {
                    backgroundColor: getFindingsVisual(analysisResultSummary).bg,
                    borderColor: getFindingsVisual(analysisResultSummary).color + '55',
                  },
                ]}
              >
                <Ionicons
                  name="pulse-outline"
                  size={14}
                  color={getFindingsVisual(analysisResultSummary).color}
                />
                <Text
                  style={[
                    styles.analysisFindingsPillText,
                    { color: getFindingsVisual(analysisResultSummary).color },
                  ]}
                >
                  {getFindingsVisual(analysisResultSummary).label}
                </Text>
              </View>

              {!!(
                analysisResultSummary?.visualizationImageUri
                || buildSummaryVisualizationImageUri(
                  analysisResultSummary?.visualizationType,
                  analysisResultSummary?.totalRegistros,
                  analysisResultSummary?.totalAnomalias
                )
              ) && (
                <Image
                  source={{
                    uri:
                      analysisResultSummary?.visualizationImageUri
                      || buildSummaryVisualizationImageUri(
                        analysisResultSummary?.visualizationType,
                        analysisResultSummary?.totalRegistros,
                        analysisResultSummary?.totalAnomalias
                      ),
                  }}
                  style={styles.analysisResultImage}
                  resizeMode="cover"
                />
              )}

              <Text style={styles.analysisResultType}>{analysisResultSummary?.selectedAnalysisLabel || 'Analisis'}</Text>
              <Text style={styles.analysisResultDataset}>Dataset: {analysisResultSummary?.datasetName || '-'}</Text>
              <Text style={styles.analysisResultDate}>Fecha del examen: {formatDateTime(analysisResultSummary?.analysisDate)}</Text>
              <Text style={styles.analysisResultDescription}>
                {getFindingsVisual(analysisResultSummary).summary}
              </Text>
              <Text style={styles.analysisResultGuidance}>{getFindingsVisual(analysisResultSummary).guidance}</Text>

              <View style={styles.analysisResultInfoList}>
                <View style={styles.analysisResultInfoRow}>
                  <Text style={styles.analysisResultInfoLabel}>Tipo de analisis</Text>
                  <Text style={styles.analysisResultInfoValue}>{analysisResultSummary?.selectedAnalysisLabel || '-'}</Text>
                </View>
                <View style={styles.analysisResultInfoRow}>
                  <Text style={styles.analysisResultInfoLabel}>Nombre del dataset</Text>
                  <Text style={styles.analysisResultInfoValue}>{analysisResultSummary?.datasetName || '-'}</Text>
                </View>
                <View style={styles.analysisResultInfoRow}>
                  <Text style={styles.analysisResultInfoLabel}>Fecha del examen</Text>
                  <Text style={styles.analysisResultInfoValue}>{formatDateTime(analysisResultSummary?.analysisDate)}</Text>
                </View>
                <View style={styles.analysisResultInfoRow}>
                  <Text style={styles.analysisResultInfoLabel}>Estado</Text>
                  <Text style={styles.analysisResultInfoValue}>{analysisResultSummary?.status || 'Completado'}</Text>
                </View>
                <View style={styles.analysisResultInfoRow}>
                  <Text style={styles.analysisResultInfoLabel}>Parametro solicitado</Text>
                  <Text style={styles.analysisResultInfoValue}>{analysisResultSummary?.visualizationLabel || '-'}</Text>
                </View>
                <View style={styles.analysisResultInfoRow}>
                  <Text style={styles.analysisResultInfoLabel}>Nivel de hallazgo</Text>
                  <Text style={styles.analysisResultInfoValue}>
                    {analysisResultSummary?.findingsLabel || getFindingsVisual(analysisResultSummary).label}
                  </Text>
                </View>
              </View>

              <View style={styles.analysisResultMetrics}>
                <View style={styles.analysisMetricItem}>
                  <Text style={styles.analysisMetricLabel}>Registros</Text>
                  <Text style={styles.analysisMetricValue}>{analysisResultSummary?.totalRegistros ?? '-'}</Text>
                </View>
                <View style={styles.analysisMetricItem}>
                  <Text style={styles.analysisMetricLabel}>Anomalias</Text>
                  <Text style={styles.analysisMetricValue}>{analysisResultSummary?.totalAnomalias ?? '-'}</Text>
                </View>
                <View style={styles.analysisMetricItem}>
                  <Text style={styles.analysisMetricLabel}>ID Analisis</Text>
                  <Text style={styles.analysisMetricValue}>{analysisResultSummary?.idAnalisis ?? '-'}</Text>
                </View>
                <View style={styles.analysisMetricItem}>
                  <Text style={styles.analysisMetricLabel}>Tasa anomalias</Text>
                  <Text style={styles.analysisMetricValue}>
                    {analysisResultSummary?.totalRegistros
                      ? `${((Number(analysisResultSummary.totalAnomalias || 0) / Number(analysisResultSummary.totalRegistros || 1)) * 100).toFixed(1)}%`
                      : '-'}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.analysisResultActions}>
              <Text style={styles.downloadFormatLabel}>Selecciona el formato de descarga</Text>
              <View style={styles.downloadBtnsRow}>
                <TouchableOpacity
                  style={[
                    styles.downloadOptionTile,
                    downloadFormat === 'pdf' && styles.downloadOptionTileActive,
                  ]}
                  onPress={() => setDownloadFormat('pdf')}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={15}
                    color={downloadFormat === 'pdf' ? '#0f6d78' : '#7aa8b5'}
                  />
                  <Text style={[styles.downloadOptionTileText, downloadFormat === 'pdf' && styles.downloadOptionTileTextActive]}>PDF</Text>
                  {downloadFormat === 'pdf' && (
                    <Ionicons name="checkmark-circle" size={14} color="#0f6d78" style={styles.downloadOptionCheck} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.downloadOptionTile,
                    downloadFormat === 'imagen' && styles.downloadOptionTileActive,
                  ]}
                  onPress={() => setDownloadFormat('imagen')}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="image-outline"
                    size={15}
                    color={downloadFormat === 'imagen' ? '#0f6d78' : '#7aa8b5'}
                  />
                  <Text style={[styles.downloadOptionTileText, downloadFormat === 'imagen' && styles.downloadOptionTileTextActive]}>Imagen</Text>
                  {downloadFormat === 'imagen' && (
                    <Ionicons name="checkmark-circle" size={14} color="#0f6d78" style={styles.downloadOptionCheck} />
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.downloadBtnsRow}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalActionBtnSecondary]}
                  onPress={() => setShowAnalysisResultModal(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalActionBtnSecondaryText}>Cerrar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.downloadExecuteBtn]}
                  onPress={downloadFormat === 'pdf' ? downloadResultAsPdf : downloadResultAsImage}
                  disabled={isDownloadingReport}
                  activeOpacity={0.85}
                >
                  {isDownloadingReport ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <View style={styles.downloadFormatBtnInner}>
                      <Ionicons name="download-outline" size={15} color="#ffffff" />
                      <Text style={styles.downloadExecuteBtnText}>Descargar</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.exportCaptureHost} pointerEvents="none">
        <View ref={analysisExportCardRef} collapsable={false} style={styles.exportCaptureCard}>
          <Text style={styles.exportTitle}>Resultado del analisis</Text>
          <Text style={styles.exportSubTitle}>Generado por Lumex App</Text>

          <View
            style={[
              styles.exportFindingsPill,
              {
                backgroundColor: getFindingsVisual(analysisResultSummary).bg,
                borderColor: getFindingsVisual(analysisResultSummary).color + '44',
              },
            ]}
          >
            <Text
              style={[
                styles.exportFindingsPillText,
                { color: getFindingsVisual(analysisResultSummary).color },
              ]}
            >
              {getFindingsVisual(analysisResultSummary).label}
            </Text>
          </View>

          <Text style={styles.exportSummaryText}>{getFindingsVisual(analysisResultSummary).summary}</Text>
          <Text style={styles.exportGuidanceText}>{getFindingsVisual(analysisResultSummary).guidance}</Text>

          {!!getSummaryVisualizationUri(analysisResultSummary) && (
            <View style={styles.exportChartWrap}>
              <Text style={styles.exportChartLabel}>
                GRAFICA DE VISUALIZACION: {(analysisResultSummary?.visualizationLabel || '-').toUpperCase()}
              </Text>
              <Image
                source={{ uri: getSummaryVisualizationUri(analysisResultSummary) }}
                style={styles.exportChartImage}
                resizeMode="contain"
              />
            </View>
          )}

          <View style={styles.exportTable}>
            <View style={styles.exportTableRow}>
              <Text style={styles.exportTableKey}>Tipo de analisis</Text>
              <Text style={styles.exportTableValue}>{analysisResultSummary?.selectedAnalysisLabel || '-'}</Text>
            </View>
            <View style={styles.exportTableRow}>
              <Text style={styles.exportTableKey}>Dataset</Text>
              <Text style={styles.exportTableValue}>{analysisResultSummary?.datasetName || '-'}</Text>
            </View>
            <View style={styles.exportTableRow}>
              <Text style={styles.exportTableKey}>Fecha del examen</Text>
              <Text style={styles.exportTableValue}>{formatDateTime(analysisResultSummary?.analysisDate)}</Text>
            </View>
            <View style={styles.exportTableRow}>
              <Text style={styles.exportTableKey}>Estado</Text>
              <Text style={styles.exportTableValue}>{analysisResultSummary?.status || 'Completado'}</Text>
            </View>
            <View style={styles.exportTableRow}>
              <Text style={styles.exportTableKey}>Parametro solicitado</Text>
              <Text style={styles.exportTableValue}>{analysisResultSummary?.visualizationLabel || '-'}</Text>
            </View>
            <View style={styles.exportTableRow}>
              <Text style={styles.exportTableKey}>Nivel de hallazgo</Text>
              <Text style={styles.exportTableValue}>{analysisResultSummary?.findingsLabel || getFindingsVisual(analysisResultSummary).label}</Text>
            </View>
          </View>

          <View style={styles.exportMetricsRow}>
            <View style={styles.exportMetricBox}>
              <Text style={styles.exportMetricValue}>{analysisResultSummary?.totalRegistros ?? '-'}</Text>
              <Text style={styles.exportMetricLabel}>Registros</Text>
            </View>
            <View style={styles.exportMetricBox}>
              <Text style={styles.exportMetricValue}>{analysisResultSummary?.totalAnomalias ?? '-'}</Text>
              <Text style={styles.exportMetricLabel}>Anomalias</Text>
            </View>
            <View style={styles.exportMetricBox}>
              <Text style={styles.exportMetricValue}>
                {analysisResultSummary?.totalRegistros
                  ? `${((Number(analysisResultSummary.totalAnomalias || 0) / Number(analysisResultSummary.totalRegistros || 1)) * 100).toFixed(1)}%`
                  : '-'}
              </Text>
              <Text style={styles.exportMetricLabel}>Tasa anomalias</Text>
            </View>
            <View style={styles.exportMetricBox}>
              <Text style={styles.exportMetricValue}>{analysisResultSummary?.idAnalisis ?? '-'}</Text>
              <Text style={styles.exportMetricLabel}>ID Analisis</Text>
            </View>
          </View>

          <Text style={styles.exportFooter}>
            Lumex App - {new Date().toLocaleDateString('es-ES')} - ID {analysisResultSummary?.idAnalisis ?? '-'}
          </Text>
        </View>
      </View>
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
  aboutModalScroll: {
    maxHeight: 420,
  },
  aboutTeamSection: {
    marginBottom: 8,
  },
  aboutTeamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4fafc',
    borderWidth: 1,
    borderColor: '#d6e7ee',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  aboutTeamPhotoFrame: {
    width: 86,
    height: 86,
    borderRadius: 43,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#b9d6e2',
    backgroundColor: '#f3f8fb',
    shadowColor: '#0f6d78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 7,
    elevation: 4,
  },
  aboutTeamPhoto: {
    width: '100%',
    height: '100%',
  },
  aboutTeamInfo: {
    flex: 1,
    marginLeft: 12,
  },
  aboutTeamName: {
    color: '#173746',
    fontSize: 14,
    fontWeight: '700',
  },
  aboutTeamRole: {
    color: '#5f7e8c',
    fontSize: 12,
    marginTop: 2,
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
  lockedTag: {
    backgroundColor: '#d8eef2',
    color: '#0f6d78',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
  },
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
  csvPickerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d6e7ee',
    padding: 12,
  },
  csvPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  csvPickerTitle: {
    color: '#173746',
    fontSize: 14,
    fontWeight: '700',
  },
  csvPickerSubtext: {
    color: '#587886',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 10,
  },
  csvPickerBtn: {
    backgroundColor: '#2f7a96',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  csvPickerBtnDisabled: {
    backgroundColor: '#7ab5bb',
  },
  csvPickerBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  csvMetaCard: {
    marginTop: 10,
    backgroundColor: '#f3fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#deedf3',
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 3,
  },
  csvMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  csvMetaFileName: {
    flex: 1,
    color: '#2d5b6d',
    fontSize: 13,
    fontWeight: '700',
  },
  csvMetaText: {
    color: '#587886',
    fontSize: 12,
  },
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
  historyIdBadge: {
    backgroundColor: '#eef8fa',
    borderWidth: 1,
    borderColor: '#d4e7ee',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  historyIdBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2f7a96',
  },
  historyDateText: { fontSize: 12, color: '#4f666c', marginTop: 4 },
  historyMeta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  historyMetaText: { fontSize: 11, color: '#4f666c' },
  historyFindingsBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },
  historyFindingsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  analysisVisualCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d4e7ee',
    shadowColor: '#0b3a4a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  analysisVisualImage: {
    width: '100%',
    height: 140,
  },
  analysisVisualEmpty: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef6f8',
    paddingHorizontal: 14,
    gap: 6,
  },
  analysisVisualEmptyText: {
    color: '#5d7f8e',
    fontSize: 12,
    textAlign: 'center',
  },
  analysisVisualOverlay: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
    backgroundColor: '#ffffff',
  },
  analysisVisualTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#123f4a',
  },
  analysisVisualSubtitle: {
    fontSize: 13,
    color: '#345b64',
    lineHeight: 18,
  },
  analysisVisualMeta: {
    fontSize: 12,
    color: '#0f6d78',
    fontWeight: '700',
  },
  analysisVisualTip: {
    fontSize: 12,
    color: '#4f666c',
    lineHeight: 17,
  },
  analysisResultCard: {
    width: '88%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#d4e7ee',
  },
  analysisResultScroll: {
    maxHeight: '90%',
    backgroundColor: '#ffffff',
  },
  analysisResultScrollContent: {
    paddingBottom: 8,
    paddingRight: 6,
    backgroundColor: '#ffffff',
  },
  exportCaptureHost: {
    position: 'absolute',
    left: -5000,
    top: -5000,
    width: 760,
    backgroundColor: '#ffffff',
  },
  exportCaptureCard: {
    width: 760,
    backgroundColor: '#eef7f8',
    borderWidth: 1,
    borderColor: '#d4e7ee',
    paddingHorizontal: 30,
    paddingTop: 24,
    paddingBottom: 26,
  },
  exportTitle: {
    color: '#1b5f74',
    fontSize: 46,
    fontWeight: '800',
    marginBottom: 6,
  },
  exportSubTitle: {
    color: '#6a8f99',
    fontSize: 18,
    marginBottom: 18,
  },
  exportFindingsPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 2,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 14,
  },
  exportFindingsPillText: {
    fontSize: 24,
    fontWeight: '800',
  },
  exportSummaryText: {
    color: '#355964',
    fontSize: 18,
    marginBottom: 8,
  },
  exportGuidanceText: {
    color: '#4f6f7b',
    fontSize: 16,
    marginBottom: 16,
  },
  exportChartWrap: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d4e7ee',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  exportChartLabel: {
    color: '#2a6b7d',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  exportChartImage: {
    width: '100%',
    height: 250,
  },
  exportTable: {
    borderWidth: 1,
    borderColor: '#d4e7ee',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 14,
  },
  exportTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#dfeef3',
  },
  exportTableKey: {
    width: '40%',
    backgroundColor: '#e6f3f6',
    color: '#24556a',
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  exportTableValue: {
    flex: 1,
    color: '#1f3f4d',
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  exportMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  exportMetricBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d4e7ee',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  exportMetricValue: {
    color: '#1b5f74',
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 40,
  },
  exportMetricLabel: {
    color: '#678a95',
    fontSize: 14,
    marginTop: 2,
  },
  exportFooter: {
    textAlign: 'center',
    color: '#7f9aa2',
    fontSize: 13,
    marginTop: 4,
  },
  analysisResultTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#123f4a',
    marginBottom: 10,
  },
  analysisResultImage: {
    width: '100%',
    height: 92,
    borderRadius: 10,
    marginBottom: 10,
  },
  analysisResultType: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f6d78',
    marginBottom: 4,
  },
  analysisResultDataset: {
    fontSize: 13,
    color: '#345b64',
    marginBottom: 4,
  },
  analysisResultDate: {
    fontSize: 12,
    color: '#5d7f8e',
    marginBottom: 8,
  },
  analysisResultDescription: {
    fontSize: 12,
    color: '#4f666c',
    lineHeight: 17,
    marginBottom: 6,
  },
  analysisResultGuidance: {
    fontSize: 12,
    color: '#345b64',
    lineHeight: 17,
    marginBottom: 10,
  },
  analysisResultInfoList: {
    backgroundColor: '#f7fbfc',
    borderWidth: 1,
    borderColor: '#d9eaf0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  analysisResultInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  analysisResultInfoLabel: {
    flex: 1,
    fontSize: 12,
    color: '#4f666c',
    fontWeight: '600',
  },
  analysisResultInfoValue: {
    flex: 1,
    fontSize: 12,
    color: '#15333d',
    textAlign: 'right',
    fontWeight: '700',
  },
  analysisResultMetrics: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  analysisMetricItem: {
    width: '48%',
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: '#f3faf9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d7ecea',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  analysisMetricLabel: {
    fontSize: 11,
    color: '#4f666c',
    marginBottom: 4,
    lineHeight: 14,
  },
  analysisMetricValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f6d78',
  },
  analysisFindingsPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },
  analysisFindingsPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  analysisResultActions: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 10,
    paddingTop: 6,
  },
  downloadBtnsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  downloadFormatBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadFormatBtnPdf: {
    backgroundColor: '#0f6d78',
  },
  downloadFormatBtnImg: {
    backgroundColor: '#2f7a96',
  },
  downloadFormatBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  downloadFormatBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  historyEmptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d4e7ee',
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  historyEmptyText: {
    color: '#4f666c',
    fontSize: 13,
    flex: 1,
  },
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
  downloadBtnsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  downloadFormatLabel: {
    fontSize: 12,
    color: '#4f7f8c',
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  downloadOptionTile: {
    flex: 1,
    borderRadius: 12,
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f3fafc',
    borderWidth: 1,
    borderColor: '#deedf3',
  },
  downloadOptionTileActive: {
    backgroundColor: '#e4f4f8',
    borderColor: '#0f6d78',
  },
  downloadOptionTileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7aa8b5',
  },
  downloadOptionTileTextActive: {
    color: '#0f6d78',
    fontWeight: '700',
  },
  downloadOptionCheck: {
    position: 'absolute',
    top: 5,
    right: 6,
  },
  downloadFormatBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  downloadExecuteBtn: {
    backgroundColor: '#0f6d78',
  },
  downloadExecuteBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  measureModeChip: {
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
  // CREDIT MODAL STYLES
  creditsModalContainer: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  creditsModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  creditsIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f7f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  creditsModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#051821',
    marginBottom: 8,
  },
  creditsModalSubtitle: {
    fontSize: 14,
    color: '#6b8a8f',
    textAlign: 'center',
    lineHeight: 20,
  },
  plansContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  planCard: {
    flex: 1,
    backgroundColor: '#f8fbfc',
    borderWidth: 1,
    borderColor: '#e1ecee',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  planCardActive: {
    backgroundColor: '#0f6d78',
    borderColor: '#0f6d78',
  },
  planName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f6d78',
  },
  planValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#051821',
  },
  planDesc: {
    fontSize: 11,
    color: '#6b8a8f',
    textAlign: 'center',
  },
  diamanteBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#e05a21',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  diamanteBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  closeCreditsBtn: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  closeCreditsText: {
    color: '#6b8a8f',
    fontSize: 15,
    fontWeight: '600',
  },
  // MULTI-STEP PAYMENT STYLES
  paymentStepContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#051821',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmSubtitle: {
    fontSize: 15,
    color: '#6b8a8f',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  backBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1ecee',
    alignItems: 'center',
  },
  backBtnText: {
    color: '#6b8a8f',
    fontWeight: '700',
    fontSize: 15,
  },
  continueBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0f6d78',
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  methodsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#051821',
    marginBottom: 5,
    width: '100%',
  },
  methodsSubtitle: {
    fontSize: 13,
    color: '#6b8a8f',
    marginBottom: 20,
    width: '100%',
  },
  methodsList: {
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1ecee',
    backgroundColor: '#f8fbfc',
    gap: 12,
  },
  methodItemActive: {
    backgroundColor: '#1a7da2',
    borderColor: '#1a7da2',
  },
  methodLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#051821',
  },
  methodLabelActive: {
    color: '#fff',
  },
  payFinalBtn: {
    width: '100%',
    paddingVertical: 15,
    backgroundColor: '#e05a21',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e05a21',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  payFinalBtnDisabled: {
    backgroundColor: '#9ab4b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  payFinalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  backLink: {
    marginTop: 15,
    padding: 5,
  },
  backLinkText: {
    color: '#0f6d78',
    fontWeight: '700',
    fontSize: 13,
  },
});
