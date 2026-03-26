// Script de prueba para verificar políticas de seguridad
// Ejecuta este script desde la consola de React Native para probar la funcionalidad

import { acceptSecurityTerms, checkTermsAcceptance, loginUser, registerUser } from './src/services/supabase/authService';
import { supabase } from './src/services/supabase/supabaseClient';

export const testSecurityPolicies = async () => {
  console.log('🧪 Iniciando pruebas de políticas de seguridad...');

  try {
    // Prueba 1: Verificar función aceptar_terminos_seguridad
    console.log('📋 Prueba 1: Probando función aceptar_terminos_seguridad');
    const testUserId = 'test-user-id'; // Reemplaza con un ID real para pruebas

    const acceptResult = await acceptSecurityTerms(testUserId, {
      platform: 'test',
      version: '1.0',
      model: 'Test Device'
    });

    if (acceptResult.success) {
      console.log('✅ Función aceptar_terminos_seguridad funciona correctamente');
    } else {
      console.log('❌ Error en función aceptar_terminos_seguridad:', acceptResult.message);
    }

    // Prueba 2: Verificar checkTermsAcceptance
    console.log('📋 Prueba 2: Probando checkTermsAcceptance');
    const checkResult = await checkTermsAcceptance(testUserId);

    if (checkResult.success) {
      console.log('✅ checkTermsAcceptance funciona - Aceptado:', checkResult.accepted);
    } else {
      console.log('❌ Error en checkTermsAcceptance:', checkResult.message);
    }

    // Prueba 3: Verificar políticas RLS
    console.log('📋 Prueba 3: Probando políticas RLS');

    // Intentar consultar datos sin términos aceptados (debería fallar si RLS está activo)
    const { data: rlsTest, error: rlsError } = await supabase
      .from('usuarios')
      .select('id_usuario, acepta_terminos')
      .limit(1);

    if (rlsError) {
      console.log('ℹ️ RLS está activo - Error esperado:', rlsError.message);
    } else {
      console.log('⚠️ RLS podría no estar activo - Se obtuvieron datos:', rlsTest);
    }

    // Prueba 4: Verificar tabla politicas_seguridad
    console.log('📋 Prueba 4: Verificando tabla politicas_seguridad');
    const { data: policiesData, error: policiesError } = await supabase
      .from('politicas_seguridad')
      .select('*')
      .limit(5);

    if (policiesError) {
      console.log('❌ Error consultando politicas_seguridad:', policiesError.message);
    } else {
      console.log('✅ Tabla politicas_seguridad existe - Registros encontrados:', policiesData?.length || 0);
    }

    console.log('🎉 Pruebas completadas');

  } catch (error) {
    console.log('❌ Error en pruebas:', error.message);
  }
};

// Función para probar registro con términos
export const testRegistrationWithTerms = async () => {
  console.log('📝 Probando registro con aceptación de términos...');

  const testUser = {
    name: 'Usuario Test',
    email: `test${Date.now()}@example.com`,
    username: `testuser${Date.now()}`,
    password: 'TestPass123!',
    acceptTerms: true
  };

  try {
    const result = await registerUser(testUser);

    if (result.success) {
      console.log('✅ Registro con términos exitoso');

      // Verificar que se registraron los términos
      const termsCheck = await checkTermsAcceptance(result.user.id);
      if (termsCheck.success && termsCheck.accepted) {
        console.log('✅ Términos registrados correctamente en BD');
      } else {
        console.log('❌ Términos no se registraron correctamente');
      }
    } else {
      console.log('❌ Error en registro:', result.message);
    }
  } catch (error) {
    console.log('❌ Error en prueba de registro:', error.message);
  }
};

// Ejecutar pruebas (descomenta las líneas que quieras probar)
// testSecurityPolicies();
// testRegistrationWithTerms();