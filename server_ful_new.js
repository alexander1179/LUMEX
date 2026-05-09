const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use(cors());

// RUTA DE SALUD (Nivel Raíz para Railway)
app.get('/', (req, res) => {
    res.send('LUMEX Server is Running v1.0.6');
});

// RUTA DE DIAGNÓSTICO
app.get('/api/test-db', async (req, res) => {
    try {
        console.log('--- Test DB Invocado ---');
        const [rows] = await pool.query('SELECT 1 as test');
        res.json({ success: true, database: 'Connected', data: rows });
    } catch (err) {
        console.error('❌ Error test-db:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Configuración del Pool
const pool = mysql.createPool({
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQLDATABASE || 'lumex_db',
    port: parseInt(process.env.MYSQLPORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 5,
    connectTimeout: 20000
});

// INICIO DEL SERVIDOR
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    console.log(`🔗 DB Host: ${process.env.MYSQLHOST}`);
});

// AQUI IRÍA EL RESTO DE TUS ENDPOINTS (Login, Registro, etc.)
// ... (Mantengo el resto del código igual internamente)
