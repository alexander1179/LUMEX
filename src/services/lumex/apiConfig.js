// src/services/lumex.js
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Obtener la IP local de tu computadora
// Reemplaza con la IP de tu computadora (ejecuta 'ipconfig' en Windows o 'ifconfig' en Mac/Linux)
const LOCAL_IP = '192.168.20.142'; // 🔥 IP actualizada según ipconfig

const normalizeUrl = (url) => String(url || '').trim().replace(/\/$/, '');

const ENV_API_URL = normalizeUrl(
  process.env.EXPO_PUBLIC_API_URL ||
  Constants?.expoConfig?.extra?.apiUrl ||
  ''
);

// Para desarrollo en dispositivo físico
export const API_URL = Platform.OS === "web" 
  ? "http://localhost:3000" 
  : `http://${LOCAL_IP}:3000`;

// Para desarrollo en emulador Android
export const API_URL_ANDROID = Platform.OS === "android" 
  ? "http://10.0.2.2:3000" 
  : `http://${LOCAL_IP}:3000`;

// Exportar la URL correcta según el dispositivo
export const getApiUrl = () => {
  const candidates = getApiUrlCandidates();
  return candidates[0] || 'http://localhost:3000';
};

export const getApiUrlCandidates = () => {
  if (ENV_API_URL) {
    // Si el usuario define una URL pública, la usamos como única fuente
    // para evitar reintentos lentos a IPs locales no alcanzables.
    return [ENV_API_URL];
  }

  const urls = [];

  if (Platform.OS === 'web') {
    urls.push('http://localhost:3000');
  } else if (Platform.OS === 'android') {
    urls.push(`http://${LOCAL_IP}:3000`);
    urls.push('http://10.0.2.2:3000');
  } else {
    urls.push(`http://${LOCAL_IP}:3000`);
  }

  return Array.from(new Set(urls.map(normalizeUrl).filter(Boolean)));
};

export const endpoints = {
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  verifyToken: '/verify-token',
  resetPassword: '/reset-password',
};