import { Platform } from 'react-native';

// URL DE PRODUCCIÓN DEFINITIVA
const ENV_API_URL = 'https://lumex-production.up.railway.app';

export const API_URL = ENV_API_URL;

export const getApiUrl = () => {
  console.log('Solicitando URL de API:', ENV_API_URL);
  return ENV_API_URL;
};

export const getApiUrlCandidates = () => {
  return [ENV_API_URL];
};

export default {
  API_URL,
  getApiUrl,
  getApiUrlCandidates
};