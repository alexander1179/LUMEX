require('dotenv').config();

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 15);
const RESULTS_BATCH_SIZE = 1000;
const RESULTS_BATCH_CONCURRENCY = 3;

const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Faltan variables de entorno requeridas:', missingEnvVars.join(', '));
  process.exit(1);
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

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
      El codigo expira en ${OTP_EXPIRY_MINUTES} minutos. No abras enlaces del correo para este proceso.
    </p>
    <p style="font-size: 14px; line-height: 1.5; margin: 0; color: #6b7280;">
      Si no solicitaste este cambio, ignora este mensaje.
    </p>
  </div>
`;

const buildOtpEmailText = (otp) => [
  'Recuperacion de contrasena Lumex',
  '',
  `Tu codigo es: ${otp}`,
  `Expira en ${OTP_EXPIRY_MINUTES} minutos.`,
  'Ingresa este codigo manualmente en la app.',
].join('\n');

app.get('/health', async (_req, res) => {
  try {
    if (transporter) {
      await transporter.verify();
    }
    res.json({ success: true, message: 'Servidor activo', smtpConfigured: !!transporter });
  } catch (error) {
    res.status(500).json({ success: false, message: 'SMTP no disponible', details: error.message });
  }
});

app.post('/forgot-password', async (req, res) => {
  if (!transporter) {
    return res.status(503).json({ success: false, message: 'SMTP no configurado en el servidor.' });
  }

  const email = normalizeEmail(req.body?.email);

  if (!email) {
    return res.status(400).json({ success: false, message: 'El correo es requerido' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
    });

    if (error) {
      if (error.message?.toLowerCase().includes('user not found')) {
        return res.json({
          success: true,
          message: 'Si el correo existe, recibirás un código de recuperación.',
        });
      }

      throw error;
    }

    const otp = data?.properties?.email_otp;

    if (!otp) {
      throw new Error('Supabase no devolvió un OTP de recuperación');
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Codigo de recuperacion - Lumex',
      text: buildOtpEmailText(otp),
      html: buildOtpEmailHtml(otp),
    });

    return res.json({
      success: true,
      message: 'Si el correo existe, recibirás un código de recuperación.',
    });
  } catch (error) {
    console.error('Error en /forgot-password:', error.message);
    return res.status(500).json({ success: false, message: 'No se pudo enviar el código de recuperación' });
  }
});

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

const insertResultadosInBatches = async (resultados, analisisId) => {
  const batches = [];

  for (let i = 0; i < resultados.length; i += RESULTS_BATCH_SIZE) {
    batches.push(
      resultados.slice(i, i + RESULTS_BATCH_SIZE).map((row) => ({
        ...row,
        id_analisis: analisisId,
      }))
    );
  }

  for (let i = 0; i < batches.length; i += RESULTS_BATCH_CONCURRENCY) {
    const concurrentBatches = batches.slice(i, i + RESULTS_BATCH_CONCURRENCY);
    const responses = await Promise.all(
      concurrentBatches.map((batch) => supabaseAdmin.from('resultados').insert(batch))
    );

    const failedInsert = responses.find((response) => response.error);
    if (failedInsert?.error) {
      throw new Error(failedInsert.error.message || 'No se pudo registrar resultados.');
    }
  }
};

const MODEL_BY_ANALYSIS = {
  anomalias: { nombre: 'RandomForestClassifier', descripcion: 'Modelo de deteccion de anomalias desde backend', tipo: 'clasificacion' },
  clasificacion: { nombre: 'RandomForestClassifier', descripcion: 'Modelo de clasificacion desde backend', tipo: 'clasificacion' },
  regresion: { nombre: 'RandomForestRegressor', descripcion: 'Modelo de regresion desde backend', tipo: 'regresion' },
  clustering: { nombre: 'KMeans', descripcion: 'Modelo de clustering desde backend', tipo: 'clustering' },
};

app.post('/analysis/save', async (req, res) => {
  try {
    const startedAt = Date.now();
    const {
      userId,
      analysisType,
      datasetName,
      datasetPath,
      parsedDataset,
      analysisSummary,
    } = req.body || {};

    const numericUserId = Number(userId);
    if (!Number.isInteger(numericUserId)) {
      return res.status(400).json({ success: false, message: 'userId inválido.' });
    }

    const headers = Array.isArray(parsedDataset?.headers) ? parsedDataset.headers : [];
    const rows = Array.isArray(parsedDataset?.rows) ? parsedDataset.rows : [];
    const summaryTotalRegistros = Number(analysisSummary?.totalRegistros);
    const summaryTotalAnomalias = Number(analysisSummary?.totalAnomalias);
    const hasSummary = Number.isFinite(summaryTotalRegistros) && summaryTotalRegistros > 0 && Number.isFinite(summaryTotalAnomalias);

    if (!hasSummary && (headers.length === 0 || rows.length === 0)) {
      return res.status(400).json({ success: false, message: 'Dataset sin encabezados o filas para análisis.' });
    }

    const modelConfig = MODEL_BY_ANALYSIS[analysisType] || MODEL_BY_ANALYSIS.anomalias;
    const modelInsert = await supabaseAdmin
      .from('modelos')
      .insert([
        {
          nombre_modelo: modelConfig.nombre,
          descripcion: modelConfig.descripcion,
          tipo_modelo: modelConfig.tipo,
          fecha_creacion: new Date().toISOString(),
        },
      ])
      .select('id_modelo')
      .single();

    if (modelInsert.error || !modelInsert.data?.id_modelo) {
      return res.status(500).json({ success: false, message: modelInsert.error?.message || 'No se pudo registrar modelo.' });
    }

    const datasetInsert = await supabaseAdmin
      .from('datasets')
      .insert([
        {
          id_usuario: numericUserId,
          nombre_archivo: String(datasetName || 'dataset.csv'),
          ruta_archivo: String(datasetPath || 'movil://dataset'),
          fecha_subida: new Date().toISOString(),
        },
      ])
      .select('id_dataset')
      .single();

    if (datasetInsert.error || !datasetInsert.data?.id_dataset) {
      return res.status(500).json({ success: false, message: datasetInsert.error?.message || 'No se pudo registrar dataset.' });
    }

    const resultados = hasSummary ? [] : buildResults({ rows, headers });
    const totalRegistros = hasSummary ? Math.max(0, Math.floor(summaryTotalRegistros)) : rows.length;
    const totalAnomalias = hasSummary
      ? Math.max(0, Math.min(totalRegistros, Math.floor(summaryTotalAnomalias)))
      : resultados.reduce((sum, row) => sum + (row.es_anomalia ? 1 : 0), 0);

    const analisisInsert = await supabaseAdmin
      .from('analisis')
      .insert([
        {
          id_usuario: numericUserId,
          id_dataset: Number(datasetInsert.data.id_dataset),
          id_modelo: Number(modelInsert.data.id_modelo),
          fecha_analisis: new Date().toISOString(),
          total_registros: totalRegistros,
          total_anomalias: totalAnomalias,
        },
      ])
      .select('id_analisis')
      .single();

    if (analisisInsert.error || !analisisInsert.data?.id_analisis) {
      return res.status(500).json({ success: false, message: analisisInsert.error?.message || 'No se pudo registrar análisis.' });
    }

    const analisisId = Number(analisisInsert.data.id_analisis);
    let insertMs = 0;
    if (!hasSummary) {
      const beforeBatchInsert = Date.now();
      await insertResultadosInBatches(resultados, analisisId);
      insertMs = Date.now() - beforeBatchInsert;
    }

    console.log(
      `[analysis/save] rows=${totalRegistros} summary=${hasSummary} batch=${RESULTS_BATCH_SIZE} concurrency=${RESULTS_BATCH_CONCURRENCY} insertMs=${insertMs} totalMs=${Date.now() - startedAt}`
    );

    return res.json({
      success: true,
      idModelo: Number(modelInsert.data.id_modelo),
      idDataset: Number(datasetInsert.data.id_dataset),
      idAnalisis: analisisId,
      totalRegistros,
      totalAnomalias,
      savedBy: 'server',
      savedResultadosDetalle: !hasSummary,
    });
  } catch (error) {
    console.error('Error en /analysis/save:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Error inesperado guardando análisis.' });
  }
});

app.post('/admin/delete-user', async (req, res) => {
  try {
    const user = req.body?.user || {};
    const attemptsInput = Array.isArray(req.body?.attempts) ? req.body.attempts : [];

    const attempts = [];
    const pushAttempt = (field, value) => {
      if (!field || value === null || value === undefined || value === '') return;
      if (!attempts.find((a) => a.field === field && String(a.value) === String(value))) {
        attempts.push({ field, value });
      }
      if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
        const numVal = Number(value);
        if (!Number.isNaN(numVal) && !attempts.find((a) => a.field === field && String(a.value) === String(numVal))) {
          attempts.push({ field, value: numVal });
        }
      }
      if (typeof value === 'number') {
        const strVal = String(value);
        if (!attempts.find((a) => a.field === field && String(a.value) === strVal)) {
          attempts.push({ field, value: strVal });
        }
      }
    };

    for (const at of attemptsInput) {
      pushAttempt(at?.field, at?.value);
    }

    pushAttempt('id_usuario', user.id_usuario);
    pushAttempt('id', user.id);
    pushAttempt('uuid', user.uuid);
    pushAttempt('user_id', user.user_id);
    pushAttempt('email', user.email);
    pushAttempt('usuario', user.usuario);

    if (attempts.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay identificadores para eliminar el usuario.' });
    }

    let lastError = null;
    for (const attempt of attempts) {
      const { data: deletedData, error } = await supabaseAdmin
        .from('usuarios')
        .delete()
        .eq(attempt.field, attempt.value)
        .select('id,id_usuario,uuid,user_id,email,usuario');

      if (error) {
        lastError = error;
        continue;
      }

      if (Array.isArray(deletedData) && deletedData.length > 0) {
        return res.json({
          success: true,
          deletedRows: deletedData.length,
          usedField: attempt.field,
          usedValue: attempt.value,
        });
      }
    }

    return res.status(409).json({
      success: false,
      message: lastError?.message || 'No se eliminó ninguna fila en usuarios.',
      deletedRows: 0,
    });
  } catch (error) {
    console.error('Error en /admin/delete-user:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Error inesperado en eliminación.' });
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`Servidor de recuperacion escuchando en puerto ${PORT}`);
});
