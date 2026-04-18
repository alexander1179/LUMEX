import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';
import { getApiClient } from './apiClient';

const FS_ENCODING = {
  base64: FileSystem?.EncodingType?.Base64 || 'base64',
  utf8: FileSystem?.EncodingType?.UTF8 || 'utf8',
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

export const saveAnalysisInSupabase = async ({
  userId,
  analysisType,
  visualizationType,
  datasetName,
  datasetPath,
  parsedDataset,
}) => {
  // Ahora lo guarda directamente mediante el endpoint de MySQL
  const numericUserId = Number(userId);
  if (!Number.isInteger(numericUserId)) {
    throw new Error('El id del usuario no es válido.');
  }

  const payload = {
    userId: numericUserId,
    analysisType,
    visualizationType,
    datasetName,
    datasetPath,
    parsedDataset,
    analysisSummary: {
      totalRegistros: parsedDataset.rowCount,
      totalAnomalias: 0, // El backend lo calculará
    }
  };

  const { data: resData, ok } = await getApiClient('/analysis/save', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (!ok || !resData?.success) {
    throw new Error(resData?.message || 'Error guardando análisis en el servidor MySQL');
  }

  return {
    idModelo: Number(resData.idModelo),
    idDataset: Number(resData.idDataset),
    idAnalisis: Number(resData.idAnalisis),
    totalRegistros: Number(resData.totalRegistros),
    totalAnomalias: Number(resData.totalAnomalias),
  };
};

export const fetchAnalysisHistoryByUser = async (userId) => {
  const numericUserId = Number(userId);
  if (!Number.isInteger(numericUserId)) return [];

  const resolveVisualizationTypeFromPath = (datasetPath) => {
    const rawPath = String(datasetPath || '');
    const match = rawPath.match(/(?:[?#|]viz=)(matriz_correlacion|histograma|dispersion|boxplot)/i);
    if (match?.[1]) {
      return match[1].toLowerCase();
    }
    return 'matriz_correlacion';
  };

  const resolveAnalysisTypeFromModel = (modelRow) => {
    const tipoModelo = String(modelRow?.tipo_modelo || '').toLowerCase();
    const descripcion = String(modelRow?.descripcion || '').toLowerCase();
    const nombreModelo = String(modelRow?.nombre_modelo || '').toLowerCase();
    const combined = `${tipoModelo} ${descripcion} ${nombreModelo}`;

    if (combined.includes('anomalia') || combined.includes('anomaly')) return 'anomalias';
    if (combined.includes('clustering') || combined.includes('kmeans')) return 'clustering';
    if (combined.includes('regresion') || combined.includes('regression') || combined.includes('regressor')) return 'regresion';
    if (combined.includes('clasificacion') || combined.includes('classification') || combined.includes('classifier')) return 'clasificacion';

    if (tipoModelo === 'clustering') return 'clustering';
    if (tipoModelo === 'regresion') return 'regresion';
    if (tipoModelo === 'clasificacion') return 'clasificacion';
    return 'analisis';
  };

  const { data: resData, ok } = await getApiClient('/api/analysis/history', {
    method: 'POST',
    body: JSON.stringify({ userId: numericUserId })
  });

  if (!ok || !resData?.success) {
    throw new Error(resData?.message || 'No fue posible consultar el historial de análisis.');
  }

  return (resData.data || []).map((item) => ({
    id: String(item.id_analisis),
    idAnalisis: Number(item.id_analisis),
    name: item.datasets?.nombre_archivo || `dataset_${item.id_analisis}.csv`,
    type: resolveAnalysisTypeFromModel(item.modelos),
    visualizationType: resolveVisualizationTypeFromPath(item.datasets?.ruta_archivo),
    date: item.fecha_analisis,
    status: 'completado',
    anomalies: Number(item.total_anomalias || 0),
    totalRecords: Number(item.total_registros || 0),
  }));
};
