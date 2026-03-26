# Configuración de Políticas de Seguridad - Lumex App

## Resumen
Este documento explica cómo configurar el sistema de aceptación de políticas de seguridad en Supabase para que los usuarios deban aceptar términos antes de poder usar la aplicación móvil.

## Archivos Importantes
- `setup_security_policies.sql` - Script principal para configurar todo el sistema
- `src/services/supabase/authService.js` - Funciones actualizadas para manejar términos
- `src/screens/LoginScreen.js` - Pantalla de login actualizada
- `src/screens/RegisterScreen.js` - Pantalla de registro actualizada

## Pasos de Implementación

### 1. Ejecutar el Script SQL en Supabase
1. Ve al **SQL Editor** en tu proyecto de Supabase
2. Copia y pega el contenido completo de `setup_security_policies.sql`
3. Ejecuta el script
4. Verifica que no haya errores

### 2. Verificar la Configuración
Después de ejecutar el script, verifica que:
- Se agregó la tabla `politicas_seguridad`
- Se agregaron las columnas `acepta_terminos` y `fecha_aceptacion_terminos` a `usuarios`
- Se crearon las políticas RLS apropiadas
- Se creó la función `aceptar_terminos_seguridad`

### 3. Probar la Funcionalidad
1. Registra un nuevo usuario con términos aceptados
2. Verifica en la tabla `usuarios` que `acepta_terminos = true`
3. Verifica en la tabla `politicas_seguridad` que hay un registro
4. Intenta hacer login - debería funcionar
5. Prueba con un usuario que no haya aceptado términos (si existe) - debería tener acceso limitado

## Cómo Funciona

### Políticas RLS (Row Level Security)
Las políticas RLS en Supabase ahora requieren que los usuarios hayan aceptado términos para:
- Ver sus propios datos en la tabla `usuarios`
- Actualizar sus propios datos
- Acceder a cualquier dato protegido

### Función `aceptar_terminos_seguridad`
Esta función de PostgreSQL:
- Verifica que el usuario existe
- Registra la aceptación en `politicas_seguridad`
- Actualiza automáticamente `acepta_terminos` en `usuarios`
- Registra información del dispositivo y IP (si se proporciona)

### Flujo de la Aplicación
1. **Registro**: El usuario debe marcar el checkbox de términos
2. **Login**: El usuario debe marcar el checkbox de términos
3. **Acceso**: Solo usuarios con términos aceptados pueden usar la app completamente

## Tablas Involucradas

### `usuarios`
- `acepta_terminos` (BOOLEAN) - Indica si aceptó términos
- `fecha_aceptacion_terminos` (TIMESTAMP) - Cuándo aceptó

### `politicas_seguridad`
- `usuario_id` - ID del usuario
- `politica_version` - Versión de la política (ej: '1.0')
- `aceptada` - Si aceptó esta versión
- `fecha_aceptacion` - Cuándo aceptó
- `ip_aceptacion` - IP del dispositivo
- `dispositivo_info` - Información del dispositivo (JSON)

## Funciones del Servicio de Autenticación

### `acceptSecurityTerms(userId, deviceInfo)`
Acepta términos para un usuario específico.

### `checkTermsAcceptance(userId)`
Verifica si un usuario ha aceptado términos.

### `loginUser(identifier, password, acceptTermsIfNeeded, deviceInfo)`
Login con aceptación automática de términos si es necesario.

### `registerUser(userData)`
Registro que incluye aceptación de términos.

## Solución de Problemas

### Error: "Usuario no encontrado"
- Verifica que el `userId` sea correcto
- Asegúrate de que el usuario existe en la tabla `usuarios`

### Error en Políticas RLS
- Verifica que las políticas se crearon correctamente
- Asegúrate de que `acepta_terminos = true` para el usuario

### Términos no se registran
- Verifica que la función `aceptar_terminos_seguridad` existe
- Revisa los logs de la aplicación para errores

## Consideraciones de Seguridad
- Las políticas RLS protegen los datos a nivel de base de datos
- La aceptación se registra con timestamp e información del dispositivo
- Se mantiene un historial de aceptaciones por versión de política
- Los usuarios no pueden modificar su estado de aceptación manualmente

## Próximos Pasos
1. Personalizar el texto de las políticas de seguridad
2. Agregar versiones de políticas para actualizaciones futuras
3. Implementar notificaciones cuando cambien las políticas
4. Agregar auditoría adicional si es necesario