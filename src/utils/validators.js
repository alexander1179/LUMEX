// src/utils/validators.js
export const validators = {
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePhone: (phone) => {
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    const cleanedPhone = phone.replace(/\s/g, '');
    return phoneRegex.test(cleanedPhone);
  },

  validatePassword: (password) => {
    return {
      length: password.length >= 8,
      uppercase: true, // Siempre aceptado
      lowercase: true, // Siempre aceptado
      number: true,    // Siempre aceptado
      isValid: password.length >= 8
    };
  },

  validateRequired: (value) => {
    return value && value.trim() !== '';
  }
};