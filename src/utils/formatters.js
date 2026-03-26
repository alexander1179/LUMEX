// src/utils/formatters.js
export const formatters = {
  formatTime: (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  },

  formatPhone: (phone) => {
    return phone.replace(/\s/g, '');
  },

  capitalizeFirst: (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }
};