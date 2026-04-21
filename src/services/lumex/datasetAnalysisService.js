// src/services/lumex.js
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

export const isDatasetFileSupported = (asset) => {
  const name = (asset?.name || '').toLowerCase();
  const mime = (asset?.mimeType || '').toLowerCase();
  return (
    name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls') ||
    mime.includes('csv') || mime.includes('spreadsheet') || mime.includes('excel')
  );
};

export const readDatasetAsset = async (asset) => {
  if (!asset?.uri) throw new Error('No fue posible leer el archivo seleccionado.');
  
  const name = asset.name || '';
  const isExcel = name.toLowerCase().endsWith('.xlsx') || name.toLowerCase().endsWith('.xls');
  let csvContent = '';

  if (isExcel) {
    const base64Content = await FileSystem.readAsStringAsync(asset.uri, { encoding: FS_ENCODING.base64 });
    const workbook = XLSX.read(base64Content, { type: 'base64' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) throw new Error('El archivo Excel no contiene hojas.');
    csvContent = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheetName]);
  } else {
    csvContent = await FileSystem.readAsStringAsync(asset.uri, { encoding: FS_ENCODING.utf8 });
  }

  const parsed = parseDatasetContent(csvContent);
  return {
    fileName: name || 'dataset.csv',
    fileUri: asset.uri,
    fileSize: asset.size ?? csvContent.length,
    format: isExcel ? 'excel' : 'csv',
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
  // NOTA: Mantenemos el nombre de la función exportada para compatibilidad con MainScreen.js
  // Pero ahora envía los datos a nuestro servidor MySQL.
  try {
    const { data, ok } = await getApiClient('/api/analysis/save', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        analysisType,
        visualizationType,
        datasetName,
        datasetPath,
        totalRegistros: parsedDataset.rowCount,
        totalAnomalias: Math.round(parsedDataset.rowCount * 0.1), // Simulación o lógica de servidor
      }),
    });

    if (!ok) throw new Error(data?.message || 'Error guardando análisis');
    return {
      idAnalisis: data.idAnalisis,
      totalRegistros: parsedDataset.rowCount,
      totalAnomalias: data.totalAnomalias || 0,
      status: 'completado'
    };
  } catch (error) {
    console.error('Error en saveAnalysis:', error);
    throw error;
  }
};

export const fetchAnalysisHistoryByUser = async (userId) => {
  try {
    const { data, ok } = await getApiClient('/api/analysis/history', {
      method: 'POST',
      body: JSON.stringify({ userId: Number(userId) }),
    });
    if (!ok) return [];
    
    // El servidor devuelve { success: true, data: [...] }
    const historyData = data?.data || [];
    console.log(`[SERVICE] Historial recibido: ${historyData.length} items`);
    
    return historyData.map(item => ({
      id: String(item.id_analisis),
      idAnalisis: item.id_analisis,
      name: item.nombre_archivo || `analisis_${item.id_analisis}.csv`,
      type: 'analisis',
      date: item.fecha_analisis,
      status: 'completado',
      anomalies: item.total_anomalias || 0,
      totalRecords: item.total_registros || 0,
      visualizationType: item.visualization_type,
    }));
  } catch (error) {
    console.error('Error fetching history:', error);
    return [];
  }
};
