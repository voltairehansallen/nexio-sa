/**
 * Nexio S.A. — Pool MySQL (mysql2/promise)
 * Compatible Railway, Render, local XAMPP
 */
'use strict';

const mysql = require('mysql2/promise');

// Railway injecte parfois MYSQLHOST au lieu de MYSQL_HOST
const host     = process.env.MYSQL_HOST     || process.env.MYSQLHOST     || process.env.DB_HOST     || 'localhost';
const port     = parseInt(process.env.MYSQL_PORT     || process.env.MYSQLPORT     || process.env.DB_PORT     || '3306');
const database = process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || process.env.DB_NAME     || 'nexio_db';
const user     = process.env.MYSQL_USER     || process.env.MYSQLUSER     || process.env.DB_USER     || 'root';
const password = process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '';

console.log('🔌 MySQL config:', { host, port, database, user });

const pool = mysql.createPool({
  host,
  port,
  database,
  user,
  password,
  connectionLimit:    10,
  charset:            'utf8mb4',
  timezone:           '+00:00',
  waitForConnections: true,
  queueLimit:         0,
});

// Vérification au démarrage
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connecté — base :', database, 'sur', host + ':' + port);
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connexion échouée :', err.message);
    console.error('   Host:', host, '| Port:', port, '| DB:', database);
  });

module.exports = pool;