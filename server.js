require('dotenv').config();

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 15);
const RESULTS_BATCH_SIZE = 1000;
const RESULTS_BATCH_CONCURRENCY = 3;

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
app.use(express.json({ limit: '10mb' }));

const normalizeEmail = (email = '') => email.trim().toLowerCase();

// En memoria cache para OTPs (Email -> { otp, expiresAt })
const otpMemCache = new Map();

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const hashPasswordSha256 = (password) => {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
};

const buildOtpEmailHtml = (otp) => `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937;">
    <h2 style="margin: 0 0 16px; color: #111827;">Recuperacion de contrasena</h2>
    <p style="font-size: 16px; line-height: 1.5; margin: 0 0 16px;">
      Usa este codigo de 6 digitos en la app de Lumex para cambiar tu contrasena.
    </p>
    <div style="margin: 24px 0; padding: 18px; background: #f3f4f6; border-radius: 12px; text-align: center;">
      <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #d32f2f;">${otp}</div>
    </div>
    <p style="font-size: 14px; line-height: 1.5; margin: 0 0 12px; color: #4b5563;">
      El codigo expira en ${OTP_EXPIRY_MINUTES} minutos.
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
// AUTH & USERS (Ex-Supabase Auth & Usuarios)
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
      'INSERT INTO usuarios (nombre, email, usuario, rol, contrasena, telefono, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, username, 'usuario', passwordHash, phone, new Date()]
    );
    
    // Fetch inserted user
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

    const isAdmin = ['admin', 'administrador'].includes(String(user.rol).trim().toLowerCase());
    if (requiredRole === 'admin' && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Solo administradores.' });
    }
    if (requiredRole === 'usuario' && isAdmin) {
      return res.status(403).json({ success: false, message: 'Este acceso es solo para usuarios.' });
    }

    // Checking blocks logic
    const blockedFields = [user.bloqueado, user.blocked, user.acceso_bloqueado, user.esta_bloqueado, user.inactivo];
    const isBlocked = blockedFields.some(v => v === 1 || String(v).toLowerCase() === 'true');
    if (isBlocked) return res.status(403).json({ success: false, message: 'Tu cuenta está bloqueada.' });

    if (user.contrasena !== passwordHash && user.contrasena !== 'managed_by_supabase_auth') {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }

    if (user.contrasena === 'managed_by_supabase_auth') {
      await pool.query('UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?', [passwordHash, user.id_usuario]);
      user.contrasena = passwordHash;
    }

    // terms info
    const termsAccepted = !!user.acepta_terminos;

    return res.json({ success: true, user, termsAccepted });
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
    return res.json({ success: true, user: rows[0] });
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

app.post('/api/auth/check-terms', async (req, res) => {
  const { userId } = req.body;
  try {
    const [rows] = await pool.query('SELECT acepta_terminos, fecha_aceptacion_terminos FROM usuarios WHERE id_usuario = ? LIMIT 1', [userId]);
    if (rows.length === 0) return res.json({ success: false, accepted: false });
    return res.json({ success: true, accepted: !!rows[0].acepta_terminos, acceptanceDate: rows[0].fecha_aceptacion_terminos });
  } catch (err) {
    res.json({ success: true, accepted: false }); // Fallback on error to unblock
  }
});

app.post('/forgot-password', async (req, res) => {
  if (!transporter) {
    return res.status(503).json({ success: false, message: 'SMTP no configurado en el servidor.' });
  }
  const email = normalizeEmail(req.body?.email);
  if (!email) return res.status(400).json({ success: false, message: 'El correo es requerido' });

  try {
    const [rows] = await pool.query('SELECT id_usuario FROM usuarios WHERE email = ? LIMIT 1', [email]);
    if (rows.length === 0) {
      return res.json({ success: true, message: 'Si el correo existe, recibirás un código de recuperación.' });
    }

    const otp = generateOtp();
    const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60000;
    otpMemCache.set(email, { otp, expiresAt });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Codigo de recuperacion - Lumex',
      text: `Tu codigo es: ${otp}\nExpira en ${OTP_EXPIRY_MINUTES} minutos.`,
      html: buildOtpEmailHtml(otp),
    });

    return res.json({ success: true, message: 'Si el correo existe, recibirás un código de recuperación.', email });
  } catch (error) {
    console.error('Error en /forgot-password:', error.message);
    return res.status(500).json({ success: false, message: 'No se pudo enviar el código de recuperación' });
  }
});

app.post('/api/auth/verify-token', (req, res) => {
  const { email, token } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const cacheObj = otpMemCache.get(normalizedEmail);
  
  if (!cacheObj) return res.status(400).json({ success: false, message: 'No hay código pendiente para este correo o expiró.' });
  if (Date.now() > cacheObj.expiresAt) {
    otpMemCache.delete(normalizedEmail);
    return res.status(400).json({ success: false, message: 'El código ha expirado.' });
  }
  if (cacheObj.otp !== String(token)) {
    return res.status(400).json({ success: false, message: 'Código inválido.' });
  }

  // Marcar token como verificado
  otpMemCache.set(normalizedEmail, { ...cacheObj, verified: true });
  return res.json({ success: true, message: 'Código verificado correctamente.' });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, passwordHash } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const cacheObj = otpMemCache.get(normalizedEmail);

  if (!cacheObj || !cacheObj.verified) return res.status(400).json({ success: false, message: 'Debes verificar el código antes de cambiar la contraseña.' });

  try {
    await pool.query('UPDATE usuarios SET contrasena = ? WHERE email = ?', [passwordHash, normalizedEmail]);
    otpMemCache.delete(normalizedEmail); // Limpiar caché
    return res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error interno cambiando la contraseña.' });
  }
});

// ==========================================
// PAYMENTS
// ==========================================
app.post('/api/payments/register', async (req, res) => {
  const { userId, amount, description, creditsToAdd } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [user] = await conn.query('SELECT analisis_disponibles FROM usuarios WHERE id_usuario = ?', [userId]);
    if (user.length === 0) throw new Error('Usuario no encontrado');

    const [paymentResult] = await conn.query(
      'INSERT INTO pagos (id_usuario, monto, moneda, descripcion, estado, metodo_pago, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [userId, amount, 'USD', description, 'completado', 'tarjeta']
    );

    const idPago = paymentResult.insertId;

    await conn.query(
      'INSERT INTO pagos_eventos (id_pago, tipo_evento, data, created_at) VALUES (?, ?, ?, NOW())',
      [idPago, 'pago_exitoso_creditado', JSON.stringify({ credits_added: creditsToAdd })]
    );

    const currentCredits = user[0].analisis_disponibles || 0;
    await conn.query('UPDATE usuarios SET analisis_disponibles = ? WHERE id_usuario = ?', [currentCredits + creditsToAdd, userId]);

    await conn.commit();
    
    const [newPayment] = await conn.query('SELECT * FROM pagos WHERE id_pago = ?', [idPago]);
    return res.json({ success: true, payment: newPayment[0] });
  } catch (err) {
    await conn.rollback();
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

app.post('/api/payments/consume', async (req, res) => {
  const { userId } = req.body;
  try {
    const [user] = await pool.query('SELECT analisis_disponibles FROM usuarios WHERE id_usuario = ?', [userId]);
    if (user.length === 0) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    const currentCredits = user[0].analisis_disponibles || 0;
    if (currentCredits <= 0) return res.status(403).json({ success: false, message: 'No tienes créditos suficientes' });

    await pool.query('UPDATE usuarios SET analisis_disponibles = ? WHERE id_usuario = ?', [currentCredits - 1, userId]);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/payments/all', async (req, res) => {
  try {
    const query = `
      SELECT p.*, u.nombre as usuarios_nombre, u.email as usuarios_email
      FROM pagos p
      JOIN usuarios u ON p.id_usuario = u.id_usuario
      ORDER BY p.created_at DESC
    `;
    const [rows] = await pool.query(query);
    
    // Transform specifically mimicking supabase nested "usuarios" object
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
// Functions buildResultsWithNsp, buildResultsWithZScore, buildResults, etc..
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

    return {
      id_analisis: null,
      indice_registro: index,
      error_reconstruccion: Number(reconstructionError.toFixed(6)),
      es_anomalia: isAnomaly,
    };
  });
};

const buildResultsWithZScore = (rows, headers) => {
  const numericHeaders = headers.filter((header) => rows.some((row) => toNumberOrNull(row?.[header]) !== null));

  if (numericHeaders.length === 0) {
    return rows.map((_, index) => ({
      id_analisis: null,
      indice_registro: index,
      error_reconstruccion: 0,
      es_anomalia: false,
    }));
  }

  const stats = numericHeaders.map((header) => {
    const values = rows.map((row) => toNumberOrNull(row?.[header])).filter((value) => value !== null);
    if(values.length===0) return {header, mean:0, std:1};
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
    const std = Math.sqrt(variance) || 1;
    return { header, mean, std };
  });

  return rows.map((row, index) => {
    const scores = stats.map(({ header, mean, std }) => {
      const value = toNumberOrNull(row?.[header]);
      if (value === null) return 0;
      return Math.abs((value - mean) / std);
    });

    const avgZScore = scores.reduce((sum, value) => sum + value, 0) / scores.length;
    const reconstructionError = Math.min(1, avgZScore / 4);
    const isAnomaly = avgZScore >= 2;

    return {
      id_analisis: null,
      indice_registro: index,
      error_reconstruccion: Number(reconstructionError.toFixed(6)),
      es_anomalia: isAnomaly,
    };
  });
};

const buildResults = ({ rows, headers }) => {
  const nspKey = headers.find((header) => String(header || '').trim().toLowerCase() === 'nsp');
  return nspKey ? buildResultsWithNsp(rows, nspKey) : buildResultsWithZScore(rows, headers);
};

const insertResultadosInBatches = async (resultados, analisisId, connection) => {
  const values = resultados.map(r => [
    analisisId, r.indice_registro, r.error_reconstruccion, (r.es_anomalia ? 1 : 0)
  ]);
  
  // mysql2 execute batch
  const sql = 'INSERT INTO resultados (id_analisis, indice_registro, error_reconstruccion, es_anomalia) VALUES ?';
  
  for (let i = 0; i < values.length; i += RESULTS_BATCH_SIZE) {
    const chunk = values.slice(i, i + RESULTS_BATCH_SIZE);
    await connection.query(sql, [chunk]);
  }
};

const MODEL_BY_ANALYSIS = {
  anomalias: { nombre: 'RandomForestClassifier', descripcion: 'Modelo de deteccion de anomalias', tipo: 'clasificacion' },
  clasificacion: { nombre: 'RandomForestClassifier', descripcion: 'Modelo de clasificacion', tipo: 'clasificacion' },
  regresion: { nombre: 'RandomForestRegressor', descripcion: 'Modelo de regresion', tipo: 'regresion' },
  clustering: { nombre: 'KMeans', descripcion: 'Modelo de clustering', tipo: 'clustering' },
};

app.post('/analysis/save', async (req, res) => {
  try {
    const startedAt = Date.now();
    const { userId, analysisType, datasetName, datasetPath, parsedDataset, analysisSummary } = req.body || {};

    const numericUserId = Number(userId);
    if (!Number.isInteger(numericUserId)) return res.status(400).json({ success: false, message: 'userId inválido.' });

    const headers = Array.isArray(parsedDataset?.headers) ? parsedDataset.headers : [];
    const rows = Array.isArray(parsedDataset?.rows) ? parsedDataset.rows : [];
    const summaryTotalRegistros = Number(analysisSummary?.totalRegistros);
    const summaryTotalAnomalias = Number(analysisSummary?.totalAnomalias);
    const hasSummary = Number.isFinite(summaryTotalRegistros) && summaryTotalRegistros > 0 && Number.isFinite(summaryTotalAnomalias);

    if (!hasSummary && (headers.length === 0 || rows.length === 0)) {
      return res.status(400).json({ success: false, message: 'Dataset sin encabezados o filas para análisis.' });
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const modelConfig = MODEL_BY_ANALYSIS[analysisType] || MODEL_BY_ANALYSIS.anomalias;
      const [modelInsert] = await conn.query(
        'INSERT INTO modelos (nombre_modelo, descripcion, tipo_modelo, fecha_creacion) VALUES (?, ?, ?, NOW())',
        [modelConfig.nombre, modelConfig.descripcion, modelConfig.tipo]
      );
      const idModelo = modelInsert.insertId;

      const [datasetInsert] = await conn.query(
        'INSERT INTO datasets (id_usuario, nombre_archivo, ruta_archivo, fecha_subida) VALUES (?, ?, ?, NOW())',
        [numericUserId, String(datasetName || 'dataset.csv'), String(datasetPath || 'movil://dataset')]
      );
      const idDataset = datasetInsert.insertId;

      const resultados = hasSummary ? [] : buildResults({ rows, headers });
      const totalRegistros = hasSummary ? Math.max(0, Math.floor(summaryTotalRegistros)) : rows.length;
      const totalAnomalias = hasSummary
        ? Math.max(0, Math.min(totalRegistros, Math.floor(summaryTotalAnomalias)))
        : resultados.reduce((sum, row) => sum + (row.es_anomalia ? 1 : 0), 0);

      const [analisisInsert] = await conn.query(
        'INSERT INTO analisis (id_usuario, id_dataset, id_modelo, fecha_analisis, total_registros, total_anomalias) VALUES (?, ?, ?, NOW(), ?, ?)',
        [numericUserId, idDataset, idModelo, totalRegistros, totalAnomalias]
      );
      const idAnalisis = analisisInsert.insertId;

      if (!hasSummary && resultados.length > 0) {
        await insertResultadosInBatches(resultados, idAnalisis, conn);
      }

      await conn.commit();

      return res.json({
        success: true,
        idModelo: idModelo,
        idDataset: idDataset,
        idAnalisis: idAnalisis,
        totalRegistros,
        totalAnomalias,
        savedBy: 'server',
        savedResultadosDetalle: !hasSummary,
      });

    } catch (dbErr) {
      await conn.rollback();
      throw dbErr;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error en /analysis/save:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Error inesperado guardando análisis.' });
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
      ORDER BY a.fecha_analisis DESC
      LIMIT 50
    `;
    const [rows] = await pool.query(query, [userId]);
    
    // Transform to match shape expected by datasetAnalysisService
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


app.post('/admin/delete-user', async (req, res) => {
  res.json({ success: false, message: 'Por implementar borrado en MySQL.' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT} usando DB MySQL`);
});
