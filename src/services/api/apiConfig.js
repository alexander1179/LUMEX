// src/services/api/apiConfig.js
// Stub de compatibilidad para código que aún usa getApiUrl()
// La URL base real la gestiona apiClient.js

import { getBaseUrl } from './apiClient';

/**
 * Retorna la URL base del servidor de la API.
 * @returns {string}
 */
export const getApiUrl = () => {
  let url = getBaseUrl();
  if (url.endsWith('/')) url = url.slice(0, -1);
  return `${url}/api`;
};

export default getApiUrl;
