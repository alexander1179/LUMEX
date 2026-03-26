// src/services/supabase/authService.js
import { supabase } from './supabaseClient';

// Registrar nuevo usuario con Supabase Auth
export const registerUser = async (userData) => {
  try {
    // Normalizar parámetros para evitar confusiones entre "nombre/email/usuario" y "name/email/username"
    let email = (userData.email || userData.usuario || userData.username || '').trim().toLowerCase();
    let username = (userData.username || userData.usuario || '').trim().toLowerCase();
    const name = (userData.name || userData.nombre || '').trim();
    const phone = (userData.phone || userData.telefono || '').trim() || null;
    const acceptTerms = userData.acceptTerms || userData.aceptaTerminos || false;

    const isEmail = (value) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!isEmail(email) && isEmail(username)) {
      console.warn('📌 Intercambio de email/username detectado automáticamente');
      [email, username] = [username, email];
    }

    console.log('📝 Registrando usuario:', email, 'username:', username, 'acepta términos:', acceptTerms);

    // Chequear si el email o usuario ya está registrado en la tabla usuarios
    const { data: existingUserCheck, error: existingCheckError } = await supabase
      .from('usuarios')
      .select('id_usuario, email, usuario')
      .or(`email.eq.${email},usuario.eq.${username}`)
      .maybeSingle();

    if (existingCheckError) {
      console.warn('⚠️ Error en verificación de usuario existente:', existingCheckError.message);
    }

    if (existingUserCheck) {
      return {
        success: false,
        message: 'El correo o nombre de usuario ya está registrado.'
      };
    }

    let authUser = null;
    let isExistingUser = false;

    // Intentar registrar en Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password: userData.password,
      options: {
        data: {
          name,
          username,
          phone,
        }
      }
    });

    if (error) {
      // Si el usuario ya existe, intentar hacer signIn para obtener el usuario
      if (error.message.includes('User already registered')) {
        console.log('👤 Usuario ya existe en Auth, intentando signIn temporal...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: userData.password,
        });

        if (signInError) {
          throw new Error('Usuario ya registrado pero contraseña incorrecta');
        }

        authUser = signInData.user;
        isExistingUser = true;

        // No cerrar sesión todavía; queremos usar la sesión para la inserción/actualización RLS (si aplica).
      } else {
        throw error;
      }
    } else {
      authUser = data.user;

      // Si signUp no establece session (ej. requiere confirmación por email), forzamos signIn
      if (!data.session) {
        console.log('🔐 signUp no devuelto session. Forzando signInWithPassword para establecer auth.uid()...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: userData.password,
        });

        if (signInError) {
          throw new Error(`Error forzando login después de signUp: ${signInError.message}`);
        }

        authUser = signInData.user;
      }
    }

    // Ahora insertar/actualizar en tabla usuarios
    if (authUser) {
      // Verificar si ya existe en la tabla usuarios por email o username
      const { data: existingUser, error: existingError } = await supabase
        .from('usuarios')
        .select('id_usuario, nombre, email, usuario, auth_uid')
        .or(`email.eq.${email},usuario.eq.${username}`)
        .maybeSingle();

      if (existingError) {
        console.warn('⚠️ Error al verificar usuario existente:', existingError);
      }

      // Crear payload con solo los campos que existen en la tabla usuarios
      const userPayload = {
        auth_uid: authUser.id,
        nombre: name,
        email,
        usuario: username,
        contrasena: userData.password || 'supabase_auth',
        telefono: phone,
        fecha_registro: new Date().toISOString(),
      };

      console.log('📦 Payload a insertar/actualizar:', userPayload);

      if (existingUser) {
        // Actualizar usuario existente
        console.log('🔄 Actualizando usuario existente:', existingUser.id_usuario);
        const { data: updateData, error: updateError } = await supabase
          .from('usuarios')
          .update(userPayload)
          .eq('id_usuario', existingUser.id_usuario)
          .select();

        if (updateError) {
          console.error('❌ Error actualizando usuario:', updateError.message, updateError.details);
          throw new Error(`Error actualizando usuario: ${updateError.message}`);
        } else {
          console.log('✅ Usuario actualizado exitosamente:', updateData);
        }
      } else {
        // Insertar nuevo usuario
        console.log('📝 Insertando nuevo usuario en tabla usuarios');
        const { data: insertData, error: insertError } = await supabase
          .from('usuarios')
          .insert([userPayload])
          .select();

        if (insertError) {
          console.error('❌ Error insertando usuario:', insertError.code, insertError.message, insertError.details);
          throw new Error(`Error registrando usuario en BD: ${insertError.message}`);
        } else {
          console.log('✅ Usuario insertado exitosamente:', insertData);
        }
      }
    }

    return {
      success: true,
      user: authUser,
      message: isExistingUser ? 'Usuario actualizado correctamente' : 'Usuario registrado correctamente'
    };
  } catch (error) {
    console.log('❌ Error en registro:', error.message);
    return { success: false, message: error.message };
  }
};

// Iniciar sesión con Supabase Auth (acepta username o email)
export const loginUser = async (identifier, password, acceptTermsIfNeeded = false, deviceInfo = null) => {
  try {
    const isEmail = identifier.includes('@');
    console.log('🔐 Intentando login con:', identifier, 'esEmail:', isEmail);

    let emailToUse = identifier.trim().toLowerCase();

    if (!isEmail) {
      // Buscar el email del usuario en la tabla usuarios por campo usuario
      const { data: userData, error: searchError } = await supabase
        .from('usuarios')
        .select('email')
        .eq('usuario', identifier.trim().toLowerCase())
        .maybeSingle();

      if (searchError) throw searchError;

      if (!userData) {
        return { success: false, message: 'Usuario no encontrado' };
      }

      emailToUse = userData.email;
    }

    // Login con email encontrado o directo
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password: password,
    });
    if (error) throw error;

    // Verificar si el usuario ha aceptado términos (opcional)
    const userId = data.user.id;
    const termsCheck = await checkTermsAcceptance(userId);

    if (!termsCheck.success) {
      console.warn('No se pudo verificar aceptación de términos, continuando con login...');
    } else if (!termsCheck.accepted && acceptTermsIfNeeded) {
      // Aceptar términos automáticamente durante login si se solicita
      console.log('📋 Usuario no ha aceptado términos, intentando aceptar automáticamente...');
      const acceptResult = await acceptSecurityTerms(userId, deviceInfo);
      if (!acceptResult.success) {
        console.warn('Error aceptando términos durante login:', acceptResult.message);
      }
    }

    return {
      success: true,
      user: data.user,
      termsAccepted: termsCheck.success ? termsCheck.accepted : true
    };
  } catch (error) {
    console.log('❌ Error en login:', error.message);
    return { success: false, message: error.message };
  }
};

// Recuperar contraseña
export const forgotPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) throw error;

    return {
      success: true,
      message: 'Código de recuperación enviado a tu email'
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Verificar token
export const verifyToken = async (userId, token) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery'
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Resetear contraseña
export const resetPassword = async (userId, token, newPassword) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    return { success: true, message: 'Contraseña actualizada' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Cerrar sesión
export const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    return { success: true, message: 'Sesión cerrada' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Obtener usuario actual
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) throw error;

    return { success: true, user: user };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Aceptar términos de seguridad
export const acceptSecurityTerms = async (userId, deviceInfo = null) => {
  try {
    console.log('🔒 Aceptando términos de seguridad para usuario:', userId);

    // Intentar usar la función de Supabase primero
    try {
      const { data, error } = await supabase.rpc('aceptar_terminos_seguridad', {
        p_usuario_id: userId,
        p_politica_version: '1.0',
        p_dispositivo: deviceInfo ? {
          platform: deviceInfo.platform || 'unknown',
          version: deviceInfo.version || 'unknown',
          model: deviceInfo.model || 'unknown'
        } : null
      });

      if (!error) {
        console.log('✅ Términos aceptados correctamente via función');
        return { success: true, message: 'Términos aceptados correctamente' };
      }
    } catch (rpcError) {
      console.warn('⚠️ Función RPC no disponible, intentando actualización directa');
    }

    // Si la función no existe, intentar actualizar directamente
    try {
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          acepta_terminos: true,
          fecha_aceptacion_terminos: new Date().toISOString()
        })
        .eq('id_usuario', userId);

      if (updateError) {
        throw updateError;
      }

      console.log('✅ Términos aceptados correctamente via actualización directa');
      return { success: true, message: 'Términos aceptados correctamente' };
    } catch (directError) {
      console.warn('⚠️ Actualización directa falló:', directError.message);
      // Si tampoco funciona la actualización directa, continuar sin error
      return { success: true, message: 'Términos registrados (funcionalidad limitada)' };
    }
  } catch (error) {
    console.log('❌ Error aceptando términos:', error.message);
    return { success: false, message: error.message };
  }
};

// Verificar si usuario ha aceptado términos
export const checkTermsAcceptance = async (userId) => {
  try {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('acepta_terminos, fecha_aceptacion_terminos')
        .eq('id_usuario', userId)
        .single();

      if (!error) {
        return {
          success: true,
          accepted: data?.acepta_terminos || false,
          acceptanceDate: data?.fecha_aceptacion_terminos || null
        };
      }

      // Si hay error de columna (PGRST204) significa que no existe, asi que no forzamos
      if (error.code === 'PGRST204' || /Could not find the 'acepta_terminos' column/.test(error.message)) {
        console.warn('⚠️ Columnas de términos no disponibles en usuarios:', error.message);
        return { success: true, accepted: false, acceptanceDate: null };
      }

      throw error;
    } catch (columnError) {
      console.warn('⚠️ No se puede checar términos, continuamos:', columnError.message);
      return { success: true, accepted: false, acceptanceDate: null };
    }
  } catch (error) {
    console.log('❌ Error verificando aceptación de términos:', error.message);
    return { success: false, message: error.message };
  }
};