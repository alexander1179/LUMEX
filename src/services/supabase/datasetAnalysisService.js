import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';
import { supabase } from './supabaseClient';
import { getApiUrlCandidates } from '../services/api/apiConfig';

const ANALYSIS_SERVER_TIMEOUT_MS = 8000;
const RESULTS_BATCH_SIZE = 1000;
const RESULTS_BATCH_CONCURRENCY = 3;

const FS_ENCODING = {
  base64: FileSystem?.EncodingType?.Base64 || 'base64',
  utf8: FileSystem?.EncodingType?.UTF8 || 'utf8',
};

const ANALYSIS_MODEL_CONFIG = {
  anomalias: {
    nombre: 'RandomForestClassifier',
    descripcion: 'Modelo de deteccion de anomalias sobre dataset cargado desde app movil',
    tipo: 'clasificacion',
  },
  clasificacion: {
    nombre: 'RandomForestClassifier',
    descripcion: 'Modelo de clasificacion sobre dataset cargado desde app movil',
    tipo: 'clasificacion',
  },
  regresion: {
    nombre: 'RandomForestRegressor',
    descripcion: 'Modelo de regresion sobre dataset cargado desde app movil',
    tipo: 'regresion',
  },
  clustering: {
    nombre: 'KMeans',
    descripcion: 'Modelo de clustering sobre dataset cargado desde app movil',
    tipo: 'clustering',
  },
};

const normalizeValue = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const parseCsvLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
};

export const parseDatasetContent = (rawContent) => {
  const content = String(rawContent || '').replace(/^\uFEFF/, '');
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error('El archivo debe incluir encabezados y al menos una fila de datos.');
  }

  const headers = parseCsvLine(lines[0]).map((header) => normalizeValue(header));
  const normalizedHeaders = headers.map((header, index) => header || `columna_${index + 1}`);

  const rows = lines.slice(1).map((line, rowIndex) => {
    const values = parseCsvLine(line);
    const rowObject = {};

    normalizedHeaders.forEach((header, columnIndex) => {
      rowObject[header] = normalizeValue(values[columnIndex] ?? '');
    });

    rowObject.__rowIndex = rowIndex;
    return rowObject;
  });

  return {
    headers: normalizedHeaders,
    rows,
    rowCount: rows.length,
    normalizedContent: [normalizedHeaders.join(','), ...rows.map((row) => normalizedHeaders.map((header) => row[header]).join(','))].join('\n'),
  };
};

const toNumberOrNull = (value) => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).replace(',', '.').trim();
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
};

const buildResultsWithNsp = (rows, nspKey) => {
  return rows.map((row, index) => {
    const nspValue = toNumberOrNull(row[nspKey]);
    const normalizedNsp = nspValue === null ? 1 : Math.round(nspValue);
    const isAnomaly = normalizedNsp !== 1;
    const reconstructionError = nspValue === null ? 0 : Math.min(1, Math.max(0, Math.abs(nspValue - 1) / 2));

    return {
      id_analisis: null,
      indice_registro: index,
      error_reconstruccion: Number(reconstructionError.toFixed(6)),
      es_anomalia: isAnomaly,
    };
  });
};

const buildResultsWithZScore = (rows, headers) => {
  const numericHeaders = headers.filter((header) => rows.some((row) => toNumberOrNull(row[header]) !== null));

  if (numericHeaders.length === 0) {
    return rows.map((_, index) => ({
      id_analisis: null,
      indice_registro: index,
      error_reconstruccion: 0,
      es_anomalia: false,
    }));
  }

  const stats = numericHeaders.map((header) => {
    const values = rows.map((row) => toNumberOrNull(row[header])).filter((value) => value !== null);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
    const std = Math.sqrt(variance) || 1;
    return { header, mean, std };
  });

  return rows.map((row, index) => {
    const scores = stats.map(({ header, mean, std }) => {
      const value = toNumberOrNull(row[header]);
      if (value === null) return 0;
      return Math.abs((value - mean) / std);
    });

    const avgZScore = scores.reduce((sum, value) => sum + value, 0) / scores.length;
    const reconstructionError = Math.min(1, avgZScore / 4);
    const isAnomaly = avgZScore >= 2;

    return {
      id_analisis: null,
      indice_registro: index,
      error_reconstruccion: Number(reconstructionError.toFixed(6)),
      es_anomalia: isAnomaly,
    };
  });
};

const buildResults = ({ rows, headers }) => {
  const nspKey = headers.find((header) => header.trim().toLowerCase() === 'nsp');
  return nspKey ? buildResultsWithNsp(rows, nspKey) : buildResultsWithZScore(rows, headers);
};

const isRlsError = (message) => {
  const normalized = String(message || '').toLowerCase();
  return normalized.includes('row-level security') || normalized.includes('policy for table');
};

const isForeignKeyError = (message) => {
  const normalized = String(message || '').toLowerCase();
  return normalized.includes('foreign key') || normalized.includes('violates foreign key constraint');
};

const resolveModelIdWithoutModelTable = async (userId) => {
  const byUser = await supabase
    .from('analisis')
    .select('id_modelo')
    .eq('id_usuario', Number(userId))
    .order('fecha_analisis', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!byUser.error && byUser.data?.id_modelo) {
    return Number(byUser.data.id_modelo);
  }

  const anyAnalysis = await supabase
    .from('analisis')
    .select('id_modelo')
    .order('id_analisis', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!anyAnalysis.error && anyAnalysis.data?.id_modelo) {
    return Number(anyAnalysis.data.id_modelo);
  }

  // Valor de reserva habitual cuando existe catálogo inicial de modelos.
  return 1;
};

const fetchWithTimeout = async (url, options, timeoutMs = ANALYSIS_SERVER_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  // localtunnel requiere este header para evitar la pantalla de bienvenida (503).
  const headers = {
    'bypass-tunnel-reminder': '1',
    ...(options?.headers || {}),
  };

  try {
    return await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timerId);
  }
};

const insertResultadosInBatches = async (supabaseClient, resultados, analisisId) => {
  const batches = [];

  for (let i = 0; i < resultados.length; i += RESULTS_BATCH_SIZE) {
    batches.push(
      resultados.slice(i, i + RESULTS_BATCH_SIZE).map((row) => ({
        ...row,
        id_analisis: analisisId,
      }))
    );
  }

  for (let i = 0; i < batches.length; i += RESULTS_BATCH_CONCURRENCY) {
    const concurrentBatches = batches.slice(i, i + RESULTS_BATCH_CONCURRENCY);
    const responses = await Promise.all(
      concurrentBatches.map((batch) => supabaseClient.from('resultados').insert(batch))
    );

    const failedInsert = responses.find((response) => response.error);
    if (failedInsert?.error) {
      throw new Error(failedInsert.error.message || 'No fue posible guardar los resultados del análisis.');
    }
  }
};

const saveAnalysisViaServer = async ({
  userId,
  analysisType,
  datasetName,
  datasetPath,
  parsedDataset,
  analysisSummary,
}) => {
  const apiUrls = getApiUrlCandidates();
  let lastError = null;

  for (const apiUrl of apiUrls) {
    try {
      const response = await fetchWithTimeout(`${apiUrl}/analysis/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          analysisType,
          datasetName,
          datasetPath,
          parsedDataset,
          analysisSummary,
        }),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok || !json?.success) {
        lastError = new Error(json?.message || `Error del servidor (${response.status}) guardando análisis.`);
        continue;
      }

      return {
        idModelo: Number(json.idModelo),
        idDataset: Number(json.idDataset),
        idAnalisis: Number(json.idAnalisis),
        totalRegistros: Number(json.totalRegistros),
        totalAnomalias: Number(json.totalAnomalias),
      };
    } catch (error) {
      if (error?.name === 'AbortError') {
        lastError = new Error(`Timeout de ${ANALYSIS_SERVER_TIMEOUT_MS}ms contactando ${apiUrl}`);
      } else {
        lastError = error;
      }
    }
  }

  const tried = apiUrls.join(', ');
  const message = lastError?.message || 'Error de red al contactar backend.';
  throw new Error(
    `No se pudo guardar el análisis por backend. URLs probadas: ${tried}. Detalle: ${message}. ` +
    'Configura EXPO_PUBLIC_API_URL con tu URL pública (ej: localtunnel) o verifica que el servidor esté activo.'
  );
};

const extensionFromFileName = (fileName = '') => {
  const normalized = String(fileName).toLowerCase();
  if (normalized.endsWith('.xlsx')) return 'xlsx';
  if (normalized.endsWith('.xls')) return 'xls';
  if (normalized.endsWith('.csv')) return 'csv';
  return '';
};

export const isDatasetFileSupported = (asset) => {
  const name = (asset?.name || '').toLowerCase();
  const mime = (asset?.mimeType || '').toLowerCase();

  return (
    name.endsWith('.csv') ||
    name.endsWith('.xlsx') ||
    name.endsWith('.xls') ||
    mime.includes('csv') ||
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime.includes('officedocument.spreadsheetml.sheet') ||
    mime.includes('ms-excel')
  );
};

export const readDatasetAsset = async (asset) => {
  if (!asset?.uri) {
    throw new Error('No fue posible leer el archivo seleccionado.');
  }

  const extension = extensionFromFileName(asset.name);
  let csvContent = '';

  if (extension === 'xlsx' || extension === 'xls') {
    const base64Content = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FS_ENCODING.base64,
    });

    const workbook = XLSX.read(base64Content, { type: 'base64' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new Error('El archivo Excel no contiene hojas para analizar.');
    }

    const firstSheet = workbook.Sheets[firstSheetName];
    csvContent = XLSX.utils.sheet_to_csv(firstSheet);
  } else {
    csvContent = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FS_ENCODING.utf8,
    });
  }

  const parsed = parseDatasetContent(csvContent);
  const fileName = asset?.name || `dataset.${extension || 'csv'}`;

  return {
    fileName,
    fileUri: asset.uri,
    fileSize: asset.size ?? csvContent.length,
    format: extension === 'xlsx' || extension === 'xls' ? 'excel' : 'csv',
    content: parsed.normalizedContent,
    ...parsed,
  };
};

const getModelPayload = (analysisType) => {
  const config = ANALYSIS_MODEL_CONFIG[analysisType] || ANALYSIS_MODEL_CONFIG.anomalias;
  return {
    nombre_modelo: config.nombre,
    descripcion: config.descripcion,
    tipo_modelo: config.tipo,
    fecha_creacion: new Date().toISOString(),
  };
};

const resolveModelId = async (analysisType) => {
  const payload = getModelPayload(analysisType);

  const modelByType = await supabase
    .from('modelos')
    .select('id_modelo')
    .eq('tipo_modelo', payload.tipo_modelo)
    .order('id_modelo', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!modelByType.error && modelByType.data?.id_modelo) {
    return Number(modelByType.data.id_modelo);
  }

  const anyModel = await supabase
    .from('modelos')
    .select('id_modelo')
    .order('id_modelo', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!anyModel.error && anyModel.data?.id_modelo) {
    return Number(anyModel.data.id_modelo);
  }

  const modelInsert = await supabase
    .from('modelos')
    .insert([payload])
    .select('id_modelo')
    .single();

  if (modelInsert.error || !modelInsert.data?.id_modelo) {
    throw new Error(modelInsert.error?.message || 'No fue posible registrar el modelo en Supabase.');
  }

  return Number(modelInsert.data.id_modelo);
};

export const saveAnalysisInSupabase = async ({
  userId,
  analysisType,
  datasetName,
  datasetPath,
  parsedDataset,
}) => {
  if (!userId) {
    throw new Error('No se encontró el id del usuario para registrar el análisis.');
  }

  const numericUserId = Number(userId);
  if (!Number.isInteger(numericUserId)) {
    throw new Error('El id del usuario no es válido para guardar en Supabase.');
  }

  const startedAt = Date.now();

  const { rows, headers, rowCount } = parsedDataset;
  const resultados = buildResults({ rows, headers });
  const totalAnomalias = resultados.reduce((sum, row) => sum + (row.es_anomalia ? 1 : 0), 0);

  const preprocessingMs = Date.now() - startedAt;
  console.log(`[dataset-analysis] preprocesamiento (${rowCount} filas): ${preprocessingMs}ms`);

  const saveViaBackendSummary = async (originErrorMessage) => {
    try {
      return await saveAnalysisViaServer({
        userId: numericUserId,
        analysisType,
        datasetName,
        datasetPath,
        analysisSummary: {
          totalRegistros: rowCount,
          totalAnomalias,
        },
      });
    } catch (serverError) {
      throw new Error(
        `No fue posible registrar análisis localmente (${originErrorMessage || 'sin detalle'}) ni por backend. ${serverError?.message || ''}`.trim()
      );
    }
  };

  let modelId;
  let modelIdBypassMode = false;
  try {
    modelId = await resolveModelId(analysisType);
  } catch (e) {
    if (isRlsError(e?.message)) {
      modelId = await resolveModelIdWithoutModelTable(numericUserId);
      modelIdBypassMode = true;
      console.log(`[dataset-analysis] modelos con RLS. Usando id_modelo de respaldo: ${modelId}`);
    } else {
      throw e;
    }
  }

  const datasetInsert = await supabase
    .from('datasets')
    .insert([
      {
        id_usuario: numericUserId,
        nombre_archivo: datasetName,
        ruta_archivo: datasetPath || 'movil://dataset',
        fecha_subida: new Date().toISOString(),
      },
    ])
    .select('id_dataset')
    .single();

  if (datasetInsert.error || !datasetInsert.data?.id_dataset) {
    if (isRlsError(datasetInsert.error?.message)) {
      console.log('[dataset-analysis] datasets con RLS. Activando fallback backend por resumen.');
      return saveViaBackendSummary(datasetInsert.error?.message);
    }

    throw new Error(datasetInsert.error?.message || 'No fue posible registrar el dataset en Supabase.');
  }

  const analisisInsert = await supabase
    .from('analisis')
    .insert([
      {
        id_usuario: numericUserId,
        id_dataset: Number(datasetInsert.data.id_dataset),
        id_modelo: Number(modelId),
        fecha_analisis: new Date().toISOString(),
        total_registros: rowCount,
        total_anomalias: totalAnomalias,
      },
    ])
    .select('id_analisis')
    .single();

  if (analisisInsert.error || !analisisInsert.data?.id_analisis) {
    if (modelIdBypassMode && (isForeignKeyError(analisisInsert.error?.message) || isRlsError(analisisInsert.error?.message))) {
      return saveViaBackendSummary(analisisInsert.error?.message);
    }

    throw new Error(analisisInsert.error?.message || 'No fue posible registrar el análisis en Supabase.');
  }

  const analisisId = Number(analisisInsert.data.id_analisis);
  const beforeBatchInsert = Date.now();
  await insertResultadosInBatches(supabase, resultados, analisisId);
  const insertMs = Date.now() - beforeBatchInsert;
  console.log(
    `[dataset-analysis] inserción de resultados (${resultados.length} filas, batch=${RESULTS_BATCH_SIZE}, concurrency=${RESULTS_BATCH_CONCURRENCY}): ${insertMs}ms`
  );

  const totalMs = Date.now() - startedAt;
  console.log(`[dataset-analysis] tiempo total: ${totalMs}ms`);

  return {
    idModelo: Number(modelId),
    idDataset: Number(datasetInsert.data.id_dataset),
    idAnalisis: analisisId,
    totalRegistros: rowCount,
    totalAnomalias,
  };
};

export const fetchAnalysisHistoryByUser = async (userId) => {
  const numericUserId = Number(userId);
  if (!Number.isInteger(numericUserId)) {
    return [];
  }

  const { data, error } = await supabase
    .from('analisis')
    .select('id_analisis, fecha_analisis, total_registros, total_anomalias, datasets(nombre_archivo), modelos(tipo_modelo)')
    .eq('id_usuario', numericUserId)
    .order('fecha_analisis', { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message || 'No fue posible consultar el historial de análisis.');
  }

  return (data || []).map((item) => ({
    id: String(item.id_analisis),
    idAnalisis: Number(item.id_analisis),
    name: item.datasets?.nombre_archivo || `dataset_${item.id_analisis}.csv`,
    type: item.modelos?.tipo_modelo || 'analisis',
    date: item.fecha_analisis,
    status: 'completado',
    anomalies: Number(item.total_anomalias || 0),
    totalRecords: Number(item.total_registros || 0),
  }));
};