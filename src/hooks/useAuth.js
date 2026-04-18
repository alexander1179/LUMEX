// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { loginUser, getCurrentUser, logoutUser } from '../services/lumex';
import { storageService } from '../services/storage/storageService';
import { MESSAGES } from '../utils/constants';

export const useAuth = (navigation) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const result = await getCurrentUser();
      if (result.success && result.user) {
        setUser(result.user);
        navigation?.replace("Main");
      }
    } catch (error) {
      console.log("Error checking login:", error);
    }
  };

  const login = async (usuario, password, acepta) => {
    if (!usuario.trim() || !password.trim()) {
      Alert.alert("Error", MESSAGES.ERROR.REQUIRED_FIELDS);
      return false;
    }

    if (!acepta) {
      Alert.alert("Error", "Debes aceptar los términos y condiciones");
      return false;
    }

    setLoading(true);

    try {
      const result = await loginUser(usuario, password);

      if (result.success) {
        await storageService.saveUser(result.user);
        setUser(result.user);
        Alert.alert("Éxito", MESSAGES.SUCCESS.LOGIN, [
          { text: "OK", onPress: () => navigation.replace("Main") }
        ]);
        return true;
      } else {
        Alert.alert("Error", result.message || MESSAGES.ERROR.INVALID_CREDENTIALS);
        return false;
      }
    } catch (error) {
      Alert.alert("Error", MESSAGES.ERROR.CONNECTION);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (navigation) => {
    try {
      const result = await logoutUser();
      if (result.success) {
        await storageService.removeUser();
        setUser(null);
        Alert.alert("Sesión cerrada", "Has cerrado sesión correctamente", [
          { text: "OK", onPress: () => navigation.replace("Login") }
        ]);
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      console.log("Error logging out:", error);
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    checkLoginStatus
  };
};