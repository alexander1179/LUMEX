export const getApiClient = async (endpoint, options = {}) => {
  // En React Native (Expo) local, idealmente se debe usar la IP de la máquina local 
  // o el tunnel configurado en .env. O 10.0.2.2 si se corre en Android Studio
  let baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';
  
  // Limpiar tail slash
  if(baseUrl.endsWith('/')) {
    baseUrl = baseUrl.substring(0, baseUrl.length-1);
  }

  const url = `${baseUrl}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const json = await response.json();
    return { ok: response.ok, status: response.status, data: json };
  } catch (error) {
    console.error('API Error:', error.message);
    return { ok: false, status: 500, error: error.message };
  }
};
