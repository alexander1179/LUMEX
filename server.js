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

// --- GESTIÓN DE ANÁLISIS ---
app.post('/api/analysis/save', async (req, res) => {
  const { userId, analysisType, visualizationType, datasetName, datasetPath, totalRegistros, totalAnomalias } = req.body;
  
  try {
    // 1. Guardar metadatos del dataset
    const [datasetResult] = await pool.query(
      'INSERT INTO datasets (id_usuario, nombre_archivo, ruta_archivo, total_filas) VALUES (?, ?, ?, ?)',
      [userId, datasetName, datasetPath, totalRegistros]
    );

    const idDataset = datasetResult.insertId;

    // 2. Guardar el análisis
    const [analysisResult] = await pool.query(
      'INSERT INTO analisis (id_usuario, id_dataset, tipo_analisis, tipo_visualizacion, total_registros, total_anomalias, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, idDataset, analysisType, visualizationType, totalRegistros, totalAnomalias, 'completado']
    );

    res.json({ 
      success: true, 
      idAnalisis: analysisResult.insertId,
      idDataset,
      totalAnomalias 
    });
  } catch (error) {
    console.error('Error saving analysis:', error);
    res.status(500).json({ success: false, message: 'Error de base de datos' });
  }
});

app.post('/api/analysis/history', async (req, res) => {
  const { userId } = req.body;
  try {
    const [rows] = await pool.query(
      `SELECT a.id_analisis, a.fecha_analisis, a.tipo_analisis, a.total_registros, a.total_anomalias, d.nombre_archivo 
       FROM analisis a 
       JOIN datasets d ON a.id_dataset = d.id_dataset 
       WHERE a.id_usuario = ? 
       ORDER BY a.fecha_analisis DESC`,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// --- COMPRA DE CRÉDITOS ---
app.post('/api/payments/purchase', async (req, res) => {
  const { userId, planType, monto, metodoPago } = req.body;
  
  const creditsMap = {
    'basico': 1,
    'diamante': 3
  };
  
  const creditsToAdd = creditsMap[planType.toLowerCase()] || 0;
  
  if (creditsToAdd === 0) {
    return res.status(400).json({ success: false, message: 'Plan no válido' });
  }

  try {
    // 1. Crear registro de pago
    const id_pago = require('crypto').randomUUID();
    await pool.query(
      'INSERT INTO pagos (id_pago, id_usuario, monto, moneda, descripcion, metodo_pago, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id_pago, userId, monto, 'USD', `Compra de Plan ${planType}`, metodoPago, 'approved']
    );

    // 2. Actualizar créditos del usuario
    await pool.query(
      'UPDATE usuarios SET analisis_disponibles = analisis_disponibles + ? WHERE id_usuario = ?',
      [creditsToAdd, userId]
    );

    // 3. Obtener el nuevo total para devolverlo al cliente
    const [userRows] = await pool.query('SELECT analisis_disponibles FROM usuarios WHERE id_usuario = ?', [userId]);
    
    res.json({ 
      success: true, 
      message: 'Compra realizada con éxito', 
      newCredits: userRows[0].analisis_disponibles 
    });
  } catch (error) {
    console.error('Error en /api/payments/purchase:', error);
    res.status(500).json({ success: false, message: 'Error procesando el pago' });
  }
});

// --- DEDUCCIÓN DE CRÉDITOS ---
app.post('/api/analysis/deduct-credit', async (req, res) => {
  const { userId } = req.body;
  try {
    const [rows] = await pool.query('SELECT analisis_disponibles FROM usuarios WHERE id_usuario = ?', [userId]);
    
    if (rows.length === 0 || rows[0].analisis_disponibles <= 0) {
      return res.status(403).json({ success: false, message: 'No tienes créditos suficientes' });
    }

    await pool.query(
      'UPDATE usuarios SET analisis_disponibles = analisis_disponibles - 1 WHERE id_usuario = ?',
      [userId]
    );

    res.json({ success: true, message: 'Crédito descontado' });
  } catch (error) {
    console.error('Error en /api/analysis/deduct-credit:', error);
    res.status(500).json({ success: false, message: 'Error al descontar crédito' });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor MySQL corriendo en:`);
  console.log(`   - Local: http://localhost:${PORT}`);
  console.log(`   - Red:   http://10.157.25.163:${PORT}`);
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
