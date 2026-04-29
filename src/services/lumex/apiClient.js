// src/services/lumex/apiClient.js
import { getApiUrlCandidates } from './apiConfig';

/**
 * Cliente de API inteligente que intenta conectarse a múltiples candidatos 
 * de URL (Host local, IP Local, Emulador) hasta encontrar uno que responda.
 */
export async function getApiClient(endpoint, options = {}) {
  const candidates = getApiUrlCandidates();
  let lastError = null;

  for (const baseUrl of candidates) {
    const url = `${baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    // Timeout por cada intento (5 segundos es suficiente para fallback rápido)
    const timeoutMs = options.timeout || 15000; 
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = response.status === 204 ? null : await response.json().catch(() => ({}));
      
      return {
        data,
        ok: response.ok,
        status: response.status,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      const isTimeout = error.name === 'AbortError';
      // Solo logueamos si fallan todos, o guardamos para reporte final
      console.warn(`⚠️ Intento fallido en [${url}]:`, isTimeout ? 'Timeout' : error.message);
      // Continuamos al siguiente candidato
    }
  }

  // Si llegamos aquí, fallaron todos los candidatos
  console.error(`❌ Todos los candidatos de API fallaron (${endpoint})`);
  const isTimeout = lastError?.name === 'AbortError';
  
  return {
    success: false,
    message: isTimeout ? 'Se agotó el tiempo de espera (todos los nodos)' : 'No se pudo conectar con ningún servidor local',
    ok: false,
    status: isTimeout ? 408 : 503
  };
}
