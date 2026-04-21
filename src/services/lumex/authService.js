import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiClient } from './apiClient';

const SESSION_KEY = 'lumex_user_session';

// Hash SHA-256 (igual al que usaba antes para mantener compatibilidad de hashes en DB)
export const hashPassword = async (password) => {
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
    const passwordHash = await hashPassword(userData.password);
    const body = {
      email: userData.email.trim().toLowerCase(),
      username: userData.username.trim().toLowerCase(),
      name: userData.name,
      phone: userData.phone,
      passwordHash
    };

    const { data, ok } = await getApiClient('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!ok) return { success: false, message: data?.message || 'Error en registro' };
    return { success: true, user: data.user, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const loginUser = async (identifier, password, acceptTermsIfNeeded = false, deviceInfo = null) => {
  try {
    const passwordHash = await hashPassword(password);
    
    const { data, ok } = await getApiClient('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, passwordHash }),
    });

    if (!ok) return { success: false, message: data?.message || 'Credenciales inválidas' };

    const { user, termsAccepted } = data;
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));

    if (!termsAccepted && acceptTermsIfNeeded) {
      await acceptSecurityTerms(user.id_usuario);
    }

    return { 
      success: true, 
      user, 
      termsAccepted: acceptTermsIfNeeded ? true : termsAccepted 
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getCurrentUser = async () => {
  try {
    const sessionStr = await AsyncStorage.getItem(SESSION_KEY);
    if (!sessionStr) return { success: false };
    const user = JSON.parse(sessionStr);

    const { data, ok } = await getApiClient('/api/auth/get-user', {
      method: 'POST',
      body: JSON.stringify({ userId: user.id_usuario }),
    });

    if (!ok) {
      await AsyncStorage.removeItem(SESSION_KEY);
      return { success: false };
    }

    return { success: true, user: data.user };
  } catch (error) {
    return { success: false };
  }
};

export const acceptSecurityTerms = async (userId) => {
  try {
    await getApiClient('/api/auth/accept-terms', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

export const fetchLatestUserData = async (userId) => {
  try {
    const { data, ok } = await getApiClient('/api/auth/get-user', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    return ok ? data.user : null;
  } catch { return null; }
};

export const deductCredit = async (userId) => {
  try {
    const { ok } = await getApiClient('/api/auth/deduct-credit', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    return ok;
  } catch { return false; }
};

export const addCredits = async (userId, amount, monto, metodoPago, descripcion) => {
  try {
    const result = await getApiClient('/api/auth/add-credits', {
      method: 'POST',
      body: JSON.stringify({ userId, amount, monto, metodoPago, descripcion }),
    });

    const { data, ok, message: clientMessage } = result;
    
    if (ok) {
      return { success: true, message: data?.message };
    } else {
      // Priorizar el mensaje del servidor, si no, usar el del cliente (error de conexión)
      return { success: false, message: data?.message || clientMessage || data?.detail };
    }
  } catch (error) { 
    return { success: false, message: error.message }; 
  }
};

export const forgotPassword = async (email) => {
  const { data, ok } = await getApiClient('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  return ok ? { success: true, message: data.message } : { success: false, message: data?.message };
};

export const verifyToken = async (email, token) => {
  const { data, ok } = await getApiClient('/api/auth/verify-token', {
    method: 'POST',
    body: JSON.stringify({ email, token }),
  });
  return ok ? { success: true } : { success: false, message: data?.message };
};

export const resetPassword = async (email, newPassword) => {
  try {
    const passwordHash = await hashPassword(newPassword);
    const { data, ok } = await getApiClient('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, passwordHash }),
    });
    return ok ? { success: true, message: data.message } : { success: false, message: data?.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// --- MÉTODOS DE ADMIN ---
export const fetchAllUsers = async () => {
  const { data, ok } = await getApiClient('/api/superadmin/users');
  return ok ? data.users : [];
};

export const updateAdminPermission = async (userId, field, value) => {
  const { data, ok } = await getApiClient('/api/superadmin/toggle-admin-permission', {
    method: 'POST',
    body: JSON.stringify({ id_usuario: userId, field, value: value ? 1 : 0 }),
  });
  return ok;
};

export const updateUserRole = async (userId, newRole) => {
  const { data, ok } = await getApiClient('/api/admin/update-role', {
    method: 'POST',
    body: JSON.stringify({ userId, newRole }),
  });
  return ok;
};

export const updateUser = async (userData) => {
  try {
    const { data, ok } = await getApiClient('/api/admin/update-user', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return { 
      success: ok, 
      message: data?.message || (ok ? 'Actualización exitosa' : 'Error al conectar con servidor') 
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteUser = async (userId) => {
  const { ok } = await getApiClient(`/api/admin/user/${userId}`, {
    method: 'DELETE',
  });
  return ok;
};


