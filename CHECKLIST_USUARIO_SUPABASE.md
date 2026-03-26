# 🔧 CHECKLIST: Guardar Usuarios en Supabase

## ❌ PROBLEMA: Usuarios no se guardan en tabla usuarios

---

## 🧪 PASO 1: Ejecutar Diagnóstico

Desde la consola de React Native (presiona `r` en terminal o abre consola del browser dev):

```javascript
import { diagnosticoRegistro } from './diagnostico_registro.js';
diagnosticoRegistro();
```

Espera a ver los resultados. **Comparte esta salida.**

---

## ✅ VERIFICACIONES NECESARIAS

### A) Tabla "usuarios" existe en Supabase
- [ ] Ve a **Supabase Dashboard** > **Table Editor** > Busca "usuarios"
- [ ] Verifica que tenga estas columnas mínimas:
  - `id_usuario` (int)
  - `nombre` (text)
  - `email` (text)
  - `usuario` (text)
  - `contrasena` (text)
  - `telefono` (text)
  - `fecha_registro` (timestamp)
  - `auth_uid` (text)

Si falta alguna, agrégala.

### B) Políticas RLS (Row Level Security)
- [ ] Ve a **Supabase Dashboard** > **Authentication** > **Policies**
- [ ] En tabla "usuarios", verifica que haya políticas que permitan:
  - INSERT (para crear nuevos usuarios)
  - SELECT (para consultar)
  - UPDATE (para actualizar)

**Si no hay políticas**, agrégalas:

```sql
-- En SQL Editor de Supabase:

-- Permitir inserciones públicas (sin autenticación)
CREATE POLICY "Allow public insert" ON usuarios
FOR INSERT WITH CHECK (true);

-- Permitir selects públicos
CREATE POLICY "Allow public select" ON usuarios
FOR SELECT USING (true);

-- Permitir updates públicos
CREATE POLICY "Allow public update" ON usuarios
FOR UPDATE USING (true);
```

### C) Credenciales de Supabase
- [ ] `src/config/supabaseConfig.js` tiene URL y ANON_KEY correctas
- [ ] La ANON_KEY tiene más de 100 caracteres
- [ ] La URL contiene `.supabase.co`

---

## 📋 SI NADA FUNCIONA

Comparte estos datos:

1. **Salida de `diagnosticoRegistro()`**
2. **Logs de la consola del navegador/app**
3. **¿Qué dice la tabla usuarios en Supabase?** (vacía, tiene datos, etc.)
4. **¿Error específico que sale en la app?**

---

## 🚀 SOLUCIÓN RÁPIDA

Si la tabla no existe, crea con este SQL en Supabase **SQL Editor**:

```sql
CREATE TABLE usuarios (
  id_usuario SERIAL PRIMARY KEY,
  auth_uid TEXT,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  usuario TEXT NOT NULL UNIQUE,
  contrasena TEXT,
  telefono TEXT,
  fecha_registro TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
CREATE POLICY "Allow public insert" ON usuarios
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select" ON usuarios
FOR SELECT USING (true);

CREATE POLICY "Allow public update" ON usuarios
FOR UPDATE USING (true);

-- Crear índices
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_usuario ON usuarios(usuario);
CREATE INDEX idx_usuarios_auth_uid ON usuarios(auth_uid);
```

Ejecuta y luego intenta registrar nuevamente.