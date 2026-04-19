// src/services/api/apiConfig.js
// Stub de compatibilidad para código que aún usa getApiUrl()
// La URL base real la gestiona apiClient.js

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

/**
 * Retorna la URL base del servidor de la API.
 * @returns {string}
 */
export const getApiUrl = () => {
  let url = BASE_URL;
  if (url.endsWith('/')) url = url.slice(0, -1);
  return url;
};

export default getApiUrl;
