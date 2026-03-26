/*const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

/* 🔗 CONEXIÓN A MYSQL 
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "rna_autoencoder",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const db = pool.promise();

/* 📧 CONFIGURACIÓN DE NODEMAILER PARA HOTMAIL/OUTLOOK 
const transporter = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false, // true para 465, false para 587
  auth: {
    user: 'alexanderhiguerasespo@hotmail.com', // Tu correo de Hotmail
    pass: 'Alirioht615' // ⚠️ Pon aquí tu contraseña real de Hotmail
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

// Verificar la conexión
transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ Error en configuración de email:', error);
    console.log('📝 Verifica que:');
    console.log('   1. La contraseña sea correcta');
    console.log('   2. Habilites el acceso en: https://account.live.com/activity');
  } else {
    console.log('✅ Servidor de email listo para enviar mensajes');
  }
});

// Verificar la configuración
transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ Error en configuración de email:', error);
  } else {
    console.log('✅ Servidor de email listo para enviar mensajes');
  }
});

// 📱 SIMULACIÓN DE SMS (sin Twilio)
const enviarSMS = (telefono, token) => {
  console.log("\n" + "📱".repeat(20));
  console.log("SIMULACIÓN DE SMS");
  console.log(`📱 Número: ${telefono}`);
  console.log(`🔐 Código: ${token}`);
  console.log("📱".repeat(20) + "\n");
  
  // En una app real, aquí iría la integración con Twilio
  return true;
};

/* ✅ VERIFICAR CONEXIÓN 
(async () => {
  try {
    const connection = await db.getConnection();
    console.log("✅ Conectado a MySQL (rna_autoencoder)");
    
    // Verificar que la tabla password_resets existe
    const [tables] = await connection.query("SHOW TABLES LIKE 'password_resets'");
    if (tables.length === 0) {
      await connection.query(`
        CREATE TABLE password_resets (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          token VARCHAR(6) NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          expires_at DATETIME NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
          INDEX idx_token (token),
          INDEX idx_user (user_id)
        )
      `);
      console.log("✅ Tabla password_resets creada");
    }
    
    connection.release();
  } catch (err) {
    console.log("❌ Error de conexión:", err.message);
  }
})();

/* 🌐 PRUEBA DEL SERVIDOR 
app.get("/", (req, res) => {
  res.json({ success: true, message: "Servidor funcionando 🚀" });
});

/* 🔐 LOGIN
app.post("/login", async (req, res) => {
  try {
    const { usuario, password } = req.body;

    if (!usuario?.trim() || !password?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Usuario y contraseña son requeridos"
      });
    }

    const sql = "SELECT * FROM usuarios WHERE usuario = ? OR email = ?";
    const [rows] = await db.query(sql, [usuario, usuario]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Usuario o contraseña incorrectos"
      });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.contrasena);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Usuario o contraseña incorrectos"
      });
    }

    const { contrasena, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: "Login exitoso",
      user: userWithoutPassword
    });

  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
});

/* 📝 REGISTRO CON TELÉFONO 
app.post("/register", async (req, res) => {
  try {
    console.log("📥 Registro - Body:", { ...req.body, password: '[OCULTA]' });

    const { nombre, email, telefono, usuario, password } = req.body;

    if (!nombre?.trim() || !email?.trim() || !usuario?.trim() || !password?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Nombre, email, usuario y contraseña son requeridos"
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Email no válido"
      });
    }

    if (telefono) {
      const phoneRegex = /^\+?[0-9]{10,15}$/;
      if (!phoneRegex.test(telefono.replace(/\s/g, ''))) {
        return res.status(400).json({
          success: false,
          message: "Teléfono no válido. Debe tener 10-15 dígitos"
        });
      }
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[a-z]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número"
      });
    }

    const checkSql = "SELECT usuario, email FROM usuarios WHERE usuario = ? OR email = ?";
    const [existingUsers] = await db.query(checkSql, [usuario, email]);

    if (existingUsers.length > 0) {
      const existing = existingUsers[0];
      if (existing.usuario === usuario) {
        return res.status(400).json({
          success: false,
          message: "El nombre de usuario ya está en uso"
        });
      }
      if (existing.email === email) {
        return res.status(400).json({
          success: false,
          message: "El email ya está registrado"
        });
      }
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const telefonoFinal = telefono && telefono.trim() !== '' ? telefono.trim() : null;

    const insertSql = "INSERT INTO usuarios (nombre, email, telefono, usuario, contrasena) VALUES (?, ?, ?, ?, ?)";
    const [result] = await db.query(insertSql, [nombre, email, telefonoFinal, usuario, hashedPassword]);

    console.log(`✅ Usuario ${usuario} registrado con ID: ${result.insertId}`);
    if (telefonoFinal) console.log(`📱 Teléfono guardado: ${telefonoFinal}`);

    res.status(201).json({
      success: true,
      message: "Usuario registrado correctamente",
      userId: result.insertId
    });

  } catch (error) {
    console.error("❌ ERROR en registro:", error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: "El usuario o email ya existe"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
});

/* 🔑 SOLICITAR RECUPERACIÓN DE CONTRASEÑA - VERSIÓN COMPLETA 
app.post("/forgot-password", async (req, res) => {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("📥 NUEVA SOLICITUD DE RECUPERACIÓN");
    console.log("Body recibido:", JSON.stringify(req.body, null, 2));
    console.log("=".repeat(60));

    const { email, telefono, metodo } = req.body;

    // EMAIL
    if (metodo === 'email') {
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Debes proporcionar tu correo electrónico"
        });
      }
      
      const [rows] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No existe una cuenta con ese correo electrónico"
        });
      }

      const user = rows[0];
      const token = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60000);

      await db.query(
        "INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)",
        [user.id_usuario, token, expiresAt]
      );

      // Enviar email (código existente)
      try {
        await transporter.sendMail({
          from: '"Lumex App" <alexanderhiguerasespo@hotmail.com>',
          to: email,
          subject: "🔐 Código de recuperación - Lumex",
          html: `<div>...</div>`
        });
      } catch (emailError) {
        console.log("📝 Mostrando código en consola:", token);
      }

      return res.json({
        success: true,
        message: "Código enviado a tu correo",
        userId: user.id_usuario,
        metodo: 'email'
      });
    }

    // SMS - CORREGIDO Y MEJORADO
    else if (metodo === 'sms') {
      if (!telefono) {
        console.log("❌ Error: Teléfono vacío");
        return res.status(400).json({
          success: false,
          message: "Debes proporcionar tu número de teléfono"
        });
      }

      console.log(`🔍 Buscando usuario con teléfono: "${telefono}"`);

      // Buscar por teléfono exacto
      const [rows] = await db.query("SELECT * FROM usuarios WHERE telefono = ?", [telefono]);

      console.log(`📊 Resultado: ${rows.length} usuarios encontrados`);

      if (rows.length === 0) {
        // Intentar búsqueda sin el '+'
        const telefonoLimpio = telefono.replace('+', '');
        console.log(`🔍 Buscando sin +: "${telefonoLimpio}"`);
        
        const [rows2] = await db.query(
          "SELECT * FROM usuarios WHERE REPLACE(telefono, '+', '') = ?", 
          [telefonoLimpio]
        );

        if (rows2.length === 0) {
          console.log("❌ Teléfono no encontrado en BD");
          return res.status(404).json({
            success: false,
            message: "No existe una cuenta con ese número de teléfono"
          });
        }

        var user = rows2[0];
      } else {
        var user = rows[0];
      }

      console.log(`✅ Usuario encontrado:`, {
        id: user.id_usuario,
        nombre: user.nombre,
        telefono: user.telefono
      });

      const token = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60000);

      await db.query(
        "INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)",
        [user.id_usuario, token, expiresAt]
      );

      // SIMULACIÓN DE SMS - Mostrar código en consola
      console.log("\n" + "📱".repeat(40));
      console.log("🚨 SIMULACIÓN DE SMS - CÓDIGO DE RECUPERACIÓN");
      console.log("📱".repeat(40));
      console.log(`📱 Número: ${telefono}`);
      console.log(`🔐 CÓDIGO: ${token}`);
      console.log(`👤 Usuario: ${user.nombre}`);
      console.log(`⏰ Expira: 15 minutos`);
      console.log("📱".repeat(40) + "\n");

      return res.json({
        success: true,
        message: "Código enviado a tu teléfono (revisa la consola del servidor)",
        userId: user.id_usuario,
        metodo: 'sms'
      });
    }

    else {
      return res.status(400).json({
        success: false,
        message: "Método no válido"
      });
    }

  } catch (error) {
    console.error("❌ ERROR GENERAL:", error);
    res.status(500).json({
      success: false,
      message: "Error al procesar la solicitud: " + error.message
    });
  }
});

/* ✅ VERIFICAR TOKEN 
app.post("/verify-token", async (req, res) => {
  try {
    const { userId, token } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM password_resets WHERE user_id = ? AND token = ? AND used = 0 AND expires_at > NOW()",
      [userId, token]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Código inválido o expirado"
      });
    }

    res.json({
      success: true,
      message: "Código válido"
    });

  } catch (error) {
    console.error("❌ Error en verify-token:", error);
    res.status(500).json({
      success: false,
      message: "Error al verificar el código"
    });
  }
});

/* 🔄 RESETEAR CONTRASEÑA 
app.post("/reset-password", async (req, res) => {
  try {
    const { userId, token, newPassword } = req.body;

    const [resetRows] = await db.query(
      "SELECT * FROM password_resets WHERE user_id = ? AND token = ? AND used = 0 AND expires_at > NOW()",
      [userId, token]
    );

    if (resetRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Código inválido o expirado"
      });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[a-z]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?",
      [hashedPassword, userId]
    );

    await db.query(
      "UPDATE password_resets SET used = 1 WHERE id = ?",
      [resetRows[0].id]
    );

    res.json({
      success: true,
      message: "Contraseña actualizada correctamente"
    });

  } catch (error) {
    console.error("❌ Error en reset-password:", error);
    res.status(500).json({
      success: false,
      message: "Error al resetear la contraseña"
    });
  }
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada"
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en puerto ${PORT}`);
  console.log("📧 Sistema de recuperación por EMAIL activado");
  console.log("📱 Sistema de recuperación por SMS (simulado) activado\n");
});*/
