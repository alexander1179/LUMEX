const bcrypt = require('bcrypt');

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
app.set('trust proxy', 1); // Confiar en el proxy (necesario para Railway/Heroku/Nginx)

const PORT = process.env.PORT || 3000;

// ===== Configuración de Entorno (Debug) =====
console.log('🛠️ Iniciando servidor en entorno:', process.env.NODE_ENV || 'development');

// Fallback para MYSQL_URL (típico en algunos entornos de Railway/Heroku)
if (process.env.MYSQL_URL && (!process.env.MYSQLHOST || !process.env.MYSQLDATABASE)) {
    try {
        const url = new URL(process.env.MYSQL_URL);
        process.env.MYSQLHOST = url.hostname;
        process.env.MYSQLPORT = url.port || '3306';
        process.env.MYSQLUSER = url.username;
        process.env.MYSQLPASSWORD = url.password;
        process.env.MYSQLDATABASE = url.pathname.replace(/^\//, '');
        console.log('🔗 Variables cargadas desde MYSQL_URL');
    } catch (e) {
        console.error('❌ Error parseando MYSQL_URL:', e.message);
    }
}

console.log('🔍 Detectando variables de base de datos:');
console.log('- MYSQLHOST:', process.env.MYSQLHOST ? '✅ Configurado' : '❌ Falta');
console.log('- MYSQLUSER:', process.env.MYSQLUSER ? '✅ Configurado' : '❌ Falta');
console.log('- MYSQLDATABASE:', process.env.MYSQLDATABASE ? '✅ Configurado' : '❌ Falta');
console.log('- MYSQLPORT:', process.env.MYSQLPORT ? `✅ (${process.env.MYSQLPORT})` : '⚠️ No definido (usando 3306)');

// ===== MySQL Pool Configuration =====
const pool = mysql.createPool({
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQLDATABASE || 'lumex_db',
    port: parseInt(process.env.MYSQLPORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000, // 10 segundos
});

// Test connection
pool.getConnection()
    .then(connection => {
        console.log('✅ Conexión exitosa al Pool de MySQL');
        connection.release();
    })
    .catch(err => {
        console.error('❌ ERROR CRÍTICO DE CONEXIÓN A MYSQL:');
        console.error('Código:', err.code);
        console.error('Mensaje:', err.message);
        console.error('Host intentado:', process.env.MYSQLHOST || 'localhost');
    });

pool.on('error', (err) => {
    console.error('⚠️ [POOL ERROR]:', err.code, err.message);
});

// ===== Auto Migration =====
const runMigrations = async () => {
    try {
        // 1. Crear tabla usuarios si no existe
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id_usuario INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255),
                email VARCHAR(255) UNIQUE,
                usuario VARCHAR(255) UNIQUE,
                contrasena VARCHAR(255),
                telefono VARCHAR(50),
                rol VARCHAR(50) DEFAULT 'usuario',
                fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
                acepta_terminos TINYINT(1) DEFAULT 0,
                estado VARCHAR(20) DEFAULT 'activo',
                analisis_disponibles INT DEFAULT 0,
                permiso_editar TINYINT DEFAULT 0,
                permiso_bloquear TINYINT DEFAULT 0,
                mod_nuevo_paciente TINYINT DEFAULT 0,
                mod_gestion_usuarios TINYINT DEFAULT 0,
                mod_reportes TINYINT DEFAULT 0,
                mod_actividad TINYINT DEFAULT 0,
                mod_alertas TINYINT DEFAULT 0,
                mod_pagos TINYINT DEFAULT 0,
                puede_gestionar_usuarios TINYINT DEFAULT 0,
                fecha_aceptacion_terminos DATETIME NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 2. Crear tabla pagos
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pagos (
                id_pago VARCHAR(255) PRIMARY KEY,
                id_usuario INT,
                monto DECIMAL(10,2),
                moneda VARCHAR(10) DEFAULT 'USD',
                descripcion TEXT,
                metodo_pago VARCHAR(100),
                estado VARCHAR(50),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 3. Crear tabla datasets
        await pool.query(`
            CREATE TABLE IF NOT EXISTS datasets (
                id_dataset INT AUTO_INCREMENT PRIMARY KEY,
                id_usuario INT,
                nombre_archivo VARCHAR(255),
                ruta_archivo TEXT,
                fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 4. Crear tabla modelos
        await pool.query(`
            CREATE TABLE IF NOT EXISTS modelos (
                id_modelo INT AUTO_INCREMENT PRIMARY KEY,
                nombre_modelo VARCHAR(255),
                descripcion TEXT,
                tipo_modelo VARCHAR(100),
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 5. Crear tabla analisis
        await pool.query(`
            CREATE TABLE IF NOT EXISTS analisis (
                id_analisis INT AUTO_INCREMENT PRIMARY KEY,
                id_usuario INT,
                id_dataset INT,
                id_modelo INT,
                fecha_analisis DATETIME DEFAULT CURRENT_TIMESTAMP,
                total_registros INT,
                total_anomalias INT,
                tipo_analisis VARCHAR(100),
                tipo_visualizacion VARCHAR(100),
                estado VARCHAR(50),
                FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
                FOREIGN KEY (id_dataset) REFERENCES datasets(id_dataset) ON DELETE CASCADE,
                FOREIGN KEY (id_modelo) REFERENCES modelos(id_modelo) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 6. Crear tabla resultados
        await pool.query(`
            CREATE TABLE IF NOT EXISTS resultados (
                id_resultado INT AUTO_INCREMENT PRIMARY KEY,
                id_analisis INT,
                indice_registro INT,
                error_reconstruccion DOUBLE,
                es_anomalia TINYINT(1),
                FOREIGN KEY (id_analisis) REFERENCES analisis(id_analisis) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 7. Crear tabla audit_logs
        await pool.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id_log INT AUTO_INCREMENT PRIMARY KEY,
                id_usuario INT,
                accion VARCHAR(255),
                detalles TEXT,
                ip_address VARCHAR(45),
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Migrar columnas adicionales en usuarios si ya existe
        const [columns] = await pool.query('SHOW COLUMNS FROM usuarios');
        const names = columns.map(c => c.Field);

        const migrations = [
            { name: 'permiso_editar', query: 'ALTER TABLE usuarios ADD COLUMN permiso_editar TINYINT DEFAULT 0' },
            { name: 'permiso_bloquear', query: 'ALTER TABLE usuarios ADD COLUMN permiso_bloquear TINYINT DEFAULT 0' },
            { name: 'mod_nuevo_paciente', query: 'ALTER TABLE usuarios ADD COLUMN mod_nuevo_paciente TINYINT DEFAULT 0' },
            { name: 'mod_gestion_usuarios', query: 'ALTER TABLE usuarios ADD COLUMN mod_gestion_usuarios TINYINT DEFAULT 0' },
            { name: 'mod_reportes', query: 'ALTER TABLE usuarios ADD COLUMN mod_reportes TINYINT DEFAULT 0' },
            { name: 'mod_actividad', query: 'ALTER TABLE usuarios ADD COLUMN mod_actividad TINYINT DEFAULT 0' },
            { name: 'mod_alertas', query: 'ALTER TABLE usuarios ADD COLUMN mod_alertas TINYINT DEFAULT 0' },
            { name: 'mod_pagos', query: 'ALTER TABLE usuarios ADD COLUMN mod_pagos TINYINT DEFAULT 0' },
            { name: 'puede_gestionar_usuarios', query: 'ALTER TABLE usuarios ADD COLUMN puede_gestionar_usuarios TINYINT DEFAULT 0' },
            { name: 'acepta_terminos', query: 'ALTER TABLE usuarios ADD COLUMN acepta_terminos TINYINT(1) DEFAULT 0' },
            { name: 'fecha_aceptacion_terminos', query: 'ALTER TABLE usuarios ADD COLUMN fecha_aceptacion_terminos DATETIME NULL' },
            { name: 'estado', query: 'ALTER TABLE usuarios ADD COLUMN estado VARCHAR(20) DEFAULT "activo"' },
            { name: 'analisis_disponibles', query: 'ALTER TABLE usuarios ADD COLUMN analisis_disponibles INT DEFAULT 0' }
        ];

        for (const meta of migrations) {
            if (!names.includes(meta.name)) {
                await pool.query(meta.query);
                console.log(`✅ Columna ${meta.name} añadida`);
            }
        }
        console.log('🚀 Migraciones completadas.');
    } catch (error) {
        console.error('❌ Error en migraciones:', error.message);
    }
};
runMigrations();

// Helper para registro de auditoría
const logAudit = async (userId, action, details, req = null) => {
    try {
        let rolePrefix = '';
        if (userId) {
            const [userRows] = await pool.query('SELECT rol FROM usuarios WHERE id_usuario = ?', [userId]);
            if (userRows.length > 0) {
                const role = userRows[0].rol || 'desconocido';
                rolePrefix = `[${role.toUpperCase()}] `;
            }
        }

        const ip = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null;
        const finalDetails = `${rolePrefix}${details || ''}`;

        await pool.query(
            'INSERT INTO audit_logs (id_usuario, accion, detalles, ip_address, fecha) VALUES (?, ?, ?, ?, NOW())',
            [userId || null, action, finalDetails, ip]
        );
    } catch (error) {
        console.error('⚠️ [AUDIT ERROR]:', error.message);
    }
};

// ===== SMTP Configuration =====
const smtpConfigured = [
    process.env.SMTP_HOST,
    process.env.SMTP_PORT,
    process.env.SMTP_USER,
    process.env.SMTP_PASS,
    process.env.SMTP_FROM,
].every((value) => !!value);

console.log('--- ESTADO DE VARIABLES SMTP ---');
console.log('SMTP_HOST:', process.env.SMTP_HOST ? '✅ OK' : '❌ FALTA');
console.log('SMTP_PORT:', process.env.SMTP_PORT ? '✅ OK' : '❌ FALTA');
console.log('SMTP_USER:', process.env.SMTP_USER ? '✅ OK' : '❌ FALTA');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✅ OK' : '❌ FALTA');
console.log('SMTP_FROM:', process.env.SMTP_FROM ? '✅ OK' : '❌ FALTA');
console.log('¿SMTP Configurado?', smtpConfigured ? '🟢 SÍ' : '🔴 NO (Funciones de correo desactivadas)');
console.log('---------------------------------');

const transporter = smtpConfigured
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 3000, // Fallar rápido para que la app no tire timeout
        greetingTimeout: 3000,
    })
    : null;

if (!smtpConfigured) {
    console.warn('⚠️ SMTP no configurado. El endpoint /forgot-password quedará deshabilitado.');
}

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' })); // Default to * but allow restriction via ENV
app.use(express.json());

// Rate limit para endpoints de autenticación
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // Límite de 10 peticiones por IP en la ventana
    message: { success: false, message: 'Demasiados intentos desde esta IP, por favor intente más tarde.' }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// Middleware de Logs
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});
// Middleware de compatibilidad para rutas legadas (dashboards que no usan /api)
app.use((req, res, next) => {
    const legacyPrefixes = ['/auth', '/admin', '/superadmin', '/analysis', '/payments'];
    const path = req.originalUrl || req.url;
    const hasLegacyPrefix = legacyPrefixes.some(p => path.startsWith(p));

    if (hasLegacyPrefix && !path.startsWith('/api/')) {
        console.log(`[ROUTING] Adaptando ruta legacy: ${path} -> /api${path}`);
        req.url = '/api' + path;
    }
    next();
});

const normalizeEmail = (email = '') => email.trim().toLowerCase();

// Cache OTP (Email -> { otp, expiresAt, verified })
const otpMemCache = new Map();
const OTP_EXPIRY_MINUTES = 15;

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

const buildOtpEmailHtml = (otp) => `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937;">
    <h2 style="margin: 0 0 16px; color: #111827;">Recuperación de contraseña</h2>
    <p style="font-size: 16px; line-height: 1.5; margin: 0 0 16px;">
      Usa este código de 6 dígitos en la app de Lumex para cambiar tu contraseña.
    </p>
    <div style="margin: 24px 0; padding: 18px; background: #f3f4f6; border-radius: 12px; text-align: center;">
      <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #d32f2f;">${otp}</div>
    </div>
    <p style="font-size: 14px; line-height: 1.5; margin: 0 0 12px; color: #4b5563;">
      El código expira en ${OTP_EXPIRY_MINUTES} minutos.
    </p>
  </div>
`;

// ==========================================
// HEALTH
// ==========================================
app.get('/health', async (_req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 as result');
        res.json({ success: true, message: 'Servidor y BD activos', dbResult: rows[0].result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Servidor activo pero BD inactiva', details: error.message });
    }
});

// ==========================================
// AUTH & USERS
// ==========================================
app.post('/api/auth/register', async (req, res) => {
    let { email, username, name, phone, passwordHash, rol, terminos_aceptados, acceptTerms } = req.body;

    // 1. Validar nombre
    if (!name || name.trim() === '') {
        return res.status(400).json({ success: false, message: 'El nombre es requerido.' });
    }

    // 2. Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'El formato del email es inválido.' });
    }

    // 3. Validar username
    const usernameRegex = /^[^\s]{3,20}$/;
    if (!username || !usernameRegex.test(username)) {
        return res.status(400).json({ success: false, message: 'El nombre de usuario debe tener entre 3 y 20 caracteres y no contener espacios.' });
    }

    // 4. Validar password (ya viene hasheado)
    if (!passwordHash || passwordHash.length < 40) {
        return res.status(400).json({ success: false, message: 'La contraseña es inválida o no fue procesada correctamente.' });
    }

    // 5. Validar teléfono
    const phoneRegex = /^\+?\d+$/;
    if (!phone || !phoneRegex.test(String(phone).replace(/\s/g, ''))) {
        return res.status(400).json({ success: false, message: 'El teléfono es requerido y debe contener solo números.' });
    }

    // 6. Validar aceptación de términos
    const accepted = terminos_aceptados === 1 || terminos_aceptados === true || terminos_aceptados === '1' || terminos_aceptados === 'true' || acceptTerms === true || acceptTerms === 1 || acceptTerms === 'true' || acceptTerms === '1';
    if (!accepted) {
        return res.status(400).json({ success: false, message: 'Debe aceptar los términos y condiciones.' });
    }

    // Validar rol permitido, si no viene o no es válido, se pone 'usuario' por defecto
    const validRoles = ['usuario', 'administrador', 'enfermero', 'doctor'];
    const finalRole = validRoles.includes(String(rol).toLowerCase()) ? String(rol).toLowerCase() : 'usuario';

    try {
        const [existing] = await pool.query('SELECT id_usuario FROM usuarios WHERE email = ? OR usuario = ? LIMIT 1', [email, username]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'El correo o nombre de usuario ya está registrado.' });
        }

        const hashedPassword = await bcrypt.hash(passwordHash, 10);

        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre, email, usuario, rol, contrasena, telefono, fecha_registro, acepta_terminos, fecha_aceptacion_terminos, analisis_disponibles, permiso_editar, permiso_bloquear, mod_nuevo_paciente, mod_gestion_usuarios, mod_reportes, mod_actividad, mod_alertas, mod_pagos, puede_gestionar_usuarios) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)',
            [name, email || null, username || null, finalRole, hashedPassword, phone || null, accepted ? 1 : 0, accepted ? new Date() : null]
        );

        await logAudit(result.insertId, 'Registro', `Registro de cuenta para ${finalRole.toUpperCase()} ${name} (Usuario: ${username})`, req);

        const [newUser] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [result.insertId]);
        return res.json({ success: true, user: newUser[0], message: 'Usuario registrado correctamente' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error interno en registro.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { identifier, passwordHash, requiredRole } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ? OR usuario = ? LIMIT 1', [identifier, identifier]);
        if (rows.length === 0) return res.status(401).json({ success: false, message: 'Usuario no encontrado' });

        const user = rows[0];

        const isAdmin = ['admin', 'administrador', 'superadmin'].includes(String(user.rol).trim().toLowerCase());
        if (requiredRole === 'admin' && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Solo administradores.' });
        }

        if (user.estado === 'bloqueado') {
            return res.status(403).json({ success: false, message: 'Tu cuenta ha sido bloqueada. Contacta al soporte.' });
        }

        const match = await bcrypt.compare(passwordHash, user.contrasena);

        if (!match) {
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }

        const termsAccepted = !!user.acepta_terminos;
        const { contrasena, ...safeUser } = user;

        await logAudit(user.id_usuario, 'Login', `Inicio de sesión exitoso (${user.rol})`, req);

        return res.json({ success: true, user: safeUser, termsAccepted });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error interno en login.' });
    }
});

app.post('/api/auth/get-user', async (req, res) => {
    const { userId } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ? LIMIT 1', [userId]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        const { contrasena, ...safeUser } = rows[0];
        return res.json({ success: true, user: safeUser });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error al obtener usuario.' });
    }
});

app.get('/api/debug-smtp', (req, res) => {
    const smtpConfigured = [
        process.env.SMTP_HOST,
        process.env.SMTP_PORT,
        process.env.SMTP_USER,
        process.env.SMTP_PASS,
        process.env.SMTP_FROM,
    ].every((value) => !!value);
    
    res.json({
        smtpConfigured,
        variables: {
            SMTP_HOST: process.env.SMTP_HOST || 'MISSING',
            SMTP_PORT: process.env.SMTP_PORT || 'MISSING',
            SMTP_USER: process.env.SMTP_USER ? 'SET' : 'MISSING',
            SMTP_PASS: process.env.SMTP_PASS ? 'SET' : 'MISSING',
            SMTP_FROM: process.env.SMTP_FROM || 'MISSING'
        }
    });
});

app.post('/api/auth/latest-data', async (req, res) => {
    const { userId } = req.body;
    try {
        const [rows] = await pool.query(
            'SELECT id_usuario, nombre, email, usuario, rol, analisis_disponibles, acepta_terminos, mod_pagos, mod_nuevo_paciente, mod_gestion_usuarios, mod_reportes, mod_actividad, mod_alertas FROM usuarios WHERE id_usuario = ?',
            [userId]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        res.json({ success: true, user: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/auth/accept-terms', async (req, res) => {
    const { userId } = req.body;
    try {
        await pool.query('UPDATE usuarios SET acepta_terminos = true, fecha_aceptacion_terminos = NOW() WHERE id_usuario = ?', [userId]);
        return res.json({ success: true, message: 'Términos aceptados' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error al aceptar términos.' });
    }
});

// Recuperar contraseña
app.post('/api/auth/forgot-password', async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    if (!email) return res.status(400).json({ success: false, message: 'El correo es requerido' });

    try {
        const [rows] = await pool.query('SELECT id_usuario FROM usuarios WHERE email = ? LIMIT 1', [email]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Correo no registrado' });
        }

        const otp = generateOtp();
        const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60000;
        otpMemCache.set(email, { otp, expiresAt });

        if (!transporter) {
            console.log(`\n--- ERROR DE CONFIGURACIÓN ---`);
            console.log(`SMTP_HOST: ${process.env.SMTP_HOST ? 'OK' : 'VACÍO'}`);
            console.log(`SMTP_PORT: ${process.env.SMTP_PORT ? 'OK' : 'VACÍO'}`);
            console.log(`SMTP_USER: ${process.env.SMTP_USER ? 'OK' : 'VACÍO'}`);
            console.log(`SMTP_PASS: ${process.env.SMTP_PASS ? 'OK' : 'VACÍO'}`);
            console.log(`SMTP_FROM: ${process.env.SMTP_FROM ? 'OK' : 'VACÍO'}`);
            console.log(`------------------------------`);
            console.log(`[AVISO] El sistema de correos (SMTP) no está configurado.`);
            console.log(`[INFO] Modo manual activo. Entregue este código al usuario de ${email}:`);
            console.log(`👉 CÓDIGO OTP: ${otp}\n`);
            return res.json({ 
                success: true, 
                message: 'No hay SMTP configurado. Revisa la consola o ingresa este código por defecto.',
                devOtp: otp 
            });
        }

        try {
            console.log(`📧 Intentando enviar correo a ${email}...`);
            await transporter.sendMail({
                from: process.env.SMTP_FROM,
                to: email,
                subject: 'Código de seguridad - Lumex',
                text: `Tu código es: ${otp}\nExpira en ${OTP_EXPIRY_MINUTES} minutos.`,
                html: buildOtpEmailHtml(otp),
            });
            console.log(`✅ OTP enviado exitosamente a ${email}`);
            return res.json({ success: true, message: 'Código enviado correctamente a tu correo' });
        } catch (mailError) {
            console.error(`❌ [SMTP ERROR] Error al enviar a ${email}:`);
            console.error(`- Mensaje: ${mailError.message}`);
            console.error(`- Código: ${mailError.code}`);
            console.error(`- Comando: ${mailError.command}`);
            
            return res.status(500).json({ 
                success: false, 
                message: `Error enviando correo: ${mailError.code || 'Timeout'}. Verifica los logs.` 
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error interno al procesar recuperación' });
    }
});

app.post('/api/auth/verify-token', (req, res) => {
    const { email, token } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const cacheObj = otpMemCache.get(normalizedEmail);

    if (!cacheObj) return res.status(400).json({ success: false, message: 'No hay código pendiente o expiró.' });
    if (Date.now() > cacheObj.expiresAt) {
        otpMemCache.delete(normalizedEmail);
        return res.status(400).json({ success: false, message: 'El código ha expirado.' });
    }
    if (cacheObj.otp !== String(token)) {
        return res.status(400).json({ success: false, message: 'Código inválido.' });
    }

    otpMemCache.set(normalizedEmail, { ...cacheObj, verified: true });
    return res.json({ success: true, message: 'Código verificado correctamente.' });
});

app.post('/api/auth/reset-password', async (req, res) => {
    const { email, passwordHash } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const cacheObj = otpMemCache.get(normalizedEmail);

    if (!cacheObj || !cacheObj.verified) return res.status(400).json({ success: false, message: 'Verifica el código antes.' });

    try {
        const hashedPassword = await bcrypt.hash(passwordHash, 10);
        await pool.query(
            'UPDATE usuarios SET contrasena = ? WHERE email = ?',
            [hashedPassword, normalizedEmail]
        );
        otpMemCache.delete(normalizedEmail);
        return res.json({ success: true, message: 'Contraseña actualizada' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error interno.' });
    }
});

// ==========================================
// PAYMENTS & CREDITS
// ==========================================

app.post('/api/payments/register', async (req, res) => {
    const { userId, amount, monto, metodoPago, metodo, description, descripcion, credits, creditsToAdd } = req.body;

    const safeUserId = Number(userId);
    // Priorizar los nombres enviados por paymentService.js
    const safeCredits = Number(credits || creditsToAdd || 0);
    const safeMonto = Number(monto || amount || 0);
    const finalMetodo = metodo || metodoPago || 'Tarjeta';
    const finalDesc = description || descripcion || `Compra de ${safeCredits} créditos`;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [user] = await conn.query('SELECT id_usuario FROM usuarios WHERE id_usuario = ?', [safeUserId]);
        if (user.length === 0) throw new Error('Usuario no encontrado');

        const idPago = crypto.randomUUID();
        await conn.query(
            'INSERT INTO pagos (id_pago, id_usuario, monto, moneda, descripcion, metodo_pago, estado, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            [idPago, safeUserId, safeMonto, 'USD', finalDesc, finalMetodo, 'completado']
        );

        await conn.query(
            'UPDATE usuarios SET analisis_disponibles = COALESCE(analisis_disponibles, 0) + ? WHERE id_usuario = ?',
            [safeCredits, safeUserId]
        );

        await conn.commit();
        res.json({ 
            success: true, 
            message: `¡Pago exitoso! Se han añadido ${safeCredits} créditos a tu cuenta. ¡Gracias por tu compra! Ahora puedes proceder a realizar tus análisis.`,
            newCredits: safeCredits 
        });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ success: false, message: err.message });
    } finally {
        conn.release();
    }
});

app.post('/api/auth/add-credits', async (req, res) => {
    return app._router.handle({ method: 'POST', url: '/api/payments/register', body: req.body }, res);
});

app.post('/api/payments/consume', async (req, res) => {
    const { userId } = req.body;
    try {
        const [result] = await pool.query(
            'UPDATE usuarios SET analisis_disponibles = GREATEST(0, COALESCE(analisis_disponibles, 0) - 1) WHERE id_usuario = ? AND COALESCE(analisis_disponibles, 0) > 0',
            [userId]
        );
        if (result.affectedRows === 0) return res.status(403).json({ success: false, message: 'No tienes créditos suficientes' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/auth/deduct-credit', async (req, res) => {
    const { userId } = req.body;
    try {
        const [result] = await pool.query(
            'UPDATE usuarios SET analisis_disponibles = GREATEST(0, COALESCE(analisis_disponibles, 0) - 1) WHERE id_usuario = ? AND COALESCE(analisis_disponibles, 0) > 0',
            [userId]
        );
        if (result.affectedRows === 0) return res.status(400).json({ success: false, message: 'Créditos agotados' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

const getPaymentsBackoffice = async (req, res) => {
    try {
        const query = `
      SELECT p.*, u.nombre as usuario_nombre, u.email as usuario_email, u.usuario as usuario_username
      FROM pagos p
      LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
      ORDER BY p.created_at DESC
    `;
        const [rows] = await pool.query(query);
        res.json({ success: true, payments: rows, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

app.get('/api/payments/all', getPaymentsBackoffice);
app.get('/api/admin/payments', getPaymentsBackoffice);

// ==========================================
// ANALYSIS
// ==========================================
const toNumberOrNull = (value) => {
    if (value === null || value === undefined) return null;
    const normalized = String(value).replace(',', '.').trim();
    if (!normalized) return null;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : null;
};

const buildResultsWithNsp = (rows, nspKey) => {
    return rows.map((row, index) => {
        const nspValue = toNumberOrNull(row?.[nspKey]);
        const normalizedNsp = nspValue === null ? 1 : Math.round(nspValue);
        const isAnomaly = normalizedNsp !== 1;
        const reconstructionError = nspValue === null ? 0 : Math.min(1, Math.max(0, Math.abs(nspValue - 1) / 2));
        return { id_analisis: null, indice_registro: index, error_reconstruccion: Number(reconstructionError.toFixed(6)), es_anomalia: isAnomaly };
    });
};

const buildResultsWithZScore = (rows, headers) => {
    const numericHeaders = headers.filter((header) => rows.some((row) => toNumberOrNull(row?.[header]) !== null));
    if (numericHeaders.length === 0) {
        return rows.map((_, index) => ({ id_analisis: null, indice_registro: index, error_reconstruccion: 0, es_anomalia: false }));
    }
    const stats = numericHeaders.map((header) => {
        const values = rows.map((row) => toNumberOrNull(row?.[header])).filter((v) => v !== null);
        const mean = values.reduce((s, v) => s + v, 0) / values.length;
        const std = Math.sqrt(values.reduce((s, v) => s + ((v - mean) ** 2), 0) / values.length) || 1;
        return { header, mean, std };
    });
    return rows.map((row, index) => {
        const scores = stats.map(({ header, mean, std }) => Math.abs((toNumberOrNull(row?.[header]) || 0 - mean) / std));
        const avgZScore = scores.reduce((s, v) => s + v, 0) / scores.length;
        return { id_analisis: null, indice_registro: index, error_reconstruccion: Number(Math.min(1, avgZScore / 4).toFixed(6)), es_anomalia: avgZScore >= 2 };
    });
};

const buildResults = ({ rows, headers }) => {
    const nspKey = headers.find((h) => String(h || '').trim().toLowerCase() === 'nsp');
    return nspKey ? buildResultsWithNsp(rows, nspKey) : buildResultsWithZScore(rows, headers);
};

const RESULTS_BATCH_SIZE = 500;
const insertResultadosInBatches = async (resultados, analisisId, connection) => {
    const sql = 'INSERT INTO resultados (id_analisis, indice_registro, error_reconstruccion, es_anomalia) VALUES ?';
    const values = resultados.map(r => [analisisId, r.indice_registro, r.error_reconstruccion, r.es_anomalia ? 1 : 0]);
    for (let i = 0; i < values.length; i += RESULTS_BATCH_SIZE) {
        await connection.query(sql, [values.slice(i, i + RESULTS_BATCH_SIZE)]);
    }
};

const MODEL_BY_ANALYSIS = {
    anomalias: { nombre: 'RandomForestClassifier', descripcion: 'Detección de anomalías', tipo: 'clasificacion' },
    clasificacion: { nombre: 'RandomForestClassifier', descripcion: 'Clasificación', tipo: 'clasificacion' },
    regresion: { nombre: 'RandomForestRegressor', descripcion: 'Regresión', tipo: 'regresion' },
    clustering: { nombre: 'KMeans', descripcion: 'Clustering', tipo: 'clustering' },
};

app.post('/api/analysis/save', async (req, res) => {
    try {
        const {
            userId, analysisType, datasetName, datasetPath, parsedDataset,
            analysisSummary, totalRegistros: rootTotal, totalAnomalias: rootAnomalias,
            visualizationType
        } = req.body || {};
        const numericUserId = Number(userId);

        const headers = Array.isArray(parsedDataset?.headers) ? parsedDataset.headers : [];
        const rows = Array.isArray(parsedDataset?.rows) ? parsedDataset.rows : [];

        const totalRegistros = rootTotal ?? analysisSummary?.totalRegistros ?? rows.length;
        const totalAnomalias = rootAnomalias ?? analysisSummary?.totalAnomalias ?? 0;
        const finalVizType = visualizationType || 'histograma';
        const hasSummary = !!(rootTotal || analysisSummary?.totalRegistros);

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Descontar crédito de forma atómica
            const [updateRes] = await conn.query(
                'UPDATE usuarios SET analisis_disponibles = GREATEST(0, COALESCE(analisis_disponibles, 0) - 1) WHERE id_usuario = ? AND COALESCE(analisis_disponibles, 0) > 0',
                [numericUserId]
            );

            if (updateRes.affectedRows === 0) {
                throw new Error('No tienes créditos suficientes para realizar este análisis.');
            }

            const modelConfig = MODEL_BY_ANALYSIS[analysisType] || MODEL_BY_ANALYSIS.anomalias;
            const [modelInsert] = await conn.query('INSERT INTO modelos (nombre_modelo, descripcion, tipo_modelo, fecha_creacion) VALUES (?, ?, ?, NOW())', [modelConfig.nombre, modelConfig.descripcion, modelConfig.tipo]);
            const [datasetInsert] = await conn.query('INSERT INTO datasets (id_usuario, nombre_archivo, ruta_archivo, fecha_subida) VALUES (?, ?, ?, NOW())', [numericUserId, datasetName || 'dataset.csv', datasetPath || 'movil://dataset']);

            const resultados = (hasSummary || (totalRegistros > 0 && rows.length === 0)) ? [] : buildResults({ rows, headers });
            const finalAnomalias = (totalAnomalias === 0 && resultados.length > 0)
                ? resultados.reduce((s, r) => s + (r.es_anomalia ? 1 : 0), 0)
                : totalAnomalias;

            const [analisisInsert] = await conn.query(
                'INSERT INTO analisis (id_usuario, id_dataset, id_modelo, fecha_analisis, total_registros, total_anomalias, tipo_analisis, tipo_visualizacion, estado) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?)',
                [numericUserId, datasetInsert.insertId, modelInsert.insertId, totalRegistros, finalAnomalias, analysisType || 'anomalias', finalVizType, 'completado']
            );

            if (!hasSummary && resultados.length > 0) {
                await insertResultadosInBatches(resultados, analisisInsert.insertId, conn);
            }

            await conn.commit();
            // Obtener créditos actualizados del usuario
            const [userRow] = await conn.query('SELECT analisis_disponibles FROM usuarios WHERE id_usuario = ?', [numericUserId]);
            const creditosRestantes = userRow[0]?.analisis_disponibles ?? 0;

            console.log(`[ANALYSIS SUCCESS] userId=${numericUserId}, used=1, remaining=${creditosRestantes}`);

            res.json({ success: true, idAnalisis: analisisInsert.insertId, totalRegistros, totalAnomalias, creditosRestantes });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('[ANALYSIS SAVE ERROR]', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/analysis/history', async (req, res) => {
    const { userId } = req.body;
    try {
        const query = `
      SELECT a.id_analisis, a.fecha_analisis, a.total_registros, a.total_anomalias,
             d.nombre_archivo, d.ruta_archivo,
             m.tipo_modelo, m.descripcion, m.nombre_modelo
      FROM analisis a
      LEFT JOIN datasets d ON a.id_dataset = d.id_dataset
      LEFT JOIN modelos m ON a.id_modelo = m.id_modelo
      WHERE a.id_usuario = ?
      ORDER BY a.fecha_analisis DESC LIMIT 50
    `;
        const [rows] = await pool.query(query, [userId]);
        const mapped = rows.map(item => ({
            id_analisis: item.id_analisis,
            fecha_analisis: item.fecha_analisis,
            total_registros: item.total_registros,
            total_anomalias: item.total_anomalias,
            nombre_archivo: item.nombre_archivo || `analisis_${item.id_analisis}.csv`,
            ruta_archivo: item.ruta_archivo,
            tipo_modelo: item.tipo_modelo,
            nombre_modelo: item.nombre_modelo,
        }));
        return res.json({ success: true, data: mapped });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// Admin endpoints
const getAllActivity = async (req, res) => {
    try {
        const query = `
      SELECT a.*, u.nombre as usuario_nombre, u.usuario as usuario_username, u.email as usuario_email,
             d.nombre_archivo as dataset_nombre, m.nombre_modelo, m.tipo_modelo
      FROM analisis a
      JOIN usuarios u ON a.id_usuario = u.id_usuario
      LEFT JOIN datasets d ON a.id_dataset = d.id_dataset
      LEFT JOIN modelos m ON a.id_modelo = m.id_modelo
      ORDER BY a.fecha_analisis DESC
    `;
        const [rows] = await pool.query(query);
        res.json({ success: true, activity: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllUsersBackoffice = async (req, res) => {
    try {
        const query = `
      SELECT id_usuario, nombre, email, usuario, rol, estado, fecha_registro, 
             puede_gestionar_usuarios, permiso_editar, permiso_bloquear,
             mod_nuevo_paciente, mod_gestion_usuarios, mod_reportes, mod_actividad, mod_alertas, mod_pagos
      FROM usuarios 
      ORDER BY fecha_registro DESC
    `;
        const [rows] = await pool.query(query);
        res.json({ success: true, users: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

app.get('/api/admin/activity', getAllActivity);
app.get('/api/admin/users', getAllUsersBackoffice);
app.get('/api/superadmin/users', getAllUsersBackoffice);

app.post('/api/superadmin/toggle-admin-permission', async (req, res) => {
    const { id_usuario, field, value, executorId } = req.body;

    if (!executorId) {
        return res.status(400).json({ success: false, message: 'ACTUALIZA TU APP: La aplicación no está enviando tu ID (executorId).' });
    }

    const allowedFields = [
        'puede_gestionar_usuarios', 'permiso_editar', 'permiso_bloquear',
        'mod_nuevo_paciente', 'mod_gestion_usuarios', 'mod_reportes', 'mod_actividad', 'mod_alertas', 'mod_pagos'
    ];
    if (!allowedFields.includes(field)) {
        return res.status(400).json({ success: false, message: 'Campo de permiso no válido' });
    }

    try {
        // Obtener info del usuario objetivo para el log
        const [targetRows] = await pool.query('SELECT nombre, rol FROM usuarios WHERE id_usuario = ?', [id_usuario]);
        const target = targetRows[0] || { nombre: 'Desconocido', rol: 'N/D' };

        const query = `UPDATE usuarios SET ${field} = ? WHERE id_usuario = ?`;
        await pool.query(query, [value ? 1 : 0, id_usuario]);

        // Registrar quién hizo el cambio con info detallada del objetivo
        await logAudit(
            executorId, 
            'Cambio de Permiso', 
            `Permiso "${field}" cambiado a ${value ? 'Activo' : 'Inactivo'} para el ${(target.rol || 'N/D').toUpperCase()} ${target.nombre || 'Desconocido'}`, 
            req
        );

        res.json({ success: true, message: `Permiso ${field} actualizado` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

const updateUserHandler = async (req, res) => {
    const { id_usuario, nombre, email, usuario, rol, telefono, passwordHash, executorId } = req.body;
    try {
        let query = 'UPDATE usuarios SET nombre=?, email=?, usuario=?, rol=?, telefono=?';
        let params = [nombre, email, usuario, rol, telefono];

        if (passwordHash) {
            query += ', contrasena=?';
            params.push(passwordHash);
        }

        query += ' WHERE id_usuario=?';
        params.push(id_usuario);

        await pool.query(query, params);

        // Registrar quién hizo la actualización
        await logAudit(
            executorId || id_usuario, 
            'Actualización de Perfil', 
            `Perfil de ${(rol || 'N/D').toUpperCase()} ${nombre || 'Desconocido'} modificado (Usuario: ${usuario})`, 
            req
        );

        res.json({ success: true, message: 'Usuario actualizado con éxito' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar usuario: ' + error.message });
    }
};

app.post('/api/admin/update-user', updateUserHandler);
app.post('/admin/update-user', updateUserHandler);

// (Ruta duplicada eliminada)


const blockUserHandler = async (req, res) => {
    const { id_usuario, blocked, executorId } = req.body;
    
    if (!executorId) {
        return res.status(400).json({ success: false, message: 'ACTUALIZA TU APP: La aplicación no está enviando tu ID (executorId).' });
    }
    try {
        // Obtener info del usuario objetivo
        const [targetRows] = await pool.query('SELECT nombre, rol FROM usuarios WHERE id_usuario = ?', [id_usuario]);
        const target = targetRows[0] || { nombre: 'Desconocido', rol: 'N/D' };

        const estado = blocked ? 'bloqueado' : 'activo';
        await pool.query('UPDATE usuarios SET estado = ? WHERE id_usuario = ?', [estado, id_usuario]);
        
        // Registrar quién bloqueó/desbloqueó con info detallada
        await logAudit(
            executorId, 
            blocked ? 'Bloqueo de Usuario' : 'Desbloqueo de Usuario', 
            `La cuenta de ${target.nombre || 'Desconocido'} (${(target.rol || 'N/D').toUpperCase()}) fue marcada como: ${estado}`, 
            req
        );

        res.json({ success: true, message: `Usuario ${estado}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

app.post('/api/admin/block-user', blockUserHandler);
app.post('/admin/block-user', blockUserHandler);

// ELIMINAR USUARIO DEFINITIVAMENTE
const deleteUser = async (req, res) => {
    const { userId } = req.params;
    const { executorId } = req.query; // Pasamos executorId por query param en DELETE
    
    if (!executorId) {
        return res.status(400).json({ success: false, message: 'ACTUALIZA TU APP: La aplicación no está enviando tu ID (executorId).' });
    }
    try {
        // Obtener info ANTES de borrar
        const [targetRows] = await pool.query('SELECT nombre, rol FROM usuarios WHERE id_usuario = ?', [userId]);
        const target = targetRows[0] || { nombre: 'Desconocido', rol: 'N/D' };

        const [result] = await pool.query('DELETE FROM usuarios WHERE id_usuario = ?', [userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado o ya eliminado.' });
        }

        await logAudit(executorId, 'Eliminación Definitiva', `El ${(target.rol || 'N/D').toUpperCase()} ${target.nombre || 'Desconocido'} ha sido eliminado definitivamente del sistema`, req);

        res.json({ success: true, message: 'Usuario eliminado definitivamente del sistema.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno: ' + error.message });
    }
};

app.get('/api/superadmin/audit-logs', async (req, res) => {
    try {
        const query = `
            SELECT l.*, u.nombre as usuario_nombre, u.usuario as usuario_username, u.rol as usuario_rol
            FROM audit_logs l 
            LEFT JOIN usuarios u ON l.id_usuario = u.id_usuario 
            ORDER BY l.fecha DESC LIMIT 100
        `;
        const [rows] = await pool.query(query);
        res.json({ success: true, logs: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/admin/user/:userId', deleteUser);
app.delete('/admin/user/:userId', deleteUser);

// Final Handlers
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Ruta no encontrada: ${req.method} ${req.url}` });
});

app.use((err, req, res, next) => {
    console.error('[SERVER ERROR]', err?.message || err);
    res.status(500).json({ success: false, message: err?.message || 'Error interno del servidor' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor MySQL corriendo en puerto ${PORT}`);
});
