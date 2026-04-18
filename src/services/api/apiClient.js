import { Platform } from 'react-native';
import Constants from 'expo-constants';

// IP local de la máquina de desarrollo — actualizar si cambia la red
const LOCAL_IP = '192.168.20.141';

const TIMEOUT_MS = 10000; // 10 segundos máximo de espera

const normalizeUrl = (url) => String(url || '').trim().replace(/\/$/, '');

const ENV_API_URL = normalizeUrl(
  process.env.EXPO_PUBLIC_API_URL ||
  Constants?.expoConfig?.extra?.apiUrl ||
  ''
);

/**
 * Retorna la URL base correcta según la plataforma y entorno.
 */
export const getBaseUrl = () => {
  if (ENV_API_URL) return ENV_API_URL;

  if (Platform.OS === 'web') return 'http://localhost:3000';
  if (Platform.OS === 'android') return `http://${LOCAL_IP}:3000`;
  return `http://${LOCAL_IP}:3000`;
};

/**
 * Cliente HTTP central con timeout y manejo robusto de errores.
 * Retorna { ok, status, data } siempre — nunca lanza excepción.
 */
export const getApiClient = async (endpoint, options = {}) => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timer);
    const json = await response.json();
    return { ok: response.ok, status: response.status, data: json };
  } catch (error) {
    clearTimeout(timer);
    const isTimeout = error?.name === 'AbortError';
    const message = isTimeout
      ? 'La conexión al servidor tardó demasiado. Verifica que el servidor esté activo.'
      : error.message;

    console.error(`[API] Error en ${url}:`, message);
    return { ok: false, status: isTimeout ? 408 : 500, error: message, data: null };
  }
};
