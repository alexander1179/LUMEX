## Problema verificado

La app ya llama correctamente a `supabase.auth.signInWithOtp(...)` en [src/services/supabase/authService.js](src/services/supabase/authService.js).

Supabase envia:

- Magic link si la plantilla contiene `{{ .ConfirmationURL }}`
- Codigo OTP si la plantilla contiene `{{ .Token }}`

Por eso el correo actual sigue mostrando "Enlace magico": la plantilla del proyecto en Supabase no esta configurada para OTP.

## Que plantilla editar

En el dashboard de Supabase:

1. Ve a Authentication.
2. Ve a Email Templates.
3. Edita la plantilla `Magic Link`.
4. Reemplaza el contenido por el HTML de [SUPABASE_MAGIC_LINK_OTP_TEMPLATE.html](SUPABASE_MAGIC_LINK_OTP_TEMPLATE.html).
5. Guarda los cambios.

## Importante

- No uses `{{ .ConfirmationURL }}` si quieres solo codigo.
- Usa `{{ .Token }}`.
- El flujo actual de la app valida ese codigo con `verifyOtp({ email, token, type: 'email' })`.

## Flujo esperado despues del cambio

1. Usuario solicita recuperacion en [src/screens/ForgotPasswordScreen.js](src/screens/ForgotPasswordScreen.js).
2. Supabase envia un correo con codigo de 6 digitos.
3. Usuario copia el codigo.
4. Usuario lo ingresa en [src/screens/VerifyTokenScreen.js](src/screens/VerifyTokenScreen.js).
5. La app verifica el OTP y abre [src/screens/ResetPasswordScreen.js](src/screens/ResetPasswordScreen.js).
6. Usuario cambia la contrasena.