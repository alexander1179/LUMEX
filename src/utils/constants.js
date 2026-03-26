// src/utils/constants.js
export const APP_NAME = "Lumex";
export const APP_VERSION = "1.0";

export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true
};

export const TIME_LIMITS = {
  TOKEN_EXPIRY: 900, // 15 minutos en segundos
};

export const MESSAGES = {
  ERROR: {
    CONNECTION: "No se pudo conectar con el servidor",
    INVALID_CREDENTIALS: "Credenciales incorrectas",
    REQUIRED_FIELDS: "Todos los campos son obligatorios",
    INVALID_EMAIL: "Email inválido",
    INVALID_PHONE: "Teléfono inválido. Debe tener 10-15 dígitos",
    PASSWORD_MISMATCH: "Las contraseñas no coinciden",
    PASSWORD_REQUIREMENTS: "La contraseña no cumple los requisitos",
    TOKEN_INVALID: "Código inválido o expirado"
  },
  SUCCESS: {
    LOGIN: "Login exitoso",
    REGISTER: "Registro exitoso. Inicia sesión",
    PASSWORD_RESET: "Contraseña actualizada exitosamente",
    TOKEN_SENT: "Código enviado correctamente"
  }
};