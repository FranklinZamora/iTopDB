require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');

const app = express();

// Crea la conexión a la base de datos
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// Conecta a la base de datos
connection.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err.stack);
    return;
  }
  console.log('Conectado a la base de datos como id ' + connection.threadId);
});

// Ruta para obtener todos los tickets
app.get('/tickets', (req, res) => {
  const query = `
    SELECT 
      t.id, t.operational_status, t.ref, t.org_id, t.caller_id, t.team_id, t.agent_id, 
      t.title, t.description, t.description_format, t.start_date, t.end_date, 
      t.last_update, t.close_date, t.private_log, t.private_log_index, t.finalclass,
      o.name AS organization_name,
      c.name AS caller_name
    FROM 
      ticket t
    LEFT JOIN 
      organization o ON t.org_id = o.id
    LEFT JOIN 
      contact c ON t.caller_id = c.id
  `;

  connection.query(query, (err, results) => {
    if (err) {
      res.status(500).send('Error en la consulta a la base de datos: ' + err.message);
      return;
    }
    // Verifica si hay resultados y devuelve el primer elemento
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).send('No se encontraron tickets');
    }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});