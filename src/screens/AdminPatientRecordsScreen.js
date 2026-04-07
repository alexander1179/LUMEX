import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchAnalysisHistoryByUser } from '../services/supabase/datasetAnalysisService';

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

const formatDateTimeAdmin = (isoDate) => {
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

const getUserId = (user) => user?._dbId ?? user?.id_usuario ?? user?.id ?? user?.uuid ?? user?.user_id ?? user?._localId ?? null;

export default function AdminPatientRecordsScreen({ route }) {
  const user = route?.params?.user;
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showAnalysisResultModal, setShowAnalysisResultModal] = useState(false);
  const [analysisResultSummary, setAnalysisResultSummary] = useState(null);

  useEffect(() => {
    const userId = getUserId(user);
    if (userId) {
      loadHistory(userId);
    }
  }, [user]);

  const loadHistory = async (userId) => {
    setIsLoadingHistory(true);
    try {
      const history = await fetchAnalysisHistoryByUser(userId);
      setAnalysisHistory(history);
    } catch (e) {
      console.log('Error loading history for admin:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Resultados de análisis</Text>
        <Text style={styles.subtitle}>{user ? `Paciente: ${user.nombre || user.usuario}` : 'Seleccione un paciente desde el panel.'}</Text>

        <View style={styles.infoCard}>
          <Ionicons name="folder-open-outline" size={24} color="#2f7a96" />
          <Text style={styles.infoTitle}>Expediente clínico</Text>
          <Text style={styles.infoBody}>Visualiza el historial completo de análisis realizados por el paciente.</Text>
        </View>

        {isLoadingHistory && <Text style={{color: '#5e7d8c', marginTop: 10}}>Cargando historial...</Text>}

        {!isLoadingHistory && analysisHistory.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={30} color="#7fa6b7" />
            <Text style={styles.emptyTitle}>Sin registros clínicos</Text>
            <Text style={styles.emptyBody}>El paciente no tiene análisis registrados.</Text>
          </View>
        )}

        {[...analysisHistory]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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
                    <Text style={styles.historyIdBadgeText}>Análisis #{item.idAnalisis}</Text>
                  </View>
                </View>
                <Text style={styles.historyDateText}>Fecha: {formatDate(item.date)}</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={16} color="#9ab4b8" />
            </TouchableOpacity>
        ))}
      </ScrollView>

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
              showsVerticalScrollIndicator={true}
              persistentScrollbar={true}
            >
              <Text style={styles.analysisResultTitle}>Resultado del análisis ({user?.nombre || user?.usuario || 'Paciente'})</Text>

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

              <Text style={styles.analysisResultType}>{analysisResultSummary?.selectedAnalysisLabel || 'Análisis'}</Text>
              <Text style={styles.analysisResultDataset}>Dataset: {analysisResultSummary?.datasetName || '-'}</Text>
              <Text style={styles.analysisResultDate}>Fecha del examen: {formatDateTimeAdmin(analysisResultSummary?.analysisDate)}</Text>
              <Text style={styles.analysisResultDescription}>
                {getFindingsVisual(analysisResultSummary).summary}
              </Text>
              <Text style={styles.analysisResultGuidance}>{getFindingsVisual(analysisResultSummary).guidance}</Text>

              <View style={styles.analysisResultInfoList}>
                <View style={styles.analysisResultInfoRow}>
                  <Text style={styles.analysisResultInfoLabel}>Tipo de análisis</Text>
                  <Text style={styles.analysisResultInfoValue}>{analysisResultSummary?.selectedAnalysisLabel || '-'}</Text>
                </View>
                <View style={styles.analysisResultInfoRow}>
                  <Text style={styles.analysisResultInfoLabel}>Nombre del dataset</Text>
                  <Text style={styles.analysisResultInfoValue}>{analysisResultSummary?.datasetName || '-'}</Text>
                </View>
                <View style={styles.analysisResultInfoRow}>
                  <Text style={styles.analysisResultInfoLabel}>Fecha del examen</Text>
                  <Text style={styles.analysisResultInfoValue}>{formatDateTimeAdmin(analysisResultSummary?.analysisDate)}</Text>
                </View>
                <View style={styles.analysisResultInfoRow}>
                  <Text style={styles.analysisResultInfoLabel}>Estado</Text>
                  <Text style={styles.analysisResultInfoValue}>{analysisResultSummary?.status || 'Completado'}</Text>
                </View>
                <View style={styles.analysisResultInfoRow}>
                  <Text style={styles.analysisResultInfoLabel}>Parámetro solicitado</Text>
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
                  <Text style={styles.analysisMetricLabel}>Anomalías</Text>
                  <Text style={styles.analysisMetricValue}>{analysisResultSummary?.totalAnomalias ?? '-'}</Text>
                </View>
                <View style={styles.analysisMetricItem}>
                  <Text style={styles.analysisMetricLabel}>ID Análisis</Text>
                  <Text style={styles.analysisMetricValue}>{analysisResultSummary?.idAnalisis ?? '-'}</Text>
                </View>
                <View style={styles.analysisMetricItem}>
                  <Text style={styles.analysisMetricLabel}>Tasa anomalías</Text>
                  <Text style={styles.analysisMetricValue}>
                    {analysisResultSummary?.totalRegistros
                      ? `${((Number(analysisResultSummary.totalAnomalias || 0) / Number(analysisResultSummary.totalRegistros || 1)) * 100).toFixed(1)}%`
                      : '-'}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.analysisResultActions}>
              <View style={[styles.downloadBtnsRow, { justifyContent: 'center', marginTop: 14 }]}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalActionBtnSecondary, { paddingHorizontal: 40 }]}
                  onPress={() => setShowAnalysisResultModal(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalActionBtnSecondaryText}>Cerrar vista de resultados</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

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
  
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2f0f4',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  historyStatusBar: {
    width: 6,
    height: '100%',
    borderRadius: 3,
    marginRight: 12,
  },
  historyCardBody: {
    flex: 1,
    paddingRight: 10,
  },
  historyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  historyName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f6d78',
    flex: 1,
  },
  historyIdBadge: {
    backgroundColor: '#eff5f7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d2e4ea',
  },
  historyIdBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5b7c8b',
  },
  historyDateText: {
    fontSize: 12,
    color: '#6a8b98',
  },

  userMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,34,41,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  analysisResultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  analysisResultScroll: {
    flexGrow: 1,
  },
  analysisResultScrollContent: {
    padding: 24,
    paddingBottom: 30,
  },
  analysisResultTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0a2229',
    textAlign: 'center',
    marginBottom: 18,
  },
  analysisFindingsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    marginBottom: 20,
  },
  analysisFindingsPillText: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  analysisResultImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eaf6f5',
    backgroundColor: '#f8fbfc',
  },
  analysisResultType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f6d78',
    marginBottom: 4,
  },
  analysisResultDataset: {
    fontSize: 14,
    color: '#4f666c',
    marginBottom: 4,
  },
  analysisResultDate: {
    fontSize: 13,
    color: '#7aa8b5',
    marginBottom: 16,
  },
  analysisResultDescription: {
    fontSize: 15,
    color: '#1a3b45',
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 10,
  },
  analysisResultGuidance: {
    fontSize: 14,
    color: '#4f666c',
    lineHeight: 20,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  analysisResultInfoList: {
    backgroundColor: '#f8fbfc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2f0f4',
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  analysisResultInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eaf6f5',
  },
  analysisResultInfoLabel: {
    fontSize: 13,
    color: '#7aa8b5',
    flex: 1,
  },
  analysisResultInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0a2229',
    flex: 1,
    textAlign: 'right',
  },
  analysisResultMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  analysisMetricItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2f0f4',
    padding: 16,
    alignItems: 'center',
  },
  analysisMetricLabel: {
    fontSize: 12,
    color: '#7aa8b5',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  analysisMetricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f6d78',
  },
  analysisResultActions: {
    padding: 24,
    paddingTop: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f7f9',
  },
  downloadBtnsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionBtnSecondary: {
    backgroundColor: '#eef6f8',
    borderWidth: 1,
    borderColor: '#d2e4ea',
  },
  modalActionBtnSecondaryText: {
    color: '#2f7a96',
    fontWeight: '700',
    fontSize: 15,
  },
});
