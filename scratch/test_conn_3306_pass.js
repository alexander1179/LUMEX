const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456', // Probamos la que estaba antes
      port: 3306,
      database: 'lumex_2'
    });
    console.log('SUCCESS: Conectado a 3306 con 123456');
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM usuarios');
    console.log('USUARIOS:', rows[0].count);
    await connection.end();
  } catch (error) {
    console.error('FAILED:', error.message);
  }
}

test();
