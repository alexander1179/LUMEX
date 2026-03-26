// 🧪 PRUEBA RÁPIDA: Intenta registrar un usuario
// Ejecuta en consola: import { pruebaRegistroRapida } from './prueba_registro.js'; pruebaRegistroRapida();

import { supabase } from './src/services/supabase/supabaseClient';

export const pruebaRegistroRapida = async () => {
  console.log('\n🚀 === PRUEBA RÁPIDA DE REGISTRO === 🚀\n');

  const timestamp = Date.now();
  const testUser = {
    nombre: 'Test Usuario',
    email: `test${timestamp}@lumex.com`,
    usuario: `testuser${timestamp}`,
    contrasena: 'TestPass123!',
    telefono: '3001234567',
    fecha_registro: new Date().toISOString(),
    auth_uid: `auth${timestamp}`,
  };

  console.log('📦 DATOS A REGISTRAR:');
  console.log('  Nombre:', testUser.nombre);
  console.log('  Email:', testUser.email);
  console.log('  Usuario:', testUser.usuario);
  console.log('  Teléfono:', testUser.telefono);

  console.log('\n⏳ Registrando usuario en Supabase Auth...\n');

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.contrasena,
      options: {
        data: {
          name: testUser.nombre,
          username: testUser.usuario,
          phone: testUser.telefono,
        }
      }
    });

    if (authError) {
      console.log('❌ ERROR AL REGISTRAR EN AUTH: ', authError.message);
      if (authError.message.includes('already registered')) {
        console.log('⚠️ El email ya existe. Se puede intentar login o eliminar manualmente en Supabase.');
      }
      return false;
    }

    let authUser = authData.user;

    if (!authUser?.id) {
      console.log('❌ No se obtuvo auth.user.id');
      return false;
    }

    // Garantizar que la sesión esté activa antes de insertar (RLS require auth.uid() válida)
    if (!authData.session) {
      console.log('🔐 signUp no retornó sesión. forzando signInWithPassword...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.contrasena,
      });

      if (signInError) {
        console.log('❌ Error forzando login tras signUp:', signInError.message);
        return false;
      }
      authUser = signInData.user;
    }

    testUser.auth_uid = authUser.id;

    console.log('\n⏳ Registrando en tabla usuarios...\n');

    const { data, error } = await supabase
      .from('usuarios')
      .insert([testUser])
      .select();

    if (error) {
      console.log('❌ ERROR AL GUARDAR:')
      console.log('   Código error:', error.code);
      console.log('   Mensaje:', error.message);
      console.log('   Detalles:', error.details);
      console.log('\n   SOLUCIONES POSIBLES:');
      
      if (error.code === 'PGRST204') {
        console.log('   - Falta una columna en la tabla. Verifica que tenga: nombre, email, usuario, contrasena, telefono, fecha_registro, auth_uid');
      } else if (error.code === '42501' || error.message.includes('row-level security')) {
        console.log('   - Error RLS: la política de seguridad de fila bloquea el INSERT.');
        console.log('   - Revisa la tabla "usuarios" en Supabase: Habilita RLS y crea políticas INSERT para auth.uid() igual a auth_uid o usa true en pruebas.');
        console.log('   - Ejemplo en SQL Editor:\n');
        console.log('     ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;');
        console.log('     CREATE POLICY "Allow authenticated insert" ON usuarios FOR INSERT WITH CHECK (auth.uid() = auth_uid);');
        console.log('     CREATE POLICY "Allow authenticated select" ON usuarios FOR SELECT USING (auth.uid() = auth_uid);');
        console.log('     CREATE POLICY "Allow authenticated update" ON usuarios FOR UPDATE USING (auth.uid() = auth_uid);');
      } else if (error.message.includes('relation') || error.message.includes('usuarios')) {
        console.log('   - La tabla "usuarios" no existe en Supabase');
        console.log('   - Créala en Settings > SQL Editor en Supabase');
      } else if (error.message.includes('policies')) {
        console.log('   - Las políticas RLS no permiten inserciones');
        console.log('   - Ve a Authentication > Policies y agrega una para INSERT');
      } else {
        console.log('   - Revisa CHECKLIST_USUARIO_SUPABASE.md');
      }
      return false;
    }

    console.log('✅ ÉXITO! Usuario registrado:');
    console.log('   ', data);
    
    // Limpiar
    console.log('\n🧹 Limpiando datos de prueba...');
    await supabase
      .from('usuarios')
      .delete()
      .eq('email', testUser.email);
    console.log('   ✅ Datos de prueba eliminados');
    
    return true;

  } catch (exception) {
    console.log('❌ EXCEPCIÓN:');
    console.log('   ', exception.message);
    return false;
  }
};

console.log('💡 Ejecuta: pruebaRegistroRapida()');