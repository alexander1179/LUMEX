// src/services/supabase/supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_CONFIG } from '../../config/supabaseConfig';

const SUPABASE_URL = SUPABASE_CONFIG.URL;
const SUPABASE_ANON_KEY = SUPABASE_CONFIG.ANON_KEY;

// Validar configuración
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ ERROR: Credenciales de Supabase no configuradas correctamente');
  console.error('URL:', SUPABASE_URL || 'NO CONFIGURADA');
  console.error('KEY:', SUPABASE_ANON_KEY ? 'OK' : 'NO CONFIGURADA');
  throw new Error('Configuración de Supabase incompleta. Revisa src/config/supabaseConfig.js');
}

console.log('🔧 URL de Supabase:', SUPABASE_URL);
console.log('🔑 Clave anónima configurada: ✅');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  }
});

// Función de prueba directa con diagnóstico detallado
export const testConnection = async () => {
  try {
    console.log('📡 Probando conexión a Supabase...');
    console.log('URL:', SUPABASE_URL);
    console.log('API Key presente:', !!SUPABASE_ANON_KEY);
    
    const { data, error, status } = await supabase
      .from('usuarios')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Error:', error);
      console.log('Código de error:', error.code);
      console.log('Mensaje:', error.message);
      console.log('Status:', status);
      
      // Diagnóstico específico
      if (error.message.includes('No API key')) {
        console.log('🔴 PROBLEMA: La API key no se está enviando correctamente');
        console.log('Solución: Verifica que SUPABASE_ANON_KEY esté configurado en supabaseConfig.js');
      }
      
      return false;
    }
    
    console.log('✅ Conexión exitosa');
    return true;
  } catch (error) {
    console.log('❌ Excepción:', error.message);
    return false;
  }
};