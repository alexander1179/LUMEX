# Solución al Error PGRST204: Columnas faltantes en tabla 'usuarios'

## Problema
Los errores indican que faltan columnas en la tabla `usuarios`:
- `PGRST204`: Could not find the 'created_at' column
- `column usuarios.username does not exist`

## Causa
La tabla `usuarios` en Supabase no tiene la estructura correcta que espera el código de la aplicación.

## Solución

### Paso 1: Crear/Actualizar la tabla en Supabase
1. Ve al **SQL Editor** en tu dashboard de Supabase
2. Copia y pega el contenido del archivo `create_tables_supabase.sql`
3. Ejecuta el script para crear la tabla con la estructura correcta

### Paso 2: Verificar la estructura
Después de ejecutar el script, verifica en **Table Editor** que la tabla `usuarios` tenga estas columnas:
- `id` (UUID, Primary Key, referencia a auth.users)
- `name` (VARCHAR)
- `email` (VARCHAR, único)
- `username` (VARCHAR, único)
- `phone` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Paso 3: Probar el registro
1. Reinicia la aplicación
2. Intenta registrar un nuevo usuario
3. Verifica que ahora se guarde correctamente en la tabla `usuarios`

## Estructura de la Tabla
La tabla está diseñada para trabajar con Supabase Auth:
- El campo `id` está ligado al ID del usuario en Supabase Auth
- Campos requeridos: `name`, `email`, `username`
- Campo opcional: `phone`
- Timestamps automáticos: `created_at`, `updated_at`
- Políticas RLS para seguridad

## Notas Importantes
- Si la tabla ya existe, el script la actualizará sin perder datos
- Las políticas RLS protegen los datos de cada usuario
- El campo `username` es único y se usa para el login