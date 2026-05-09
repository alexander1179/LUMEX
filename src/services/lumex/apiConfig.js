// src/services/lumex.js
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Obtener la IP local de tu computadora
// Reemplaza con la IP de tu computadora (ejecuta 'ipconfig' en Windows o 'ifconfig' en Mac/Linux)
// ⚠️ IMPORTANTE: El celular DEBE estar conectado a la misma red Wi-Fi que el PC (hitronhub.home)
const LOCAL_IP = '10.157.25.163'; // 🔥 IP del PC en la red Wi-Fi hitronhub

const normalizeUrl = (url) => String(url || '').trim().replace(/\/$/, '');

const ENV_API_URL = 'https://lumex-production.up.railway.app';

// Exportar la URL correcta según el dispositivo
export const getApiUrl = () => {
  return ENV_API_URL;
};

export const getApiUrlCandidates = () => {
  return [ENV_API_URL];
};

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