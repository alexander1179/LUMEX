# LUMEX

Aplicación móvil desarrollada con **React Native + Expo**, integrada con **Supabase**, orientada a la gestión de autenticación de usuarios, recuperación de acceso, validación de credenciales, soporte multilenguaje y personalización visual mediante temas.

---

## Tabla de contenido

1. [Descripción general](#descripción-general)
2. [Objetivo del proyecto](#objetivo-del-proyecto)
3. [Características principales](#características-principales)
4. [Tecnologías utilizadas](#tecnologías-utilizadas)
5. [Arquitectura general](#arquitectura-general)
6. [Estructura del proyecto](#estructura-del-proyecto)
7. [Descripción detallada de carpetas y archivos](#descripción-detallada-de-carpetas-y-archivos)
8. [Relación entre módulos](#relación-entre-módulos)
9. [Instalación](#instalación)
10. [Configuración de entorno](#configuración-de-entorno)
11. [Ejecución del proyecto](#ejecución-del-proyecto)
12. [Flujo funcional de la aplicación](#flujo-funcional-de-la-aplicación)
13. [Capturas o evidencias](#capturas-o-evidencias)
14. [Seguridad y buenas prácticas](#seguridad-y-buenas-prácticas)
15. [Posibles mejoras futuras](#posibles-mejoras-futuras)
16. [Control de versiones](#control-de-versiones)
17. [Autor](#autor)
18. [Licencia](#licencia)

---

## Descripción general

**LUMEX** es una aplicación móvil construida con Expo y React Native, diseñada para implementar un flujo completo de autenticación y gestión de acceso de usuarios. El proyecto incorpora pantallas de login, registro, recuperación de contraseña, validación de token, pruebas de conectividad con Supabase, soporte para idiomas y una arquitectura modular que separa claramente la interfaz, la lógica de negocio, la configuración, los servicios y los estilos.

El proyecto está organizado de forma que sea más fácil de mantener, escalar y documentar.

---

## Objetivo del proyecto

El objetivo principal de este proyecto es desarrollar una base funcional de aplicación móvil que permita:

- registrar usuarios
- autenticar accesos
- recuperar contraseñas
- validar tokens
- manejar configuración visual mediante temas
- soportar múltiples idiomas
- integrarse con Supabase como backend de autenticación

Además, la estructura está pensada para facilitar el aprendizaje, las pruebas y la evolución futura del sistema.

---

## Características principales

- Inicio de sesión de usuarios
- Registro de nuevos usuarios
- Recuperación y restablecimiento de contraseña
- Verificación de token
- Integración con Supabase
- Cambio de tema visual
- Internacionalización en español e inglés
- Componentes reutilizables
- Hooks personalizados
- Servicios desacoplados
- Scripts de diagnóstico y validación
- Documentación técnica complementaria

---

## Tecnologías utilizadas

- **React Native**
- **Expo**
- **JavaScript**
- **Supabase**
- **Node.js**
- **Context API**
- **Hooks personalizados**
- **JSON**
- **Git y GitHub**

---

## Arquitectura general

La aplicación se encuentra organizada en módulos especializados:

- **Interfaz de usuario**: componentes y pantallas
- **Lógica reutilizable**: hooks personalizados
- **Configuración**: archivos de conexión y parámetros globales
- **Estado global**: contextos como el manejo de tema
- **Servicios**: integración con almacenamiento, Supabase y APIs
- **Internacionalización**: traducciones centralizadas
- **Estilos**: paleta, tipografías y estilos globales
- **Utilidades**: validaciones, constantes y formateadores
- **Documentación y pruebas**: scripts auxiliares y archivos Markdown de soporte

---

## Estructura del proyecto

```bash
LUMEX/
│
├── .expo/
├── assets/
│   ├── android-icon-background.png
│   ├── android-icon-foreground.png
│   ├── android-icon-monochrome.png
│   ├── favicon.png
│   ├── icon.png
│   ├── lumex.jpeg
│   └── splash-icon.png
│
├── node_modules/
│
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── PasswordRequirements.js
│   │   └── common/
│   │       ├── CustomButton.js
│   │       ├── CustomInput.js
│   │       ├── LanguageSelector.js
│   │       ├── LoadingSpinner.js
│   │       └── ThemeToggle.js
│   │
│   ├── config/
│   │   └── supabaseConfig.js
│   │
│   ├── context/
│   │   └── ThemeContext.js
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useCountdown.js
│   │   ├── useSupabaseAuth.js
│   │   └── useTranslation.js
│   │
│   ├── i18n/
│   │   ├── index.js
│   │   └── locales/
│   │       ├── en.json
│   │       └── es.json
│   │
│   ├── navigation/
│   │   └── AppNavigator.js
│   │
│   ├── screens/
│   │   ├── ForgotPasswordScreen.js
│   │   ├── GraciasScreen.js
│   │   ├── LoginScreen.js
│   │   ├── MainScreen.js
│   │   ├── PrivacyScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── ResetPasswordScreen.js
│   │   ├── SimpleTestScreen.js
│   │   ├── TestConnectionScreen.js
│   │   ├── TestRegistroScreen.js
│   │   ├── TestSupabaseScreen.js
│   │   ├── VerifyTokenScreen.js
│   │   └── WelcomeScreen.js
│   │
│   ├── services/
│   │   ├── services/
│   │   │   ├── api/
│   │   │   │   └── apiConfig.js
│   │   │   └── storage/
│   │   │       └── storageService.js
│   │   ├── storage/
│   │   │   └── storageService.js
│   │   └── supabase/
│   │       ├── authService.js
│   │       └── supabaseClient.js
│   │
│   ├── styles/
│   │   ├── colors.js
│   │   ├── fonts.js
│   │   ├── globalStyles.js
│   │   └── globalTheme.js
│   │
│   └── utils/
│       ├── constants.js
│       ├── formatters.js
│       └── validators.js
│
├── .gitignore
├── App.js
├── app.json
├── CHECKLIST_USUARIO_SUPABASE.md
├── CORRECCION_TERMINOS.md
├── diagnostic.js
├── diagnostico_registro.js
├── index.js
├── package-lock.json
├── package.json
├── prueba_registro.js
├── README_POLITICAS_SEGURIDAD.md
├── server.js
├── SOLUCION_API_KEY.md
├── SUPABASE_SETUP_README.md
├── test_security_policies.js
├── tsconfig.json
└── verificar_terminos.js

Descripción detallada de carpetas y archivos

Archivos de la raíz
.gitignore
Archivo que define qué elementos no deben versionarse en Git, como dependencias, configuraciones temporales o variables de entorno.

App.js
Componente principal de la aplicación. Suele encargarse de montar la estructura base, providers globales y la navegación principal.

app.json
Archivo de configuración de Expo. Define metadatos del proyecto, nombre de la app, iconos, splash screen y otros ajustes del entorno.

index.js
Punto de entrada del proyecto. Registra el componente principal para iniciar la aplicación.

package.json
Define el nombre del proyecto, dependencias, scripts de ejecución y configuración general de Node.js.

package-lock.json
Bloquea las versiones exactas de las dependencias instaladas para mantener consistencia entre entornos.

tsconfig.json
Configuración de TypeScript. Puede estar presente por compatibilidad del entorno o para futura integración de tipado estático.

server.js
Archivo relacionado con lógica de servidor, integración auxiliar, experimentación o pruebas. Conviene revisarlo especialmente si maneja configuración sensible.

Documentación complementaria en la raíz
CHECKLIST_USUARIO_SUPABASE.md
Documento de apoyo que parece estar orientado a revisar o validar el flujo de usuario asociado a Supabase.

CORRECCION_TERMINOS.md
Documento de soporte donde probablemente se registran ajustes de contenido, redacción o validaciones relacionadas con términos y condiciones.

README_POLITICAS_SEGURIDAD.md
Archivo enfocado en políticas de seguridad, criterios de protección o prácticas seguras del proyecto.

SOLUCION_API_KEY.md
Documento de apoyo relacionado con el manejo o solución de problemas asociados a API Keys. Debe revisarse para evitar exponer credenciales reales.

SUPABASE_SETUP_README.md
Documento técnico de configuración de Supabase dentro del proyecto.

Scripts auxiliares y de prueba

diagnostic.js
Script de diagnóstico general del proyecto o del entorno.

diagnostico_registro.js
Script orientado a revisar o depurar el flujo de registro.

prueba_registro.js
Archivo utilizado para realizar pruebas del proceso de registro de usuarios.

test_security_policies.js
Script que aparenta validar reglas o políticas de seguridad.

verificar_terminos.js
Script relacionado con verificación de términos, validaciones textuales o reglas asociadas a contenido legal.

Carpeta assets/
La carpeta assets/ almacena recursos gráficos y visuales utilizados por la aplicación.
Archivos identificados
•	android-icon-background.png 
•	android-icon-foreground.png 
•	android-icon-monochrome.png 
•	favicon.png 
•	icon.png 
•	lumex.jpeg 
•	splash-icon.png

Función general
Estos recursos participan en la identidad visual de la aplicación, el ícono del proyecto, la imagen splash y otros elementos gráficos del entorno Expo.

Carpeta src/
Contiene el código fuente principal de la aplicación.

src/components/
Agrupa componentes reutilizables de la interfaz.

src/components/auth/PasswordRequirements.js
Componente destinado a mostrar o validar requisitos de contraseña, especialmente útil durante registro o cambio de clave.

src/components/common/CustomButton.js
Botón reutilizable con estilos propios del proyecto.

src/components/common/CustomInput.js
Campo de entrada reutilizable para formularios y captura de datos.

src/components/common/LanguageSelector.js
Componente para cambiar el idioma de la interfaz.

src/components/common/LoadingSpinner.js
Indicador visual de carga para procesos asíncronos.

src/components/common/ThemeToggle.js
Control para alternar entre temas visuales disponibles.

src/config/
src/config/supabaseConfig.js
Archivo de configuración asociado a Supabase. Centraliza parámetros de conexión y ajustes del servicio.

src/context/
src/context/ThemeContext.js
Contexto global utilizado para compartir y administrar el tema visual en toda la aplicación.

src/hooks/
Contiene hooks personalizados que encapsulan lógica reutilizable.

src/hooks/useAuth.js
Hook que centraliza lógica general de autenticación.
src/hooks/useCountdown.js
Hook para temporizadores o cuentas regresivas, útil en validación de tokens u operaciones temporales.

src/hooks/useSupabaseAuth.js
Hook específico para integrar y reutilizar lógica de autenticación con Supabase.

src/hooks/useTranslation.js
Hook para consumir el sistema de traducciones de forma simple dentro de la interfaz.

src/i18n/
Gestiona la internacionalización del proyecto.

src/i18n/index.js
Archivo central para inicializar la configuración de idiomas.

src/i18n/locales/en.json
Archivo de textos en inglés.

src/i18n/locales/es.json
Archivo de textos en español.

src/navigation/
src/navigation/AppNavigator.js
Archivo encargado de gestionar la navegación principal entre pantallas de la aplicación.

src/screens/
Contiene las pantallas funcionales del sistema.

ForgotPasswordScreen.js
Pantalla para recuperación de contraseña.

GraciasScreen.js
Pantalla de confirmación o cierre de un proceso exitoso.

LoginScreen.js
Pantalla de acceso para usuarios registrados.

MainScreen.js
Pantalla principal luego de iniciar sesión correctamente.

PrivacyScreen.js
Pantalla orientada a políticas de privacidad o contenido legal.
RegisterScreen.js
Pantalla de registro de nuevos usuarios.

ResetPasswordScreen.js
Pantalla para definir una nueva contraseña tras recuperación.

SimpleTestScreen.js
Pantalla de pruebas básicas para validar comportamiento general.

TestConnectionScreen.js
Pantalla de verificación de conectividad.

TestRegistroScreen.js
Pantalla de pruebas específica para el proceso de registro.

TestSupabaseScreen.js
Pantalla dedicada a validar la integración con Supabase.

VerifyTokenScreen.js
Pantalla para ingresar o validar tokens.

WelcomeScreen.js
Pantalla de bienvenida o punto inicial del recorrido del usuario.

src/services/
Contiene la lógica de acceso a datos, persistencia y conexión con servicios externos.

src/services/services/api/apiConfig.js
Configuración base de APIs, endpoints o ajustes de comunicación externa.

src/services/services/storage/storageService.js
Servicio de almacenamiento persistente, probablemente usado para guardar sesiones, tokens o preferencias.

src/services/storage/storageService.js
Existe una segunda ubicación para almacenamiento. Esto sugiere una posible duplicidad o una refactorización pendiente.

src/services/supabase/authService.js
Servicio que concentra operaciones de autenticación con Supabase.

src/services/supabase/supabaseClient.js
Cliente principal para establecer la conexión con Supabase.
src/styles/
Contiene la identidad visual y estilos compartidos.

colors.js
Paleta de colores del proyecto.

fonts.js
Configuración tipográfica.

globalStyles.js
Estilos globales reutilizables.

globalTheme.js
Definición de temas visuales de la aplicación.

src/utils/
Agrupa funciones auxiliares y constantes globales.

constants.js
Constantes reutilizables dentro del proyecto.

formatters.js
Funciones para formatear valores, textos o datos.

validators.js
Funciones para validar entradas y formularios.

Relación entre módulos
El funcionamiento general del proyecto puede interpretarse de esta manera:
1.	index.js inicia la aplicación. 
2.	App.js monta el componente raíz. 
3.	AppNavigator.js organiza el recorrido entre pantallas. 
4.	Las pantallas dentro de src/screens/ consumen: 
o	componentes de src/components/ 
o	hooks de src/hooks/ 
o	estilos de src/styles/ 
o	utilidades de src/utils/ 
o	traducciones de src/i18n/ 
5.	La autenticación está relacionada con: 
o	src/config/supabaseConfig.js 
o	src/services/supabase/supabaseClient.js 
o	src/services/supabase/authService.js 
o	src/hooks/useAuth.js 
o	src/hooks/useSupabaseAuth.js 
6.	El tema visual se articula con: 
o	src/context/ThemeContext.js 
o	src/styles/globalTheme.js 
o	src/components/common/ThemeToggle.js 
7.	El soporte multilenguaje depende de: 
o	src/i18n/index.js 
o	src/i18n/locales/es.json 
o	src/i18n/locales/en.json 
o	src/hooks/useTranslation.js 

Instalación
Clona el repositorio:
git clone https://github.com/alexander1179/LUMEX.git
Ingresa al directorio del proyecto:
cd LUMEX
Instala las dependencias:
npm install

Configuración de entorno
Este proyecto utiliza Supabase, por lo que antes de ejecutar correctamente la aplicación es recomendable configurar las variables necesarias.

Ejemplo de archivo .env

SUPABASE_URL=tu_url_supabase
SUPABASE_ANON_KEY=tu_clave_anon
Archivos relacionados con esta configuración
•	src/config/supabaseConfig.js 
•	src/services/supabase/supabaseClient.js 
•	src/services/supabase/authService.js 
•	SUPABASE_SETUP_README.md 

Importante
No se deben exponer claves sensibles dentro del código fuente, especialmente credenciales privadas o service_role keys.

Ejecución del proyecto
Para iniciar el entorno de desarrollo:
npm start
O con Expo:
npx expo start
Dependiendo del entorno, podrás ejecutarlo en:
•	Expo Go 
•	emulador Android 
•	simulador iOS 
•	navegador web, si está habilitado 

Flujo funcional de la aplicación
El flujo funcional principal del proyecto parece estar organizado de la siguiente manera:
1.	Pantalla de bienvenida 
o	WelcomeScreen.js 
2.	Inicio de sesión 
o	LoginScreen.js 
3.	Registro 
o	RegisterScreen.js 
o	apoyo en validaciones de contraseña con PasswordRequirements.js 
4.	Recuperación de contraseña 
o	ForgotPasswordScreen.js 
o	ResetPasswordScreen.js 
5.	Verificación de token 
o	VerifyTokenScreen.js 
6.	Pantallas de prueba y validación 
o	SimpleTestScreen.js 
o	TestConnectionScreen.js 
o	TestRegistroScreen.js 
o	TestSupabaseScreen.js 
7.	Pantalla principal 
o	MainScreen.js 
8.	Pantallas complementarias 
o	PrivacyScreen.js 
o	GraciasScreen.js 

Capturas o evidencias
Puedes agregar aquí capturas de pantalla de la aplicación para hacer el repositorio más visual.
Ejemplo
## Capturas

### Pantalla de bienvenida
![Welcome](./assets/capturas/welcome.png)

### Inicio de sesión
![Login](./assets/capturas/login.png)

### Registro
![Register](./assets/capturas/register.png)

### Pantalla principal
![Main](./assets/capturas/main.png)
Si todavía no tienes capturas, puedes dejar esta sección como pendiente.

Seguridad y buenas prácticas
Para mantener el proyecto seguro y ordenado:
•	no subir archivos .env 
•	no exponer claves privadas 
•	evitar credenciales dentro de server.js 
•	revisar documentos como SOLUCION_API_KEY.md 
•	mantener actualizado .gitignore 
•	validar reglas de seguridad antes de producción 

Archivos relevantes para esta revisión:
•	README_POLITICAS_SEGURIDAD.md 
•	SOLUCION_API_KEY.md 
•	test_security_policies.js 

Posibles mejoras futuras
•	unificar la estructura de src/services/ para evitar duplicidades 
•	mover toda configuración sensible a variables de entorno 
•	agregar pruebas automatizadas 
•	mejorar la documentación de cada flujo 
•	añadir capturas de pantalla reales 
•	incorporar manejo de errores más detallado 
•	documentar scripts de diagnóstico 
•	agregar una guía técnica de despliegue 

Control de versiones
Flujo básico para subir cambios al repositorio:
git add .
git commit -m "Actualización del proyecto"
git push

Autor
Alexander1179

Licencia
Proyecto de uso académico, formativo







