// src/config/supabaseConfig.js

// ⚠️ IMPORTANTE: Reemplaza estos valores con tus credenciales de Supabase
export const SUPABASE_CONFIG = {
  URL: process.env.REACT_APP_SUPABASE_URL || 'https://zytpyartebkrhojzyije.supabase.co',
  ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHB5YXJ0ZWJrcmhvanp5aWplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzAzNjIsImV4cCI6MjA4OTU0NjM2Mn0.7HIa7RJ3WgtCbRuA9CaVar1n3k3y-vRpYXslHFYKBCk'
};

// Verificación de configuración
const validateConfig = () => {
  const { URL, ANON_KEY } = SUPABASE_CONFIG;
  
  if (!URL) {
    console.error('❌ ERROR: SUPABASE_CONFIG.URL no está configurada');
    return false;
  }
  
  if (!ANON_KEY) {
    console.error('❌ ERROR: SUPABASE_CONFIG.ANON_KEY no está configurada');
    return false;
  }
  
  if (!URL.includes('supabase.co')) {
    console.error('❌ ERROR: URL de Supabase inválida (no contiene supabase.co)');
    return false;
  }
  
  if (ANON_KEY.length < 50) {
    console.error('❌ ERROR: ANON_KEY parece incompleta');
    return false;
  }
  
  return true;
};

// Validar al cargar
if (!validateConfig()) {
  console.warn('⚠️ ADVERTENCIA: Revisa la configuración de Supabase en src/config/supabaseConfig.js');
}

// ⚠️ ADVERTENCIA DE SEGURIDAD: Cómo obtener credenciales seguras:
// 1. Ve a https://app.supabase.com/
// 2. Selecciona tu proyecto
// 3. Settings > API Keys
// 4. Copia "Project URL" y "anon public" key
// 5. Guarda en variables de ambiente o archivo .env (NO en código)