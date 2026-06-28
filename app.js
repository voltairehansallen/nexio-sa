'use strict';
require('dotenv').config();

const express        = require('express');
const session        = require('express-session');
const flash          = require('connect-flash');
const helmet         = require('helmet');
const cors           = require('cors');
const rateLimit      = require('express-rate-limit');
const morgan         = require('morgan');
const compression    = require('compression');
const cookieParser   = require('cookie-parser');
const methodOverride = require('method-override');
const fileUpload     = require('express-fileupload');
const path           = require('path');
const logger         = require('./src/config/logger');
const { setLocals }  = require('./src/middlewares/auth.middleware');

const app = express();

// ── Trust proxy Railway/Render ────────────────────────────────
app.set('trust proxy', 1);

// ── Sécurité ──────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.APP_URL || true,
  credentials: true
}));

// ── Rate limiting ─────────────────────────────────────────────
const limiterAPI  = rateLimit({ windowMs:15*60*1000, max:200, standardHeaders:true, legacyHeaders:false });
const limiterAuth = rateLimit({ windowMs:15*60*1000, max:20,  standardHeaders:true, legacyHeaders:false });
app.use('/api/',   limiterAPI);
app.use('/auth/',  limiterAuth);

// ── Logging HTTP ──────────────────────────────────────────────
app.use(morgan('combined', { stream:{ write: msg => logger.info(msg.trim()) } }));

// ── Compression ───────────────────────────────────────────────
app.use(compression());

// ── View engine ───────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Static files ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit:'10mb' }));
app.use(express.urlencoded({ extended:true, limit:'10mb' }));
app.use(cookieParser());
app.use(methodOverride('_method'));

// ── File upload ───────────────────────────────────────────────
app.use(fileUpload({
  limits: { fileSize: 5*1024*1024 },
  abortOnLimit: true,
  createParentPath: true,
}));

// ── Session ───────────────────────────────────────────────────
app.use(session({
  secret:            process.env.SESSION_SECRET || 'nexio_fallback_secret_2025',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000,
  },
}));

// ── Flash messages ────────────────────────────────────────────
app.use(flash());

// ── Locals partagées ──────────────────────────────────────────
app.use(setLocals);

// ── Routes ────────────────────────────────────────────────────
app.use('/', require('./src/routes/index'));

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('partials/404', {
    title: 'Page introuvable',
    user: res.locals.user,
  });
});

// ── Erreurs ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Erreur non gérée :', err);
  res.status(500).render('partials/500', {
    title: 'Erreur serveur',
    error: process.env.NODE_ENV === 'production' ? 'Une erreur est survenue.' : err.message,
    user: res.locals.user,
  });
});

module.exports = app;
