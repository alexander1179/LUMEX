const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'lumex_2',
    port: process.env.MYSQL_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    const [datasets] = await pool.query('DESCRIBE datasets');
    console.log('--- ESTRUCTURA DE DATASETS ---');
    console.table(datasets);

    const [analisis] = await pool.query('DESCRIBE analisis');
    console.log('\n--- ESTRUCTURA DE ANALISIS ---');
    console.table(analisis);

    const [pagos] = await pool.query('DESCRIBE pagos');
    console.log('\n--- ESTRUCTURA DE PAGOS ---');
    console.table(pagos);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkSchema();
