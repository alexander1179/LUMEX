const mysql = require('mysql2/promise');

async function inspect() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456',
      port: 3306,
      database: 'lumex_2'
    });
    const [columns] = await connection.query('DESCRIBE usuarios');
    console.log(JSON.stringify(columns, null, 2));
    await connection.end();
  } catch (error) {
    console.error('FAILED:', error.message);
  }
}

inspect();
