// src/hooks/useSupabaseAuth.js
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../services/lumex';
import { loginUser, registerUser, logoutUser, getCurrentUser } from '../services/lumex';
import { storageService } from '../services/storage/storageService';

export const useSupabaseAuth = (navigation) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Verificar sesión actual
    checkSession();
    
    // Escuchar cambios en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        
        if (session) {
          const result = await getCurrentUser();
          const user = result.user;
          setUser(user);
          await storageService.saveUser(user);
        } else {
          setUser(null);
          await storageService.removeUser();
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        const result = await getCurrentUser();
        const user = result.user;
        setUser(user);
      }
    } catch (error) {
      console.log('Error checking session:', error);
    }
  };

  const login = async (email, password) => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Debes completar email y contraseña');
      return false;
    }

    setLoading(true);
    
    try {
      const result = await loginUser(email, password);
      
      if (result.success) {
        setUser(result.user);
        await storageService.saveUser(result.user);
        Alert.alert('Éxito', result.message, [
          { text: 'OK', onPress: () => navigation?.replace("Main") }
        ]);
        return true;
      } else {
        Alert.alert('Error', result.message);
        return false;
      }
    } catch (error) {
      Alert.alert('Error', 'Error al conectar con el servidor');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    
    try {
      const result = await registerUser(userData);
      
      if (result.success) {
        Alert.alert('✅ Registro exitoso', result.message, [
          { text: 'OK', onPress: () => navigation?.replace("Login") }
        ]);
        return true;
      } else {
        Alert.alert('Error', result.message);
        return false;
      }
    } catch (error) {
      Alert.alert('Error', 'Error al conectar con el servidor');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const result = await logoutUser();
      if (result.success) {
        setUser(null);
        setSession(null);
        await storageService.removeUser();
        Alert.alert('Sesión cerrada', result.message, [
          { text: 'OK', onPress: () => navigation?.replace("Login") }
        ]);
      }
    } catch (error) {
      console.log('Error logging out:', error);
    }
  };

  return {
    user,
    loading,
    session,
    login,
    register,
    logout,
    checkSession
  };
};