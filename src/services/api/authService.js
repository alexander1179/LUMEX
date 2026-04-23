import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiClient } from './apiClient';

const SESSION_KEY = 'lumex_user_session';

const hashPassword = async (password) => {
  try {
    const encoder = new TextEncoder();
    const buf = encoder.encode(String(password));
    const hashBuffer = await global.crypto.subtle.digest('SHA-256', buf);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let h = 5381;
    const s = String(password);
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
    return Math.abs(h).toString(16).padStart(8, '0').repeat(8);
  }
};

export const registerUser = async (userData) => {
  try {
    let email = (userData.email || userData.usuario || userData.username || '').trim().toLowerCase();
    let username = (userData.username || userData.usuario || '').trim().toLowerCase();
    const name = (userData.name || userData.nombre || '').trim();
    const phone = (userData.phone || userData.telefono || '').trim() || null;

    const passwordHash = await hashPassword(userData.password);
    const rol = (userData.rol || 'usuario').toLowerCase();

    const terminos_aceptados = userData.terminos_aceptados || userData.acepta || false;
    const { data: resData, ok } = await getApiClient('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, name, phone, passwordHash, rol, terminos_aceptados }),
    });

    if (!ok || !resData?.success) {
      return { success: false, message: resData?.message || 'Error en registro' };
    }

    return { success: true, user: resData.user, message: resData.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const loginUser = async (identifier, password, acceptTermsIfNeeded = false, deviceInfo = null, options = {}) => {
  try {
    const { requiredRole = null } = options;
    const passwordHash = await hashPassword(password);

    const { data: resData, ok, error: netError } = await getApiClient('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, passwordHash, requiredRole }),
    });

    // Sin datos = error de red o timeout
    if (!resData) {
      return { success: false, message: netError || 'No se pudo conectar al servidor. Verifica tu red.' };
    }

    if (!ok || !resData?.success) {
      return { success: false, message: resData?.message || 'Error de login' };
    }

    const { user, termsAccepted } = resData;

    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));

    if (!termsAccepted && acceptTermsIfNeeded) {
      await acceptSecurityTerms(user.id_usuario, deviceInfo);
    }

    return { success: true, user, termsAccepted: acceptTermsIfNeeded ? true : termsAccepted };
  } catch (error) {
    return { success: false, message: error.message };
  }
};


export const forgotPassword = async (email) => {
  try {
    const { data: resData, ok } = await getApiClient('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (!ok || !resData?.success) {
      return { success: false, message: resData?.message || 'Error enviando correo' };
    }
    return { success: true, message: resData.message, email };
  } catch (error) {
    return { success: false, message: error.message };
  }
};


export const verifyToken = async (email, token) => {
  try {
    const { data: resData, ok } = await getApiClient('/api/auth/verify-token', {
      method: 'POST',
      body: JSON.stringify({ email, token }),
    });
    if (!ok || !resData?.success) return { success: false, message: resData?.message || 'Error código inválido' };

    // Guardar temporalmente el email en sesion para el paso 3 (Reset)
    await AsyncStorage.setItem('recovery_email', email);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const resetPassword = async (email, newPassword) => {
  try {
    // Si solo llega un argumento por compatibilidad, asumimos que es newPassword
    if (!newPassword) {
      newPassword = email;
      email = await AsyncStorage.getItem('recovery_email');
    }
    
    const passwordHash = await hashPassword(newPassword);
    if (!email) throw new Error('No hay sesión de recuperación pendiente.');

    const { data: resData, ok } = await getApiClient('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, passwordHash }),
    });

    if (!ok || !resData?.success) return { success: false, message: resData?.message || 'Error actualizando contraseña' };

    await AsyncStorage.removeItem('recovery_email');
    return { success: true, message: resData.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
    return { success: true, message: 'Sesión cerrada' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getCurrentUser = async () => {
  try {
    const sessionStr = await AsyncStorage.getItem(SESSION_KEY);
    if (!sessionStr) return { success: false, message: 'No hay sesión activa' };
    const user = JSON.parse(sessionStr);

    const { data: resData, ok } = await getApiClient('/api/auth/get-user', {
      method: 'POST',
      body: JSON.stringify({ userId: user.id_usuario }),
    });

    if (!ok || !resData?.success) {
      await AsyncStorage.removeItem(SESSION_KEY);
      return { success: false, message: 'Sesión expirada' };
    }

    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(resData.user));
    return { success: true, user: resData.user };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const acceptSecurityTerms = async (userId, deviceInfo = null) => {
  try {
    const { data: resData, ok } = await getApiClient('/api/auth/accept-terms', {
      method: 'POST',
      body: JSON.stringify({ userId, deviceInfo }),
    });
    if (!ok || !resData?.success) return { success: false };
    return { success: true, message: 'Términos aceptados' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const checkTermsAcceptance = async (userId) => {
  try {
    const { data: resData, ok } = await getApiClient('/api/auth/check-terms', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    if (!ok || !resData?.success) return { success: true, accepted: false };
    return { success: true, accepted: resData.accepted, acceptanceDate: resData.acceptanceDate };
  } catch (error) {
    return { success: true, accepted: false };
  }
};

/**
 * Obtiene los datos frescos del usuario desde el servidor.
 * @param {number} userId
 * @returns {Promise<object|null>}
 */
export const fetchLatestUserData = async (userId) => {
  try {
    const { data, ok } = await getApiClient('/api/auth/get-user', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    return ok && data?.user ? data.user : null;
  } catch {
    return null;
  }
};
