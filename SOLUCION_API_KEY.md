# 🔧 SOLUCIÓN: Error "No API key found in request"

## 📋 Qué significa el error

```
"message":"No API key found in request"
"hint":"No `apikey` request header or url param was found."
```

Este error significa que **Supabase no recibe la clave de API en la solicitud HTTP**. Las causas comunes:

1. ❌ API key estática es inválida o está incompleta
2. ❌ URL de Supabase es incorrecta
3. ❌ El cliente Supabase no está enviando los headers correctamente
4. ❌ Las credenciales no están configuradas

---

## ✅ PASOS PARA CORREGIR

### PASO 1: Obtén credenciales actualizadas de Supabase

1. Ve a https://app.supabase.com/
2. Selecciona tu proyecto **lumex**
3. Ve a **Settings** > **API**
4. Copia:
   - **Project URL** (ej: `https://zytpyartebkrhojzyije.supabase.co`)
   - **anon public** key (la larga, comienza con `eyJ...`)

### PASO 2: Actualiza la configuración

Ve a `src/config/supabaseConfig.js` y reemplaza:

```javascript
export const SUPABASE_CONFIG = {
  URL: 'PEGA_LA_URL_AQUI',
  ANON_KEY: 'PEGA_LA_KEY_AQUI'
};
```

**Ejemplo:**
```javascript
export const SUPABASE_CONFIG = {
  URL: 'https://zytpyartebkrhojzyije.supabase.co',
  ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHB5...'
};
```

### PASO 3: Reinicia completamente la app

```bash
npm start --reset-cache
```

Presiona `w` para web o escanea QR nuevamente.

### PASO 4: Verifica la conexión

Desde la consola de React Native, ejecuta:

```javascript
import { diagnosticarSupabase } from './diagnostic.js';
diagnosticarSupabase();
```

Deberías ver:
```
✅ Validación de configuración: OK
✅ Prueba de conexión: Exitosa
✅ Consulta directa: Exitosa
```

---

## 🚨 CHECKLIST

- [ ] Obtuve credenciales nuevas de Supabase
- [ ] Actualicé `src/config/supabaseConfig.js` con URL y KEY correctas
- [ ] La KEY tiene más de 100 caracteres
- [ ] La URL contiene `supabase.co`
- [ ] Reinicié la app con `--reset-cache`
- [ ] Ejecuté `diagnosticarSupabase()` y veo ✅

---

## 💡 ALTERNATIVAS

Si aún no funciona:

### Opción A: Usar variables de ambiente
Crea un archivo `.env`:
```
REACT_APP_SUPABASE_URL=https://zytpyartebkrhojzyije.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...
```

### Opción B: Regenerar la key en Supabase
1. Settings > API > ROLEs
2. Haz clic en "Regenerate" en "anon" public key
3. Copia la nueva key
4. Actualiza en `supabaseConfig.js`
5. Reinicia app

### Opción C: Verificar tabla usuarios existe
En Supabase:
1. Table Editor > Busca "usuarios"
2. Si no existe, créala:
   - id_usuario (int, primary key)
   - nombre (text)
   - email (text)
   - usuario (text)
   - contrasena (text)
   - telefono (text)
   - fecha_registro (timestamp)
   - auth_uid (text)

---

## 📞 Si nada funciona

Comparte estos datos en tu siguiente mensaje:
1. ¿Qué dice la consola cuando ejecutas `diagnosticarSupabase()`?
2. ¿La URL es correcta? (debe terminar en `.supabase.co`)
3. ¿La KEY completa tiene más de 100 caracteres?
4. ¿La tabla `usuarios` existe en Supabase?