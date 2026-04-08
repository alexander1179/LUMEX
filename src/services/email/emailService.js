// src/services/email/emailService.js
import { getApiUrlCandidates, endpoints } from '../services/api/apiConfig';

/**
 * Servicio de envío de notificaciones por correo electrónico a través del backend de Lumex.
 * Utiliza la misma infraestructura SMTP que la recuperación de contraseña.
 */

/**
 * Envía el correo electrónico de confirmación de pago invocando al servidor de Lumex
 */
export const sendPaymentConfirmationEmail = async (userEmail, userName, planTitle, credits, amount) => {
  const apiUrls = getApiUrlCandidates();
  let lastError = null;

  for (const apiUrl of apiUrls) {
    try {
      const endpoint = endpoints.paymentConfirmEmail || '/payment/confirm-email';
      const fullUrl = `${apiUrl}${endpoint}`;

      console.log(`📧 Intentando envío de correo vía: ${fullUrl}`);

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': '1',
        },
        body: JSON.stringify({
          email: userEmail,
          name: userName,
          planTitle: planTitle,
          credits: credits,
          amount: amount,
        }),
      });

      // Validar si la respuesta es JSON antes de parsear
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`El servidor en ${apiUrl} devolvió una respuesta no válida (posiblemente túnel caído).`);
      }

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'El servidor no pudo enviar el correo.');
      }

      console.log(`✅ Correo enviado exitosamente vía: ${apiUrl}`);
      return { success: true };
    } catch (error) {
      console.warn(`⚠️ Falló intento con ${apiUrl}:`, error.message);
      lastError = error;
    }
  }

  console.error('❌ Todos los intentos de envío de email fallaron.');
  return { success: false, message: lastError?.message || 'Error de conexión con el servidor.' };
};
