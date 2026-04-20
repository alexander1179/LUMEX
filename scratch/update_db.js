const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateSchema() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT || 3306
  });

  try {
    console.log('Verificando tabla datasets...');
    const [dsCols] = await pool.query('SHOW COLUMNS FROM datasets LIKE "total_filas"');
    if (dsCols.length === 0) {
      console.log('Agregando total_filas a datasets...');
      await pool.query('ALTER TABLE datasets ADD COLUMN total_filas INT');
    }

    console.log('Verificando tabla analisis...');
    const [anaCols1] = await pool.query('SHOW COLUMNS FROM analisis LIKE "tipo_analisis"');
    if (anaCols1.length === 0) {
      await pool.query('ALTER TABLE analisis ADD COLUMN tipo_analisis VARCHAR(100)');
    }
    
    const [anaCols2] = await pool.query('SHOW COLUMNS FROM analisis LIKE "tipo_visualizacion"');
    if (anaCols2.length === 0) {
      await pool.query('ALTER TABLE analisis ADD COLUMN tipo_visualizacion VARCHAR(100)');
    }
    
    const [anaCols3] = await pool.query('SHOW COLUMNS FROM analisis LIKE "estado"');
    if (anaCols3.length === 0) {
      await pool.query('ALTER TABLE analisis ADD COLUMN estado VARCHAR(50)');
    }

    console.log('✅ Esquema verificado y actualizado');
  } catch (error) {
    console.error('❌ Error al actualizar esquema:', error.message);
  } finally {
    await pool.end();
  }
}

updateSchema();
