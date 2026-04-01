const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 15);

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
];

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

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.use(cors());
app.use(express.json());

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
    await transporter.verify();
    res.json({ success: true, message: 'Servidor de recuperacion activo' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'SMTP no disponible', details: error.message });
  }
});

app.post('/forgot-password', async (req, res) => {
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

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`Servidor de recuperacion escuchando en puerto ${PORT}`);
});
