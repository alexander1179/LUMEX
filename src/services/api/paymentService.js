import { getApiClient } from './apiClient';

export const registerPayment = async (userId, amount, description, creditsToAdd) => {
  try {
    const { data: resData, ok } = await getApiClient('/api/payments/register', {
      method: 'POST',
      body: JSON.stringify({ userId, amount, description, creditsToAdd }),
    });

    if (!ok || !resData?.success) {
      return { success: false, message: resData?.message || 'Error registrando pago' };
    }

    return { success: true, payment: resData.payment };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const consumeAnalysisCredit = async (userId) => {
  try {
    const { data: resData, ok } = await getApiClient('/api/payments/consume', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });

    if (!ok || !resData?.success) {
      return { success: false, message: resData?.message || 'Error al descontar crédito' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getAllPayments = async () => {
  try {
    const { data: resData, ok } = await getApiClient('/api/payments/all', {
      method: 'GET'
    });

    if (!ok || !resData?.success) {
      return { success: false, message: resData?.message || 'Error consultando pagos' };
    }

    return { success: true, data: resData.data };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
