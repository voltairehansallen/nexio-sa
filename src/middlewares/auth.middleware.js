/**
 * Nexio S.A. — Middlewares d'authentification v3.2
 * Injecte dans res.locals : user, panier_count, pagi, badgeStatut, BASE_URL
 */
'use strict';

function requireLogin(req, res, next) {
  if (req.session?.userId) return next();
  req.flash('danger', 'Veuillez vous connecter.');
  res.redirect('/auth/login');
}

function requireAdmin(req, res, next) {
  if (req.session?.userId && req.session?.userRole === 'Administrateur') return next();
  req.flash('danger', 'Accès réservé aux administrateurs.');
  res.redirect('/auth/login');
}

function setLocals(req, res, next) {
  // ── Panier ────────────────────────────────────────────────
  const panier = req.session.panier || {};
  const panier_count = Object.values(panier).reduce((a, b) => a + (parseInt(b) || 0), 0);

  // ── User courant ──────────────────────────────────────────
  const user = req.session.userId ? {
    id:     req.session.userId,
    prenom: req.session.userPrenom || '',
    nom:    req.session.userNom    || '',
    role:   req.session.userRole   || '',
    email:  req.session.userEmail  || '',
  } : null;

  // Compatibilité : req.session.user pour les controllers
  if (user && !req.session.user) req.session.user = user;

  // ── Locals globaux ────────────────────────────────────────
  res.locals.user         = user;
  res.locals.isLoggedIn   = !!user;
  res.locals.isAdmin      = user?.role === 'Administrateur';
  res.locals.panier_count = panier_count;
  res.locals.BASE_URL     = process.env.APP_URL || '';
  res.locals.flash        = req.flash ? req.flash() : {};
  res.locals.q            = req.query?.q   || '';
  res.locals.cat          = parseInt(req.query?.cat) || 0;

  // ── Helper : échappement HTML ─────────────────────────────
  res.locals.e = (str) =>
    String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  // ── Helper : pagination ───────────────────────────────────
  res.locals.pagi = (pages, pg, baseUrl) => {
    pages = parseInt(pages) || 1;
    pg    = parseInt(pg)    || 1;
    if (pages <= 1) return '';
    let html = '<div class="pagi">';
    for (let i = 1; i <= pages; i++) {
      const sep = (baseUrl || '?').includes('?') ? '&' : '?';
      const url = `${baseUrl || '?'}${sep}pg=${i}`;
      if (i === pg) html += `<span class="cur">${i}</span>`;
      else          html += `<a href="${url}">${i}</a>`;
    }
    return html + '</div>';
  };

  // ── Helper : badge statut ─────────────────────────────────
  res.locals.badgeStatut = (s) => {
    const map = {
      'En attente':  'b-wait',  'Confirmée':  'b-ship',
      'Expédiée':    'b-ship',  'Livrée':     'b-ok',
      'Annulée':     'b-cancel','Disponible': 'b-avail',
      'Rupture':     'b-rupture','Actif':      'b-ok',
      'Inactif':     'b-cancel','Brouillon':  'b-warn',
      'Envoyée':     'b-ok',   'En cours':   'b-ship',
      'Approuvé':    'b-ok',   'Rejeté':     'b-cancel',
      'Non lu':      'b-warn', 'Lu':          'b-ok',
      'Répondu':     'b-ship', 'Terminée':   'b-purple',
      'Planifiée':   'b-warn', 'Bientôt disponible': 'b-warn',
    };
    const cls = map[s] || 'b-wait';
    const safe = String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<span class="badge ${cls}">${safe}</span>`;
  };

  next();
}

module.exports = { requireLogin, requireAdmin, setLocals };
