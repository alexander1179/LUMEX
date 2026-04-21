const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'lumex_2',
  });
  try {
    const [rows] = await pool.query('SELECT * FROM pagos ORDER BY created_at DESC LIMIT 5');
    console.log('--- RECENT PAYMENTS ---');
    console.log(JSON.stringify(rows, null, 2));
    
    const [counts] = await pool.query('SELECT COUNT(*) as total FROM pagos');
    console.log('Total records:', counts[0].total);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
check();
