require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la base de datos
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'lumex_2',
  port: Number(process.env.MYSQL_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.on('error', (err) => {
  console.error('[DB ERROR]', err);
});

// Almacenamiento temporal de OTPs (En producción usar Redis o DB)
const otps = {};

app.use(cors());
app.use(express.json());

// Middleware para ver qué llega al servidor
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// --- ENDPOINTS DE AUTENTICACIÓN ---

// Login
app.post('/api/auth/login', async (req, res) => {
  const { identifier, passwordHash } = req.body;
  try {
    const isEmail = identifier.includes('@');
    const field = isEmail ? 'email' : 'usuario';

    const [rows] = await pool.query(
      `SELECT * FROM usuarios WHERE ${field} = ?`,
      [identifier.trim().toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const user = rows[0];

    // Verificación básica de contraseña (el hash debe coincidir)
    if (user.contrasena !== passwordHash) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }

    // Limpiar objeto de usuario para el frontend
    const { contrasena, ...safeUser } = user;

    res.json({
      success: true,
      user: safeUser,
      termsAccepted: !!user.acepta_terminos
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Registro
app.post('/api/auth/register', async (req, res) => {
  const { email, username, name, phone, passwordHash } = req.body;
  try {
    console.log(`🔍 Verificando existencia de: ${email} / ${username}`);
    const [existing] = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE email = ? OR usuario = ?',
      [email, username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'El correo o usuario ya existe' });
    }

    console.log(`📝 Intentando insertar nuevo usuario: ${email}`);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, usuario, rol, contrasena, telefono, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [name, email, username, 'usuario', passwordHash, phone]
    );

    console.log(`✅ Usuario registrado con ID: ${result.insertId}`);
    const [newUser] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [result.insertId]);
    const { contrasena, ...safeUser } = newUser[0];

    res.json({ success: true, user: safeUser, message: 'Usuario registrado correctamente' });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// --- ENDPOINTS DE DASHBOARD Y USUARIOS ---

// Listar usuarios (para SuperAdmin)
app.get('/api/admin/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id_usuario, nombre, email, usuario, rol, fecha_registro FROM usuarios ORDER BY fecha_registro DESC');
    res.json({ success: true, users: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint de prueba para verificar conexión ojo si no sirve eliminar esta parte completa 
app.get('/', (req, res) => {
  res.send('Servidor activo');
});


// Actualizar rol
app.post('/api/admin/update-role', async (req, res) => {
  const { userId, newRole } = req.body;
  try {
    await pool.query('UPDATE usuarios SET rol = ? WHERE id_usuario = ?', [newRole, userId]);
    res.json({ success: true, message: 'Rol actualizado' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Eliminar usuario
app.delete('/api/admin/user/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM usuarios WHERE id_usuario = ?', [req.params.id]);
    res.json({ success: true, message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Actualizar datos completos de usuario
app.post('/api/admin/update-user', async (req, res) => {
  const { id_usuario, nombre, email, usuario, rol, telefono } = req.body;
  try {
    await pool.query(
      'UPDATE usuarios SET nombre = ?, email = ?, usuario = ?, rol = ?, telefono = ? WHERE id_usuario = ?',
      [nombre, email, usuario, rol, telefono, id_usuario]
    );
    res.json({ success: true, message: 'Usuario actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar usuario: ' + error.message });
  }
});

// Obtener usuario actual (refresco)
app.post('/api/auth/get-user', async (req, res) => {
  const { userId } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [userId]);
    if (rows.length === 0) return res.status(404).json({ success: false });
    const { contrasena, ...safeUser } = rows[0];
    res.json({ success: true, user: safeUser });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Descontar un crédito por análisis
app.post('/api/auth/deduct-credit', async (req, res) => {
  const { userId } = req.body;
  try {
    const [user] = await pool.query('SELECT analisis_disponibles FROM usuarios WHERE id_usuario = ?', [userId]);
    if (user[0].analisis_disponibles <= 0) {
      return res.status(400).json({ success: false, message: 'No tienes créditos suficientes' });
    }
    await pool.query('UPDATE usuarios SET analisis_disponibles = analisis_disponibles - 1 WHERE id_usuario = ?', [userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const crypto = require('crypto');

// Añadir créditos (Compra) y Registrar Pago con Validación Robusta
app.post('/api/auth/add-credits', async (req, res) => {
  const { userId, amount, monto, metodoPago, descripcion } = req.body;
  
  // Forzar tipos numéricos
  const safeUserId = Number(userId);
  const safeAmount = Number(amount);
  const safeMonto = Number(monto);

  try {
    if (!safeUserId || isNaN(safeUserId)) {
      return res.status(400).json({ success: false, message: 'ID de usuario invalido' });
    }

    // 0. Verificar que el usuario existe (para evitar fallos de llave foranea en pagos)
    const [userExists] = await pool.query('SELECT id_usuario FROM usuarios WHERE id_usuario = ?', [safeUserId]);
    if (userExists.length === 0) {
      return res.status(404).json({ success: false, message: 'El usuario no existe en la base de datos' });
    }

    const idPago = crypto.randomUUID();
    
    // 1. Aumentar créditos del usuario
    await pool.query('UPDATE usuarios SET analisis_disponibles = analisis_disponibles + ? WHERE id_usuario = ?', [safeAmount, safeUserId]);
    
    // 2. Registrar la transacción en la tabla pagos
    await pool.query(
      'INSERT INTO pagos (id_pago, id_usuario, monto, moneda, descripcion, metodo_pago, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        idPago, 
        safeUserId, 
        safeMonto, 
        'USD', 
        descripcion || `Compra de ${safeAmount} creditos`, 
        metodoPago || 'Tarjeta', 
        'completado'
      ]
    );

    res.json({ success: true, message: `Se han añadido ${safeAmount} créditos correctamente` });
  } catch (error) {
    console.error('Error en add-credits:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al procesar el pago en el servidor',
      detail: error.sqlMessage || error.message 
    });
  }
});

// Aceptar términos
app.post('/api/auth/accept-terms', async (req, res) => {
  const { userId } = req.body;
  try {
    await pool.query('UPDATE usuarios SET acepta_terminos = 1, fecha_aceptacion_terminos = NOW() WHERE id_usuario = ?', [userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Recuperar contraseña (Generar código)
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const [rows] = await pool.query('SELECT id_usuario FROM usuarios WHERE email = ?', [normalizedEmail]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Correo no registrado' });
    }
    
    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Guardar en memoria (expira en 15 min)
    otps[normalizedEmail] = {
      code,
      expires: Date.now() + (15 * 60 * 1000)
    };

    console.log("**************************************************");
    console.log(`🔑 CÓDIGO PARA: ${normalizedEmail}`);
    console.log(`👉 CÓDIGO: ${code}`);
    console.log("**************************************************");
    
    res.json({ success: true, message: 'Código generado correctamente. Revisa la consola del servidor.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// Verificar código
app.post('/api/auth/verify-token', async (req, res) => {
  const { email, token } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  
  const stored = otps[normalizedEmail];
  
  if (!stored) {
    return res.status(400).json({ success: false, message: 'No hay un código pendiente para este correo' });
  }
  
  if (Date.now() > stored.expires) {
    delete otps[normalizedEmail];
    return res.status(400).json({ success: false, message: 'El código ha expirado' });
  }
  
  if (stored.code !== token) {
    return res.status(400).json({ success: false, message: 'Código incorrecto' });
  }
  
  res.json({ success: true, message: 'Código verificado' });
});

// Cambiar contraseña real
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  
  try {
    // En una App real aquí deberíamos verificar que el token fue validado antes.
    // Para el demo, lo permitimos si el email existe.
    await pool.query('UPDATE usuarios SET contrasena = ? WHERE email = ?', [newPassword, normalizedEmail]);
    
    // Limpiar OTP después de usarlo
    delete otps[normalizedEmail];
    
    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar contraseña' });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor MySQL corriendo en:`);
  console.log(`   - Local: http://localhost:${PORT}`);
  console.log(`   - Red:   http://192.168.20.141:${PORT}`);
});

server.on('error', (err) => {
  console.error('[SERVER ERROR]', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`OJO: El puerto ${PORT} ya está en uso por otro proceso.`);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
