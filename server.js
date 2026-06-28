'use strict';
require('dotenv').config();

const app    = require('./app');
const logger = require('./src/config/logger');

const PORT = parseInt(process.env.PORT || '3000');

const server = app.listen(PORT, () => {
  logger.info(`🚀 Nexio S.A. démarré sur le port ${PORT}`);
  logger.info(`🌍 URL : ${process.env.APP_URL || `http://localhost:${PORT}`}`);
  logger.info(`🔧 Mode : ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM reçu — arrêt gracieux...');
  server.close(() => {
    logger.info('Serveur arrêté.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason) => {
  logger.error('Promesse rejetée non gérée :', reason);
});
