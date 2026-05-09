import { Platform } from 'react-native';

const normalizeUrl = (url) => String(url || '').trim().replace(/\/$/, '');

const ENV_API_URL = 'https://lumex-production.up.railway.app';

// Exportar la URL correcta según el dispositivo
export const getApiUrl = () => {
  return ENV_API_URL;
};

export const getApiUrlCandidates = () => {
  return [ENV_API_URL];
};