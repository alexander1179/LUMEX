// Script para diagnosticar problemas de Supabase
// Ejecuta desde la consola de React Native: import { diagnosticarSupabase } from './diagnostic.js'; diagnosticarSupabase();

import { supabase } from './src/services/supabase/supabaseClient';
import { SUPABASE_CONFIG } from './src/config/supabaseConfig';

export const diagnosticarSupabase = async () => {
  console.log('\n🔍 === DIAGNÓSTICO DE SUPABASE === 🔍\n');

  // 1. Verificar configuración
  console.log('1️⃣ VALIDACIÓN DE CONFIGURACIÓN:');
  console.log('   URL:', SUPABASE_CONFIG.URL || '❌ NO CONFIGURADA');
  console.log('   API KEY:', SUPABASE_CONFIG.ANON_KEY ? '✅ Configurada' : '❌ NO CONFIGURADA');
  
  if (SUPABASE_CONFIG.ANON_KEY) {
    const keyPreview = SUPABASE_CONFIG.ANON_KEY.substring(0, 20) + '...';
    console.log('   KEY Preview:', keyPreview);
  }

  // 2. Probar conexión básica
  console.log('\n2️⃣ PRUEBA DE CONEXIÓN:');
  try {
    const { data, error, status } = await supabase
      .from('usuarios')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.log('   ❌ ERROR:');
      console.log('      Código:', error.code);
      console.log('      Mensaje:', error.message);
      console.log('      Status:', status);

      // Diagnóstico específico
      if (error.message.includes('No API key')) {
        console.log('\n   🔴 PROBLEMA IDENTIFICADO:');
        console.log('      La API key NO se está enviando');
        console.log('      Soluciones:');
        console.log('      1. Verifica que ANON_KEY esté completo en supabaseConfig.js');
        console.log('      2. Regenera la key en Supabase dashboard');
        console.log('      3. Reinicia la aplicación después de cambiar credenciales');
      }

      if (error.message.includes('Invalid JWT')) {
        console.log('\n   🔴 PROBLEMA IDENTIFICADO:');
        console.log('      La API key es inválida o expiró');
        console.log('      Solución: Haz una copia nueva en Supabase dashboard');
      }

      if (error.message.includes('404')) {
        console.log('\n   🔴 PROBLEMA IDENTIFICADO:');
        console.log('      URL incorrecta o tabla "usuarios" no existe');
        console.log('      Solución: Verifica la URL y que la tabla esté creada');
      }
    } else {
      console.log('   ✅ Conexión exitosa');
    }
  } catch (exception) {
    console.log('   ❌ EXCEPCIÓN:', exception.message);
  }

  // 3. Probar acceso a auth
  console.log('\n3️⃣ PRUEBA DE AUTENTICACIÓN:');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.log('   ⚠️ No hay usuario autenticado:', error.message);
    } else if (user) {
      console.log('   ✅ Usuario autenticado:', user.email);
    } else {
      console.log('   ℹ️ Sin usuario autenticado (normal en registro/login fresco)');
    }
  } catch (exception) {
    console.log('   ❌ EXCEPCIÓN:', exception.message);
  }

  // 4. Probar consulta directa
  console.log('\n4️⃣ PRUEBA DE CONSULTA DIRECTA:');
  try {
    const { data, error, status } = await supabase
      .from('usuarios')
      .select('id_usuario')
      .limit(1);

    if (error) {
      console.log('   ❌ Error en consulta:', error.message);
      console.log('      Status:', status);
    } else {
      console.log('   ✅ Consulta exitosa');
      console.log('      Registros encontrados:', data?.length || 0);
    }
  } catch (exception) {
    console.log('   ❌ EXCEPCIÓN:', exception.message);
  }

  console.log('\n🔍 === FIN DEL DIAGNÓSTICO === 🔍\n');
};

// Ejecutar automáticamente al importar en desarrollo
console.log('💡 Para diagnosticar problemas, ejecuta en consola:');
console.log('   diagnosticarSupabase()');
