// src/services/lumex.js
import { getApiClient } from './apiClient';

/**
 * Registra un pago en la base de datos MySQL
 * @param {string|number} userId 
 * @param {number} amount 
 * @param {string} description 
 * @param {number} credits 
 */
export const registerPayment = async (userId, amount, description, credits) => {
  try {
    const { data, ok } = await getApiClient('/api/payments/register', {
      method: 'POST',
      body: JSON.stringify({ userId, amount, description, credits }),
    });

    if (!ok) return { success: false, message: data?.message || 'Error registrando pago' };
    return { success: true, message: data.message };
  } catch (error) {
    console.error('Error en registerPayment:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Obtiene el historial de pagos de un usuario
 * @param {string|number} userId 
 */
export const fetchPaymentHistory = async (userId) => {
  try {
    const { data, ok } = await getApiClient('/api/payments/history', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    return ok ? data.data : [];
  } catch (error) {
    return [];
  }
};
