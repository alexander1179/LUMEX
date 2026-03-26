// Script para diagnosticar el registro de usuarios
// Ejecuta desde console: import { diagnosticoRegistro } from './diagnostico_registro.js'; diagnosticoRegistro();

import { registerUser } from './src/services/supabase/authService';
import { supabase } from './src/services/supabase/supabaseClient';

export const diagnosticoRegistro = async () => {
  console.log('\n🔍 === DIAGNÓSTICO DE REGISTRO === 🔍\n');

  // 1. Verificar conexión a Supabase
  console.log('1️⃣ VERIFICANDO CONEXIÓN A SUPABASE:');
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.log('   ❌ Error de conexión:', error.message);
      return;
    }
    console.log('   ✅ Conexión a Supabase exitosa');
  } catch (e) {
    console.log('   ❌ Excepción:', e.message);
    return;
  }

  // 2. Verificar estructura de tabla usuarios
  console.log('\n2️⃣ VERIFICANDO ESTRUCTURA DE TABLA "usuarios":');
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1);

    if (error) {
      console.log('   ❌ Error:', error.message);
      return;
    }

    if (data && data.length > 0) {
      const columnas = Object.keys(data[0]);
      console.log('   ✅ Columnas encontradas:', columnas);
    } else {
      console.log('   ℹ️ Tabla vacía, pero existe');
      // Intentar insertar de prueba
      console.log('\n3️⃣ INTENTANDO INSERCIÓN DE PRUEBA:');
      
      const testUser = {
        nombre: 'Test User',
        email: `test${Date.now()}@test.com`,
        usuario: `testuser${Date.now()}`,
        contrasena: 'TestPass123!',
        telefono: '1234567890',
        fecha_registro: new Date().toISOString(),
        auth_uid: 'test-uid-12345',
      };

      console.log('   📦 Intentando insertar:', testUser);

      const { data: insertData, error: insertError } = await supabase
        .from('usuarios')
        .insert([testUser])
        .select();

      if (insertError) {
        console.log('   ❌ Error en inserción:', insertError.code, insertError.message);
        console.log('      Detalles:', insertError.details);
      } else {
        console.log('   ✅ Inserción exitosa:', insertData);
        
        // Limpiar
        await supabase
          .from('usuarios')
          .delete()
          .eq('email', testUser.email);
      }
    }
  } catch (e) {
    console.log('   ❌ Excepción:', e.message);
  }

  // 3. Simular un registro completo
  console.log('\n4️⃣ SIMULANDO REGISTRO COMPLETO:');
  try {
    const testEmail = `lumex${Date.now()}@test.com`;
    const testData = {
      name: 'Usuario Test',
      email: testEmail,
      username: `lumaUser${Date.now()}`,
      password: 'TestPass123!',
      phone: '1234567890',
    };

    console.log('   📝 Datos de prueba:', testData);
    console.log('   🔄 Registrando...');

    const result = await registerUser(testData);

    if (result.success) {
      console.log('   ✅ REGISTRO EXITOSO:', result.message);
      
      // Verificar que se guardó
      const { data: checkData, error: checkError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', testEmail)
        .single();

      if (checkError) {
        console.log('   ⚠️ Verificación: No se encontró en BD:', checkError.message);
      } else {
        console.log('   ✅ Verificado en BD:', checkData);
      }

      // Limpiar usuario de prueba
      await supabase.auth.admin.deleteUser(result.user?.id);
      await supabase
        .from('usuarios')
        .delete()
        .eq('email', testEmail);
      console.log('   🧹 Usuario de prueba eliminado');
    } else {
      console.log('   ❌ REGISTRO FALLÓ:', result.message);
    }
  } catch (e) {
    console.log('   ❌ Excepción:', e.message);
  }

  console.log('\n🔍 === FIN DEL DIAGNÓSTICO === 🔍\n');
};

// Auto-ejecutable para debugging
console.log('💡 Para diagnosticar el registro, ejecuta:');
console.log('   diagnosticoRegistro()');
