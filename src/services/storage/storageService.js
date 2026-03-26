// src/services/storage/storageService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storageService = {
  // Guardar usuario
  saveUser: async (user) => {
    try {
      await AsyncStorage.setItem("user", JSON.stringify(user));
      console.log('✅ Usuario guardado');
      return true;
    } catch (error) {
      console.log('❌ Error saving user:', error);
      return false;
    }
  },

  // Obtener usuario
  getUser: async () => {
    try {
      const data = await AsyncStorage.getItem("user");
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.log('❌ Error getting user:', error);
      return null;
    }
  },

  // Eliminar usuario
  removeUser: async () => {
    try {
      await AsyncStorage.removeItem("user");
      console.log('✅ Usuario eliminado');
      return true;
    } catch (error) {
      console.log('❌ Error removing user:', error);
      return false;
    }
  },

  // Verificar login
  checkLogin: async () => {
    try {
      const data = await AsyncStorage.getItem("user");
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.log('❌ Error checking login:', error);
      return null;
    }
  }
};