const mysql = require('mysql2/promise');
require('dotenv').config();

async function runQuery() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: Number(process.env.MYSQL_PORT)
  });

  const userId = 1;
  const query = `
      SELECT a.id_analisis, a.fecha_analisis, a.total_registros, a.total_anomalias,
             d.nombre_archivo, d.ruta_archivo,
             m.tipo_modelo, m.descripcion, m.nombre_modelo
      FROM analisis a
      LEFT JOIN datasets d ON a.id_dataset = d.id_dataset
      LEFT JOIN modelos m ON a.id_modelo = m.id_modelo
      WHERE a.id_usuario = ?
      ORDER BY a.fecha_analisis DESC
  `;

  try {
    const [rows] = await pool.query(query, [userId]);
    console.log(`Query returned ${rows.length} rows.`);
    console.log(JSON.stringify(rows.map(r => r.id_analisis), null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}

runQuery();
