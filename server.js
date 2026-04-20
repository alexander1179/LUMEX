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
    console.error(error);
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
      JOIN datasets d ON a.id_dataset = d.id_dataset
      JOIN modelos m ON a.id_modelo = m.id_modelo
      WHERE a.id_usuario = ?
      ORDER BY a.fecha_analisis DESC LIMIT 50
    `;
    const [rows] = await pool.query(query, [userId]);
    const mapped = rows.map(item => ({
      id_analisis: item.id_analisis,
      fecha_analisis: item.fecha_analisis,
      total_registros: item.total_registros,
      total_anomalias: item.total_anomalias,
      datasets: { nombre_archivo: item.nombre_archivo, ruta_archivo: item.ruta_archivo },
      modelos: { tipo_modelo: item.tipo_modelo, descripcion: item.descripcion, nombre_modelo: item.nombre_modelo }
    }));
    return res.json({ success: true, data: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Admin endpoints
app.get('/api/admin/users', async (req, res) => {
  try {
    const query = `
      SELECT id_usuario, nombre, email, usuario, rol, estado, fecha_registro, 
             puede_gestionar_usuarios, permiso_editar, permiso_bloquear,
             mod_nuevo_paciente, mod_gestion_usuarios, mod_reportes, mod_actividad, mod_alertas
      FROM usuarios 
      WHERE rol NOT IN ('admin', 'administrador', 'superadmin', 'superadministrador') 
      ORDER BY fecha_registro DESC
    `;
    const [rows] = await pool.query(query);
    res.json({ success: true, users: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/superadmin/users', async (req, res) => {
  try {
    const query = `
      SELECT id_usuario, nombre, email, usuario, rol, estado, fecha_registro, telefono,
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
});

app.post('/api/superadmin/toggle-admin-permission', async (req, res) => {
  const { id_usuario, field, value } = req.body;
  
  // Lista blanca de campos permitidos
  const allowedFields = [
    'puede_gestionar_usuarios', 'permiso_editar', 'permiso_bloquear',
    'mod_nuevo_paciente', 'mod_gestion_usuarios', 'mod_reportes', 'mod_actividad', 'mod_alertas', 'mod_pagos'
  ];
  if (!allowedFields.includes(field)) {
    return res.status(400).json({ success: false, message: 'Campo de permiso no válido' });
  }

  try {
    const query = `UPDATE usuarios SET ${field} = ? WHERE id_usuario = ?`;
    await pool.query(query, [value, id_usuario]);
    res.json({ success: true, message: 'Permiso actualizado' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/admin/update-user', async (req, res) => {
  const { id_usuario, nombre, email, usuario, rol, telefono } = req.body;
  try {
    await pool.query('UPDATE usuarios SET nombre = ?, email = ?, usuario = ?, rol = ?, telefono = ? WHERE id_usuario = ?', [nombre, email, usuario, rol, telefono, id_usuario]);
    res.json({ success: true, message: 'Usuario actualizado' });
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

app.get('/api/admin/activity', async (req, res) => {
  try {
    const query = `
      SELECT a.id_analisis, a.id_usuario, a.id_dataset, a.id_modelo, a.fecha_analisis, a.total_registros, a.total_anomalias,
             u.nombre AS usuario_nombre, u.usuario AS usuario_username, u.email AS usuario_email,
             d.nombre_archivo AS dataset_nombre,
             m.tipo_modelo, m.descripcion, m.nombre_modelo
      FROM analisis a
      LEFT JOIN usuarios u ON a.id_usuario = u.id_usuario
      LEFT JOIN datasets d ON a.id_dataset = d.id_dataset
      LEFT JOIN modelos m ON a.id_modelo = m.id_modelo
      ORDER BY a.fecha_analisis DESC
      LIMIT 100
    `;
    const [rows] = await pool.query(query);
    res.json({ success: true, activity: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/admin/payments', async (req, res) => {
  try {
    const query = `
      SELECT p.*, u.nombre AS usuario_nombre, u.usuario AS usuario_username, u.email AS usuario_email
      FROM pagos p
      LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
      ORDER BY p.created_at DESC
    `;
    const [rows] = await pool.query(query);
    res.json({ success: true, payments: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// 404 — Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Ruta no encontrada: ${req.method} ${req.url}` });
});

// 500 — Error global (4 parámetros obligatorios para que Express lo reconozca como error handler)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err?.message || err);
  res.status(500).json({ success: false, message: err?.message || 'Error interno del servidor' });
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
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60000;
    
    // Guardar en memoria cache
    otpMemCache.set(normalizedEmail, { otp, expiresAt });

    console.log("**************************************************");
    console.log(`🔑 CÓDIGO PARA: ${normalizedEmail}`);
    console.log(`👉 CÓDIGO: ${otp}`);
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
  
  const cacheObj = otpMemCache.get(normalizedEmail);
  
  if (!cacheObj) {
    return res.status(400).json({ success: false, message: 'No hay un código pendiente para este correo' });
  }
  
  if (Date.now() > cacheObj.expiresAt) {
    otpMemCache.delete(normalizedEmail);
    return res.status(400).json({ success: false, message: 'El código ha expirado' });
  }
  
  if (cacheObj.otp !== String(token)) {
    return res.status(400).json({ success: false, message: 'Código incorrecto' });
  }
  
  // Marcar como verificado para permitir reset
  otpMemCache.set(normalizedEmail, { ...cacheObj, verified: true });
  
  res.json({ success: true, message: 'Código verificado' });
});

// Cambiar contraseña real
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  
  try {
    const cacheObj = otpMemCache.get(normalizedEmail);
    if (!cacheObj || !cacheObj.verified) {
      return res.status(403).json({ success: false, message: 'Debes verificar el código primero' });
    }

    await pool.query('UPDATE usuarios SET contrasena = ? WHERE email = ?', [newPassword, normalizedEmail]);
    
    // Limpiar cache después de usarlo
    otpMemCache.delete(normalizedEmail);
    
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

