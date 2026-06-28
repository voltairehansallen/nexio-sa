'use strict';
require('dotenv').config();

const app = express();
app.set('trust proxy', 1); // ← ajouter cette ligne

const express      = require('express');
const session      = require('express-session');
const flash        = require('connect-flash');
const helmet       = require('helmet');
const cors         = require('cors');
const rateLimit    = require('express-rate-limit');
const morgan       = require('morgan');
const compression  = require('compression');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const fileUpload   = require('express-fileupload');
const path         = require('path');
const logger       = require('./src/config/logger');
const { setLocals } = require('./src/middlewares/auth.middleware');

const app = express();

// ── Sécurité ──────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));  // CSP désactivé pour CDN
app.use(cors({ origin: process.env.APP_URL || '*', credentials: true }));

// ── Rate limiting ─────────────────────────────────────────────
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 100, message: 'Trop de requêtes.' }));
app.use('/auth/', rateLimit({ windowMs: 15*60*1000, max: 20 }));

// ── Logging HTTP ──────────────────────────────────────────────
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// ── Compression ───────────────────────────────────────────────
app.use(compression());

// ── View engine ───────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Static files ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(methodOverride('_method'));

// ── File upload ───────────────────────────────────────────────
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  abortOnLimit: true,
  createParentPath: true,
}));

// ── Session ───────────────────────────────────────────────────
app.use(session({
  secret:            process.env.SESSION_SECRET || 'nexio_dev_secret',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 jours
  },
}));

// ── Flash messages ────────────────────────────────────────────
app.use(flash());

// ── Locals partagées (user, flash, panier…) ───────────────────
app.use(setLocals);

// ── Routes ────────────────────────────────────────────────────
app.use('/', require('./src/routes/index'));

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('partials/404', { title: 'Page introuvable' });
});

// ── Erreurs ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Erreur non gérée :', err);
  res.status(500).render('partials/500', { title: 'Erreur serveur', error: err.message });
});

module.exports = app;
