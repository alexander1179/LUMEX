// src/services/supabase/paymentService.js
import { supabase } from './supabaseClient';

/**
 * Registra un registro de pago en la tabla 'pagos'
 */
export const registerPayment = async (userId, amount, description, creditsToAdd) => {
  try {
    const { data: user } = await supabase
      .from('usuarios')
      .select('nombre, email, id_usuario')
      .eq('id_usuario', userId)
      .maybeSingle();

    if (!user) throw new Error('Usuario no encontrado');

    // 1. Insertar el registro de pago
    const { data: payment, error: paymentError } = await supabase
      .from('pagos')
      .insert([{
        id_usuario: userId,
        monto: amount,
        moneda: 'USD',
        descripcion: description,
        estado: 'completado', // Simulado para este desarrollo
        metodo_pago: 'tarjeta',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (paymentError) throw paymentError;

    // 2. Registrar el evento en pagos_eventos
    await supabase
      .from('pagos_eventos')
      .insert([{
        id_pago: payment.id_pago,
        tipo_evento: 'pago_exitoso_creditado',
        data: { credits_added: creditsToAdd },
        created_at: new Date().toISOString(),
      }]);

    // 3. Actualizar los créditos en la tabla usuarios (analisis_disponibles)
    // Usamos rpc() si existe una función de incremento, o select + update
    const { data: userData } = await supabase
      .from('usuarios')
      .select('analisis_disponibles')
      .eq('id_usuario', userId)
      .single();

    const currentCredits = userData?.analisis_disponibles || 0;
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ analisis_disponibles: currentCredits + creditsToAdd })
      .eq('id_usuario', userId);

    if (updateError) throw updateError;

    return { success: true, payment };
  } catch (error) {
    console.error('Error al registrar pago:', error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Descuenta un crédito de análisis cuando el usuario inicia uno
 */
export const consumeAnalysisCredit = async (userId) => {
  try {
    const { data: userData } = await supabase
      .from('usuarios')
      .select('analisis_disponibles')
      .eq('id_usuario', userId)
      .single();

    const currentCredits = userData?.analisis_disponibles || 0;
    if (currentCredits <= 0) return { success: false, message: 'No tienes créditos suficientes' };

    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ analisis_disponibles: currentCredits - 1 })
      .eq('id_usuario', userId);

    if (updateError) throw updateError;
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Obtiene todos los pagos registrados con información del usuario
 */
export const getAllPayments = async () => {
  try {
    const { data, error } = await supabase
      .from('pagos')
      .select('*, usuarios(nombre, email)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener pagos:', error.message);
    return { success: false, message: error.message };
  }
};
