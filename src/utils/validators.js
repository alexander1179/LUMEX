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
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      isValid: password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)
    };
  },

  validateRequired: (value) => {
    return value && value.trim() !== '';
  }
};