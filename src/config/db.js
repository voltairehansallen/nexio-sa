/**
 * Nexio S.A. — Pool MySQL (mysql2/promise)
 * Toutes les requêtes utilisent des requêtes préparées.
 */
'use strict';

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:              process.env.MYSQL_HOST     || 'localhost',
  port:              parseInt(process.env.MYSQL_PORT || '3306'),
  database:          process.env.MYSQL_DATABASE  || 'nexio_db',
  user:              process.env.MYSQL_USER       || 'root',
  password:          process.env.MYSQL_PASSWORD   || '',
  connectionLimit:   parseInt(process.env.MYSQL_CONNECTION_LIMIT || '10'),
  charset:           'utf8mb4',
  timezone:          '+00:00',
  waitForConnections: true,
  queueLimit:        0,
});

// Vérification au démarrage
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connecté — base :', process.env.MYSQL_DATABASE);
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connexion échouée :', err.message);
  });

module.exports = pool;
