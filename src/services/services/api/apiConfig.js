// src/services/api/apiConfig.js
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Obtener la IP local de tu computadora
// Reemplaza con la IP de tu computadora (ejecuta 'ipconfig' en Windows o 'ifconfig' en Mac/Linux)
const LOCAL_IP = '10.157.28.88'; // 🔥 CAMBIA ESTA IP POR LA TUYA

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
  if (Platform.OS === 'web') return 'http://localhost:3000';
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return `http://${LOCAL_IP}:3000`;
};

export const endpoints = {
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  verifyToken: '/verify-token',
  resetPassword: '/reset-password',
};