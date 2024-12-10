require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');

const app = express();

// Middleware para manejar JSON
app.use(express.json());

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

// Ruta para obtener un ticket por referencia
app.get('/tickets', (req, res) => {
  const ref = req.query.ref;
  if (!ref) {
    return res.status(400).send('El parámetro "ref" es requerido');
  }

  const query = `
    SELECT 
      t.id, t.operational_status, t.ref, t.org_id, t.caller_id, t.team_id, t.agent_id, 
      t.title, t.description, t.description_format, t.start_date, t.end_date, 
      t.last_update, t.close_date, t.private_log, t.private_log_index, t.finalclass,
      o.name AS organization_name,
      c.name AS caller_name,
      c.email AS caller_email
    FROM 
      ticket t
    LEFT JOIN 
      organization o ON t.org_id = o.id
    LEFT JOIN 
      contact c ON t.caller_id = c.id
    WHERE 
      t.ref = ?
  `;

  connection.query(query, [ref], (err, results) => {
    if (err) {
      res.status(500).send('Error en la consulta a la base de datos: ' + err.message);
      return;
    }
    // Verifica si hay resultados y devuelve el primer elemento
    if (results.length > 0) {
      const ticket = results[0];
      // Eliminar los campos no deseados
      delete ticket.operational_status;
      delete ticket.description_format;
      delete ticket.end_date;
      delete ticket.close_date;
      delete ticket.private_log;
      delete ticket.private_log_index;
      delete ticket.finalclass;
      res.json(ticket);
    } else {
      res.status(404).send('No se encontró el ticket con la referencia proporcionada');
    }
  });
});

// Ruta para crear un nuevo ticket
app.post('/tickets', (req, res) => {
  const { operational_status, ref, org_name, caller_name, team_name, agent_name, title, description, description_format, start_date, end_date, last_update, close_date, private_log, private_log_index, finalclass } = req.body;

  // Buscar los IDs correspondientes
  const getIdQuery = (table, column, value) => `SELECT id FROM ${table} WHERE ${column} = ? LIMIT 1`;

  const getId = (query, value) => {
    return new Promise((resolve, reject) => {
      connection.query(query, [value], (err, results) => {
        if (err) {
          return reject(err);
        }
        if (results.length > 0) {
          resolve(results[0].id);
        } else {
          resolve(null);
        }
      });
    });
  };

  Promise.all([
    getId(getIdQuery('organization', 'name', org_name), org_name),
    getId(getIdQuery('contact', 'name', caller_name), caller_name),
    getId(getIdQuery('team', 'name', team_name), team_name),
    getId(getIdQuery('agent', 'name', agent_name), agent_name)
  ])
  .then(([org_id, caller_id, team_id, agent_id]) => {
    if (!org_id || !caller_id || !team_id || !agent_id) {
      return res.status(400).send('No se encontraron los IDs correspondientes para los nombres proporcionados');
    }

    const query = `
      INSERT INTO ticket (operational_status, ref, org_id, caller_id, team_id, agent_id, title, description, description_format, start_date, end_date, last_update, close_date, private_log, private_log_index, finalclass)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [operational_status, ref, org_id, caller_id, team_id, agent_id, title, description, description_format, start_date, end_date, last_update, close_date, private_log, private_log_index, finalclass];

    connection.query(query, values, (err, results) => {
      if (err) {
        res.status(500).send('Error al crear el ticket: ' + err.message);
        return;
      }
      res.status(201).send('Ticket creado exitosamente');
    });
  })
  .catch(err => {
    res.status(500).send('Error al buscar los IDs: ' + err.message);
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});