/**
 * Nexio S.A. — Pool MySQL v3.1
 * Compatible Railway, Render, local XAMPP
 * En production, plante clairement si MYSQL_HOST manque
 */
'use strict';

const mysql = require('mysql2/promise');

// Railway injecte parfois MYSQLHOST sans underscore
const host     = process.env.MYSQL_HOST     || process.env.MYSQLHOST     || process.env.DB_HOST;
const port     = parseInt(process.env.MYSQL_PORT || process.env.MYSQLPORT || process.env.DB_PORT || '3306');
const database = process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || process.env.DB_NAME;
const user     = process.env.MYSQL_USER     || process.env.MYSQLUSER     || process.env.DB_USER;
const password = process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '';

// En production : erreur claire si variables manquantes
const isProd = process.env.NODE_ENV === 'production';
if (isProd && !host) {
  console.error('❌ FATAL: MYSQL_HOST manquant dans Railway Variables !');
  console.error('   Allez dans Railway → Variables et ajoutez MYSQL_HOST');
  process.exit(1);
}

// En local : fallback localhost
const finalHost = host || 'localhost';
const finalDB   = database || 'nexio_db';
const finalUser = user || 'root';

console.log('🔌 MySQL config:', {
  host: finalHost,
  port,
  database: finalDB,
  user: finalUser,
  env: process.env.NODE_ENV || 'development'
});

const pool = mysql.createPool({
  host:              finalHost,
  port,
  database:          finalDB,
  user:              finalUser,
  password,
  connectionLimit:   10,
  charset:           'utf8mb4',
  timezone:          '+00:00',
  waitForConnections: true,
  queueLimit:        0,
  enableKeepAlive:   true,
  keepAliveInitialDelay: 30000,
});

// Test connexion au démarrage
pool.getConnection()
  .then(conn => {
    console.log(`✅ MySQL connecté — base : ${finalDB} sur ${finalHost}:${port}`);
    conn.release();
  })
  .catch(err => {
    console.error(`❌ MySQL connexion échouée : ${err.message}`);
    if (isProd) {
      console.error('   Vérifiez MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD dans Railway Variables');
    }
  });

module.exports = pool;
