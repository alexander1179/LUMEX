// src/services/supabase/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

const SESSION_KEY = 'lumex_user_session';

const isAdminRole = (roleValue) => {
  const normalizedRole = String(roleValue || '').trim().toLowerCase();
  return normalizedRole === 'admin' || normalizedRole === 'administrador';
};

const isTruthy = (value) => {
  if (typeof value === 'boolean') return value;
  const normalized = String(value ?? '').trim().toLowerCase();
  return ['1', 'true', 't', 'yes', 'si', 'sí', 'bloqueado', 'blocked', 'inactivo', 'inactive', 'suspendido'].includes(normalized);
};

const isFalsy = (value) => {
  if (typeof value === 'boolean') return !value;
  const normalized = String(value ?? '').trim().toLowerCase();
  return ['0', 'false', 'f', 'no', 'activo', 'active', 'habilitado'].includes(normalized);
};

const isUserBlocked = (user) => {
  if (!user || typeof user !== 'object') return false;

  const blockedFields = [user?.bloqueado, user?.blocked, user?.acceso_bloqueado, user?.esta_bloqueado, user?.inactivo];
  for (const value of blockedFields) {
    if (value === null || value === undefined || value === '') continue;
    if (isTruthy(value)) return true;
    if (isFalsy(value)) return false;
  }

  const enabledFields = [user?.habilitado, user?.activo];
  for (const value of enabledFields) {
    if (value === null || value === undefined || value === '') continue;
    if (isTruthy(value)) return false;
    if (isFalsy(value)) return true;
  }

  const statusFields = [user?.estado_acceso, user?.estado];
  for (const value of statusFields) {
    if (value === null || value === undefined || value === '') continue;
    const normalized = String(value).trim().toLowerCase();
    if (['bloqueado', 'blocked', 'inactivo', 'inactive', 'suspendido'].includes(normalized)) return true;
    if (['activo', 'active', 'habilitado'].includes(normalized)) return false;
  }

  return false;
};

const BLOCKED_LOGIN_MESSAGE = 'Tu cuenta está bloqueada. Contacta al administrador para habilitar el acceso.';

// Hash SHA-256 usando Web Crypto API (React Native 0.71+)
const hashPassword = async (password) => {
  try {
    const encoder = new TextEncoder();
    const buf = encoder.encode(String(password));
    const hashBuffer = await global.crypto.subtle.digest('SHA-256', buf);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback simple para entornos sin Web Crypto
    let h = 5381;
    const s = String(password);
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
    return Math.abs(h).toString(16).padStart(8, '0').repeat(8);
  }
};

// Registrar nuevo usuario (directamente en tabla usuarios, SIN Supabase Auth)
export const registerUser = async (userData) => {
  try {
    let email = (userData.email || userData.usuario || userData.username || '').trim().toLowerCase();
    let username = (userData.username || userData.usuario || '').trim().toLowerCase();
    const name = (userData.name || userData.nombre || '').trim();
    const phone = (userData.phone || userData.telefono || '').trim() || null;

    const isEmail = (value) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!isEmail(email) && isEmail(username)) {
      [email, username] = [username, email];
    }

    console.log('📝 Registrando usuario:', email, 'username:', username);

    // Verificar si el email o usuario ya existe en la tabla usuarios
    const { data: existingUser, error: checkError } = await supabase
      .from('usuarios')
      .select('id_usuario')
      .or(`email.eq.${email},usuario.eq.${username}`)
      .maybeSingle();

    if (checkError) console.warn('⚠️ Error en verificación:', checkError.message);

    if (existingUser) {
      return { success: false, message: 'El correo o nombre de usuario ya está registrado.' };
    }

    // Hash de la contraseña antes de guardar
    const passwordHash = await hashPassword(userData.password);

    // Insertar directamente en la tabla usuarios (SIN supabase.auth.signUp)
    const { data: newUser, error: insertError } = await supabase
      .from('usuarios')
      .insert([{
        nombre: name,
        email,
        usuario: username,
        rol: 'usuario',
        contrasena: passwordHash,
        telefono: phone,
        fecha_registro: new Date().toISOString(),
        analisis_disponibles: 0,
      }])
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);

    console.log('✅ Usuario registrado:', newUser);
    return { success: true, user: newUser, message: 'Usuario registrado correctamente' };
  } catch (error) {
    console.log('❌ Error en registro:', error.message);
    return { success: false, message: error.message };
  }
};

// Iniciar sesión (contra tabla usuarios, SIN supabase.auth.signInWithPassword)
export const loginUser = async (identifier, password, acceptTermsIfNeeded = false, deviceInfo = null, options = {}) => {
  try {
    const { requiredRole = null } = options;
    const isEmail = identifier.includes('@');
    const field = isEmail ? 'email' : 'usuario';
    console.log('🔐 Intentando login con:', identifier);

    // Buscar usuario en tabla usuarios
    const { data: userData, error: searchError } = await supabase
      .from('usuarios')
      .select('*')
      .eq(field, identifier.trim().toLowerCase())
      .maybeSingle();

    if (searchError) throw searchError;
    if (!userData) return { success: false, message: 'Usuario no encontrado' };

    // Verificar rol ANTES de verificar bloqueo para no revelar estado de la cuenta
    if (requiredRole === 'admin' && !isAdminRole(userData.rol)) {
      return { success: false, message: 'Este login es exclusivo para administradores. Por favor ingresa desde Acceso de usuario.' };
    }

    if (requiredRole === 'usuario' && isAdminRole(userData.rol)) {
      return { success: false, message: 'Este acceso es solo para usuarios.' };
    }

    if (isUserBlocked(userData)) {
      return { success: false, message: BLOCKED_LOGIN_MESSAGE };
    }

    // Migración: usuarios registrados previamente con Supabase Auth
    if (userData.contrasena === 'managed_by_supabase_auth') {
      console.log('🔄 Contraseña gestionada por Auth, intentando migración...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password,
      });
      if (authError) return { success: false, message: 'Contraseña incorrecta' };

      // Migrar: guardar hash SHA-256 en la tabla
      const newHash = await hashPassword(password);
      await supabase.from('usuarios').update({ contrasena: newHash }).eq('id_usuario', userData.id_usuario);
      const migratedUser = { ...userData, contrasena: newHash };
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(migratedUser));
      try { await supabase.auth.signOut(); } catch {}

      const termsCheck = await checkTermsAcceptance(migratedUser.id_usuario);
      return { success: true, user: migratedUser, termsAccepted: termsCheck.accepted || false };
    }

    // Verificar contraseña con hash SHA-256
    const inputHash = await hashPassword(password);
    if (userData.contrasena !== inputHash) {
      return { success: false, message: 'Contraseña incorrecta' };
    }

    // Guardar sesión en AsyncStorage
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(userData));

    const termsCheck = await checkTermsAcceptance(userData.id_usuario);
    if (!termsCheck.success) {
      console.warn('No se pudo verificar términos, continuando...');
    } else if (!termsCheck.accepted && acceptTermsIfNeeded) {
      await acceptSecurityTerms(userData.id_usuario, deviceInfo);
    }

    return {
      success: true,
      user: userData,
      termsAccepted: termsCheck.success ? termsCheck.accepted : true
    };
  } catch (error) {
    console.log('❌ Error en login:', error.message);
    return { success: false, message: error.message };
  }
};

// Recuperar contraseña: enviar código desde Supabase Auth usando el flujo de recovery
export const forgotPassword = async (email) => {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    // Verificar que el correo existe en la tabla usuarios
    const { data: userExists } = await supabase
      .from('usuarios')
      .select('email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!userExists) {
      return { success: false, message: 'No existe ninguna cuenta con ese correo.' };
    }

    // Este flujo usa la plantilla Reset Password de Supabase.
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);

    if (error) {
      const msg = error.message || '';
      // Rate-limit de Supabase: "you can only request this after X seconds"
      const waitMatch = msg.match(/after (\d+) second/i);
      if (waitMatch) {
        return { success: false, message: `Espera ${waitMatch[1]} segundos antes de solicitar otro código.`, rateLimited: true, waitSeconds: parseInt(waitMatch[1], 10) };
      }

      if (/for security purposes|only request this/i.test(msg)) {
        return { success: false, message: 'Espera unos segundos antes de solicitar otro código.', rateLimited: true };
      }

      throw error;
    }

    return { success: true, message: 'Código de recuperación enviado a tu email', email: normalizedEmail };
  } catch (error) {
    const msg = error?.message || '';
    if (/for security purposes|only request this/i.test(msg)) {
      return { success: false, message: 'Espera unos segundos antes de solicitar otro código.', rateLimited: true };
    }
    return { success: false, message: msg };
  }
};

// Verificar código OTP de recovery
export const verifyToken = async (email, token) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });

    if (error) throw error;

    return {
      success: true,
      user: data?.user || null,
      session: data?.session || null,
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Resetear contraseña: actualizar hash en tabla usuarios
export const resetPassword = async (newPassword) => {
  try {
    const passwordHash = await hashPassword(newPassword);

    // Obtener email del usuario desde la sesión creada por verifyOtp
    const { data: authData } = await supabase.auth.getUser();
    const userEmail = authData?.user?.email;

    if (!userEmail) throw new Error('No se pudo identificar el usuario. Intentá el proceso de nuevo.');

    // Actualizar hash en la tabla usuarios
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ contrasena: passwordHash })
      .eq('email', userEmail);

    if (updateError) throw new Error(updateError.message);

    // Cerrar sesión de Auth (el login a partir de ahora usa la tabla usuarios)
    try { await supabase.auth.signOut(); } catch {}

    return { success: true, message: 'Contraseña actualizada correctamente' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Cerrar sesión
export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
    // Cerrar sesión de Auth si quedó activa por migración o recuperación
    try { await supabase.auth.signOut(); } catch {}
    return { success: true, message: 'Sesión cerrada' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Obtener usuario actual desde AsyncStorage
export const getCurrentUser = async () => {
  try {
    const sessionStr = await AsyncStorage.getItem(SESSION_KEY);
    if (!sessionStr) return { success: false, message: 'No hay sesión activa' };
    const user = JSON.parse(sessionStr);

    const queryAttempts = [
      { field: 'id_usuario', value: user?.id_usuario },
      { field: 'id', value: user?.id },
      { field: 'uuid', value: user?.uuid },
      { field: 'user_id', value: user?.user_id },
      { field: 'email', value: user?.email },
      { field: 'usuario', value: user?.usuario },
    ].filter((a) => a.value !== null && a.value !== undefined && String(a.value).trim() !== '');

    for (const attempt of queryAttempts) {
      const { data: freshUser, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq(attempt.field, attempt.value)
        .maybeSingle();

      if (error) continue;
      if (!freshUser) continue;

      if (isUserBlocked(freshUser)) {
        await AsyncStorage.removeItem(SESSION_KEY);
        return { success: false, message: BLOCKED_LOGIN_MESSAGE, blocked: true };
      }

      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(freshUser));
      return { success: true, user: freshUser };
    }

    if (isUserBlocked(user)) {
      await AsyncStorage.removeItem(SESSION_KEY);
      return { success: false, message: BLOCKED_LOGIN_MESSAGE, blocked: true };
    }

    return { success: true, user };
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