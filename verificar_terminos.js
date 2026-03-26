// Script para verificar que las columnas de términos existen en Supabase
// Ejecuta este script desde la consola de React Native

import { supabase } from './src/services/supabase/supabaseClient';

export const verificarColumnasTerminos = async () => {
  console.log('🔍 Verificando columnas de términos en Supabase...');

  try {
    // Verificar columnas en tabla usuarios
    console.log('📋 Verificando tabla usuarios...');
    const { data: usuariosData, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id_usuario, acepta_terminos, fecha_aceptacion_terminos')
      .limit(1);

    if (usuariosError) {
      console.log('❌ Error consultando usuarios:', usuariosError.message);
      if (usuariosError.message.includes('acepta_terminos')) {
        console.log('🚨 La columna acepta_terminos NO existe. Ejecuta el script SQL.');
        return false;
      }
    } else {
      console.log('✅ Columnas de términos existen en usuarios');
      console.log('📊 Datos de ejemplo:', usuariosData);
    }

    // Verificar función RPC
    console.log('📋 Verificando función aceptar_terminos_seguridad...');
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('aceptar_terminos_seguridad', {
        p_usuario_id: 1,
        p_politica_version: '1.0'
      });

      if (rpcError) {
        console.log('⚠️ Función RPC no disponible o usuario no existe:', rpcError.message);
      } else {
        console.log('✅ Función RPC funciona correctamente');
      }
    } catch (rpcTestError) {
      console.log('⚠️ Función RPC no disponible:', rpcTestError.message);
    }

    // Verificar tabla politicas_seguridad
    console.log('📋 Verificando tabla politicas_seguridad...');
    try {
      const { data: politicasData, error: politicasError } = await supabase
        .from('politicas_seguridad')
        .select('*')
        .limit(1);

      if (politicasError) {
        console.log('⚠️ Tabla politicas_seguridad no disponible:', politicasError.message);
      } else {
        console.log('✅ Tabla politicas_seguridad existe');
      }
    } catch (politicasTestError) {
      console.log('⚠️ Tabla politicas_seguridad no disponible:', politicasTestError.message);
    }

    console.log('🎉 Verificación completada');
    return true;

  } catch (error) {
    console.log('❌ Error en verificación:', error.message);
    return false;
  }
};

// Para ejecutar desde la consola:
// import { verificarColumnasTerminos } from './verificar_terminos.js';
// verificarColumnasTerminos();