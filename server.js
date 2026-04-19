require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MySQL Pool Configuration =====
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'lumex_2',
  port: Number(process.env.MYSQL_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Conectado a MySQL exitosamente');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Error conectando a MySQL:', err.message);
  });

pool.on('error', (err) => {
  console.error('[DB ERROR]', err);
});

// ===== SMTP Configuration =====
const smtpConfigured = [
  process.env.SMTP_HOST,
  process.env.SMTP_PORT,
  process.env.SMTP_USER,
  process.env.SMTP_PASS,
  process.env.SMTP_FROM,
].every((value) => !!value);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

if (!smtpConfigured) {
  console.warn('SMTP no configurado. El endpoint /forgot-password quedará deshabilitado.');
}

app.use(cors());
app.use(express.json());

// Middleware para ver qué llega al servidor
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

const normalizeEmail = (email = '') => email.trim().toLowerCase();

// En memoria cache para OTPs (Email -> { otp, expiresAt, verified })
const otpMemCache = new Map();
const OTP_EXPIRY_MINUTES = 15;

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

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
  let { email, username, name, phone, passwordHash } = req.body;
  if (!email && !username) return res.status(400).json({ success: false, message: 'Faltan datos de usuario.' });
  
  try {
    const [existing] = await pool.query('SELECT id_usuario FROM usuarios WHERE email = ? OR usuario = ? LIMIT 1', [email, username]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'El correo o nombre de usuario ya está registrado.' });
    }

    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, usuario, rol, contrasena, telefono, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [name, email || null, username || null, 'usuario', passwordHash, phone || null]
    );
    
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
    
    if (user.contrasena !== passwordHash) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }

    const termsAccepted = !!user.acepta_terminos;
    const { contrasena, ...safeUser } = user;
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

    if (transporter) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Código de recuperación - Lumex',
        text: `Tu código es: ${otp}\nExpira en ${OTP_EXPIRY_MINUTES} minutos.`,
        html: buildOtpEmailHtml(otp),
      });
    }

    console.log(`🔑 OTP para ${email}: ${otp}`);
    return res.json({ success: true, message: 'Código enviado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error enviando código' });
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
    await pool.query('UPDATE usuarios SET contrasena = ? WHERE email = ?', [passwordHash, normalizedEmail]);
    otpMemCache.delete(normalizedEmail);
    return res.json({ success: true, message: 'Contraseña actualizada' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
});

// ==========================================
// PAYMENTS & CREDITS
// ==========================================

// Registrar Pago y añadir créditos (Unificado)
app.post('/api/payments/register', async (req, res) => {
  const { userId, amount, monto, metodoPago, descripcion, creditsToAdd } = req.body;
  
  const safeUserId = Number(userId);
  const safeCredits = Number(creditsToAdd || amount || 0);
  const safeMonto = Number(monto || amount || 0);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [user] = await conn.query('SELECT id_usuario, analisis_disponibles FROM usuarios WHERE id_usuario = ?', [safeUserId]);
    if (user.length === 0) throw new Error('Usuario no encontrado');

    const idPago = crypto.randomUUID();
    await conn.query(
      'INSERT INTO pagos (id_pago, id_usuario, monto, moneda, descripcion, metodo_pago, estado, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [idPago, safeUserId, safeMonto, 'USD', descripcion || `Compra de ${safeCredits} créditos`, metodoPago || 'Tarjeta', 'completado']
    );

    const currentCredits = user[0].analisis_disponibles || 0;
    await conn.query('UPDATE usuarios SET analisis_disponibles = ? WHERE id_usuario = ?', [currentCredits + safeCredits, safeUserId]);

    await conn.commit();
    res.json({ success: true, message: `Se han añadido ${safeCredits} créditos correctamente` });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

// Alias compatible para retrocompatibilidad inmediata o uso específico
app.post('/api/auth/add-credits', async (req, res) => {
  // Simplemente redirigir al de pagos unificado
  return app._router.handle({ method: 'POST', url: '/api/payments/register', body: req.body }, res);
});

app.post('/api/payments/consume', async (req, res) => {
  const { userId } = req.body;
  try {
    const [user] = await pool.query('SELECT id_usuario, analisis_disponibles FROM usuarios WHERE id_usuario = ?', [userId]);
    if (user.length === 0) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    if ((user[0].analisis_disponibles || 0) <= 0) {
      return res.status(403).json({ success: false, message: 'No tienes créditos suficientes' });
    }

    await pool.query('UPDATE usuarios SET analisis_disponibles = analisis_disponibles - 1 WHERE id_usuario = ?', [userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Alias compatible
app.post('/api/auth/deduct-credit', async (req, res) => {
  const { userId } = req.body;
  try {
    const [user] = await pool.query('SELECT analisis_disponibles FROM usuarios WHERE id_usuario = ?', [userId]);
    if (user.length === 0) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    if (user[0].analisis_disponibles <= 0) return res.status(400).json({ success: false, message: 'Créditos agotados' });
    await pool.query('UPDATE usuarios SET analisis_disponibles = analisis_disponibles - 1 WHERE id_usuario = ?', [userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/payments/all', async (req, res) => {
  try {
    const query = `
      SELECT p.*, u.nombre as usuarios_nombre, u.email as usuarios_email
      FROM pagos p
      LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
      ORDER BY p.created_at DESC
    `;
    const [rows] = await pool.query(query);
    const data = rows.map(r => ({
      ...r,
      usuarios: { nombre: r.usuarios_nombre, email: r.usuarios_email }
    }));
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

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

app.post('/analysis/save', async (req, res) => {
  try {
    const { userId, analysisType, datasetName, datasetPath, parsedDataset, analysisSummary } = req.body || {};
    const numericUserId = Number(userId);

    const headers = Array.isArray(parsedDataset?.headers) ? parsedDataset.headers : [];
    const rows = Array.isArray(parsedDataset?.rows) ? parsedDataset.rows : [];
    const hasSummary = !!analysisSummary?.totalRegistros;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const modelConfig = MODEL_BY_ANALYSIS[analysisType] || MODEL_BY_ANALYSIS.anomalias;
      const [modelInsert] = await conn.query('INSERT INTO modelos (nombre_modelo, descripcion, tipo_modelo, fecha_creacion) VALUES (?, ?, ?, NOW())', [modelConfig.nombre, modelConfig.descripcion, modelConfig.tipo]);
      const [datasetInsert] = await conn.query('INSERT INTO datasets (id_usuario, nombre_archivo, ruta_archivo, fecha_subida) VALUES (?, ?, ?, NOW())', [numericUserId, datasetName || 'dataset.csv', datasetPath || 'movil://dataset']);
      
      const resultados = hasSummary ? [] : buildResults({ rows, headers });
      const totalRegistros = hasSummary ? Number(analysisSummary.totalRegistros) : rows.length;
      const totalAnomalias = hasSummary ? Number(analysisSummary.totalAnomalias) : resultados.reduce((s, r) => s + (r.es_anomalia ? 1 : 0), 0);

      const [analisisInsert] = await conn.query('INSERT INTO analisis (id_usuario, id_dataset, id_modelo, fecha_analisis, total_registros, total_anomalias) VALUES (?, ?, ?, NOW(), ?, ?)', [numericUserId, datasetInsert.insertId, modelInsert.insertId, totalRegistros, totalAnomalias]);
      
      if (!hasSummary && resultados.length > 0) {
        await insertResultadosInBatches(resultados, analisisInsert.insertId, conn);
      }

      await conn.commit();
      res.json({ success: true, idAnalisis: analisisInsert.insertId, totalRegistros, totalAnomalias });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
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
    const [rows] = await pool.query("SELECT id_usuario, nombre, email, usuario, rol, estado, fecha_registro, puede_gestionar_usuarios FROM usuarios WHERE rol NOT IN ('admin', 'administrador', 'superadmin', 'superadministrador') ORDER BY fecha_registro DESC");
    res.json({ success: true, users: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/superadmin/users', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id_usuario, nombre, email, usuario, rol, estado, fecha_registro, puede_gestionar_usuarios FROM usuarios ORDER BY fecha_registro DESC");
    res.json({ success: true, users: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/superadmin/toggle-admin-permission', async (req, res) => {
  const { id_usuario, puede_gestionar_usuarios } = req.body;
  try {
    await pool.query('UPDATE usuarios SET puede_gestionar_usuarios = ? WHERE id_usuario = ?', [puede_gestionar_usuarios, id_usuario]);
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

app.post('/api/admin/block-user', async (req, res) => {
  const { id_usuario, blocked } = req.body;
  try {
    const estadoStr = blocked ? 'bloqueado' : 'activo';
    await pool.query('UPDATE usuarios SET estado = ? WHERE id_usuario = ?', [estadoStr, id_usuario]);
    res.json({ success: true, message: 'Estado actualizado' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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
      LIMIT 1000
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor MySQL corriendo en puerto ${PORT}`);
});
