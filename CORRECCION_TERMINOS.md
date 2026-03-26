# 🚨 CORRECCIÓN URGENTE: Columnas de Términos Faltantes

## ❌ Error Actual
```
Usuario registrado en auth pero no en tabla usuarios: {"code": "PGRST204", "details": null, "hint": null, "message": "Could not find the 'acepta_terminos' column of 'usuarios' in the schema cache"}
```

## ✅ Solución

### PASO 1: Ejecutar Script SQL en Supabase
1. Ve a tu **proyecto de Supabase**
2. Abre el **SQL Editor** (menú lateral izquierdo)
3. Copia **TODO** el contenido del archivo `add_terms_columns.sql`
4. Pégalo en el editor SQL
5. Haz clic en **"Run"** o **"Ejecutar"**

### PASO 2: Verificar que se ejecutó correctamente
Después de ejecutar el script, deberías ver:
- ✅ Mensaje de éxito sin errores
- ✅ Columnas `acepta_terminos` y `fecha_aceptacion_terminos` agregadas a `usuarios`
- ✅ Tabla `politicas_seguridad` creada (opcional)
- ✅ Función `aceptar_terminos_seguridad` creada

### PASO 3: Probar la aplicación
Una vez ejecutado el script:
1. Reinicia la aplicación móvil
2. Registra un nuevo usuario
3. Debería guardarse correctamente en la tabla `usuarios`

## 📋 Contenido del Script SQL

El archivo `add_terms_columns.sql` contiene:

```sql
-- Agregar columnas si no existen
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS acepta_terminos BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fecha_aceptacion_terminos TIMESTAMP;

-- Función para aceptar términos
CREATE OR REPLACE FUNCTION aceptar_terminos_seguridad(
  p_usuario_id INTEGER,
  p_politica_version VARCHAR(20) DEFAULT '1.0'
)
RETURNS BOOLEAN
-- ... (código completo en el archivo)
```

## 🔍 Verificación

Para verificar que todo funciona:

1. **En Supabase Dashboard:**
   - Ve a **Table Editor** > **usuarios**
   - Deberías ver las nuevas columnas: `acepta_terminos`, `fecha_aceptacion_terminos`

2. **En la aplicación:**
   - Registra un usuario → debería guardarse en BD
   - El login debería funcionar normalmente

## ⚠️ Importante

- **Ejecuta el script UNA SOLA VEZ**
- Si ya ejecutaste `setup_security_policies.sql` antes, no necesitas ejecutarlo de nuevo
- El script `add_terms_columns.sql` es más simple y directo
- Si hay errores, verifica que tienes permisos de administrador en Supabase

¿Ya ejecutaste el script? ¿Funcionó correctamente?