const express = require('express');
const mysql = require('mysql2');

const app = express();

// Crea la conexión a la base de datos
const connection = mysql.createConnection({
  host: '127.0.0.1', // Nombre del servidor
  user: 'root', // Usuario
  password: '', // Sin contraseña
  database: 'itop', // Nombre de la base de datos
  port: 3306 // Puerto por defecto para MySQL
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
      res.status(500).send('Error en la consulta a la base de datos');
      return;
    }
    res.json(results);
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});