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

app.use(cors());
app.use(express.json());

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

app.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000');
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor MySQL corriendo en:`);
  console.log(`   - Local: http://localhost:${PORT}`);
  console.log(`   - Red:   http://192.168.20.141:${PORT}`);
});
