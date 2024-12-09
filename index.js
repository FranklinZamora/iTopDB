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
  connection.query('SELECT * FROM ticket', (err, results) => {
    if (err) {
      res.status(500).send('Error en la consulta a la base de datos: ' + err.message);
      return;
    }
    res.json(results);
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});