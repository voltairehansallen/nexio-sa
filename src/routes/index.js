/**
 * Nexio S.A. — Routes centralisées v3.0
 * IMPORTANT : module.exports doit être À LA FIN
 */
'use strict';

const express = require('express');
const router  = express.Router();
const { requireLogin, requireAdmin } = require('../middlewares/auth.middleware');
const authCtrl    = require('../controllers/auth.controller');
const vitrineCtrl = require('../controllers/vitrine.controller');
const adminCtrl   = require('../controllers/admin.controller');

const L = requireLogin;
const A = requireAdmin;

// ════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════
router.get('/auth/login',     authCtrl.showLogin);
router.post('/auth/login',    authCtrl.login);
router.get('/auth/register',  authCtrl.showRegister);
router.post('/auth/register', authCtrl.register);
router.get('/auth/logout',    authCtrl.logout);

// ════════════════════════════════════════════════════════════
// VITRINE
// ════════════════════════════════════════════════════════════
router.get('/', vitrineCtrl.home);
router.get('/produit/:id', vitrineCtrl.produit);

// Panier
router.get('/panier',               vitrineCtrl.panier);
router.get('/panier/ajouter',       vitrineCtrl.panierAjout);
router.post('/panier/ajouter',      vitrineCtrl.panierAjout);
router.post('/panier/update',       vitrineCtrl.panierUpdate);
router.get('/panier/supprimer/:id', vitrineCtrl.panierSuppr);
router.get('/panier/vider',         vitrineCtrl.panierVider);

// Checkout
router.get('/checkout',  L, vitrineCtrl.checkout);
router.post('/checkout', L, vitrineCtrl.checkoutPost);

// Wishlist
router.get('/wishlist',                  L, vitrineCtrl.wishlist);
router.get('/wishlist/toggle/:id',          vitrineCtrl.wishlistToggle);
router.get('/wishlist/move-to-cart/:id', L, vitrineCtrl.wishlistMoveToCart);

// Compte
router.get('/compte',           L, vitrineCtrl.compte);
router.post('/compte/update',   L, vitrineCtrl.compteUpdate);
router.post('/compte/password', L, vitrineCtrl.comptePassword);

// Pages statiques
router.get('/contact',   vitrineCtrl.contact);
router.post('/contact',  vitrineCtrl.contactPost);
router.get('/about',     vitrineCtrl.about);
router.get('/feedback',  vitrineCtrl.feedback);
router.post('/feedback', vitrineCtrl.feedbackPost);

// API vitrine
router.get('/api/publicites', vitrineCtrl.publicites);
router.post('/api/chat',      adminCtrl.apiChat);

// ════════════════════════════════════════════════════════════
// ADMIN — Tableau de bord
// ════════════════════════════════════════════════════════════
router.get('/admin', A, adminCtrl.dashboard);

// ── Catalogue ────────────────────────────────────────────────
router.get('/admin/produits',              A, adminCtrl.produits);
router.post('/admin/produits',             A, adminCtrl.saveProduit);
router.get('/admin/produits/delete/:id',   A, adminCtrl.deleteProduit);

router.get('/admin/categories',            A, adminCtrl.categories);
router.post('/admin/categories',           A, adminCtrl.saveCategorie);
router.get('/admin/categories/delete/:id', A, adminCtrl.deleteCategorie);

router.get('/admin/sous_categories',             A, adminCtrl.sousCats);
router.post('/admin/sous_categories',            A, adminCtrl.saveSousCat);
router.get('/admin/sous_categories/delete/:id',  A, adminCtrl.deleteSousCat);

router.get('/admin/marques',               A, adminCtrl.marques);
router.post('/admin/marques',              A, adminCtrl.saveMarque);
router.get('/admin/marques/delete/:id',    A, adminCtrl.deleteMarque);

router.get('/admin/fournisseurs',              A, adminCtrl.fournisseurs);
router.post('/admin/fournisseurs',             A, adminCtrl.saveFournisseur);
router.get('/admin/fournisseurs/delete/:id',   A, adminCtrl.deleteFournisseur);

// ── Commerce ─────────────────────────────────────────────────
router.get('/admin/commandes',         A, adminCtrl.commandes);
router.post('/admin/commandes/statut', A, adminCtrl.updateStatut);

router.get('/admin/clients',               A, adminCtrl.clients);
router.get('/admin/clients/toggle/:id',    A, adminCtrl.toggleClient);
router.get('/admin/clients/delete/:id',    A, adminCtrl.deleteClient);

router.get('/admin/stocks', A, adminCtrl.stocks);

// ── Communauté ───────────────────────────────────────────────
router.get('/admin/feedbacks',              A, adminCtrl.feedbacks);
router.post('/admin/feedbacks/update',      A, adminCtrl.updateFeedback);
router.get('/admin/feedbacks/delete/:id',   A, adminCtrl.deleteFeedback);

router.get('/admin/messages',           A, adminCtrl.messages);
router.post('/admin/messages/update',   A, adminCtrl.updateMessage);

router.get('/admin/chat', A, adminCtrl.chat);

// ── Campagnes ────────────────────────────────────────────────
router.get('/admin/campagnes',              A, adminCtrl.campagnesV2);
router.post('/admin/campagnes',             A, adminCtrl.saveCampagne);
router.get('/admin/campagnes/delete/:id',   A, adminCtrl.deleteCampagne);
router.post('/admin/campagnes/envoyer',     A, adminCtrl.apiEnvoiCampagne);

// ── Intelligence IA ──────────────────────────────────────────
router.get('/admin/marketing',          A, adminCtrl.marketingIA);
router.get('/admin/agents',             A, adminCtrl.agentsIA);

// ── Analyse ──────────────────────────────────────────────────
router.get('/admin/rapports', A, adminCtrl.rapports);
router.get('/admin/journaux', A, adminCtrl.journaux);

// ════════════════════════════════════════════════════════════
// API ADMIN IA
// ════════════════════════════════════════════════════════════
router.post('/admin/api/ia',          A, adminCtrl.apiIA);
router.post('/admin/api/message-ia',  A, adminCtrl.apiMessagePersonnalise);
router.get('/admin/api/publicites',   A, adminCtrl.apiPublicites);

// ── Route de test (vérification connexions) ──────────────────
router.get('/admin/test-ia', A, async (req, res) => {
  const groq = require('../services/groq.service');
  const db   = require('../config/db');
  const result = { timestamp: new Date().toISOString(), env: process.env.NODE_ENV };

  // Test MySQL
  try {
    const [[r]] = await db.execute('SELECT COUNT(*) n FROM users');
    const [[p]] = await db.execute('SELECT COUNT(*) n FROM produits');
    result.mysql = { ok: true, users: r.n, produits: p.n };
  } catch(e) {
    result.mysql = { ok: false, erreur: e.message };
  }

  // Test Groq
  try {
    const rep = await groq.generate('Réponds juste: Nexio IA OK', { maxTokens: 20 });
    result.groq = { ok: true, reponse: rep.substring(0, 80) };
  } catch(e) {
    result.groq = { ok: false, erreur: e.message };
  }

  // Test Agent
  try {
    const agents = require('../agents');
    const [users] = await db.execute(
      "SELECT id_user FROM users u JOIN roles r ON u.id_role=r.id_role WHERE r.nom='Client' LIMIT 1"
    );
    if (users.length) {
      const a = await agents.comportemental.analyserUtilisateur(users[0].id_user);
      result.agent = { ok: true, score_engagement: a.score_engagement, nb_commandes: a.nb_commandes };
    } else {
      result.agent = { ok: false, message: 'Aucun client dans la base' };
    }
  } catch(e) {
    result.agent = { ok: false, erreur: e.message };
  }

  res.json(result);
});

// ════════════════════════════════════════════════════════════
// EXPORT — DOIT ÊTRE À LA FIN
// ════════════════════════════════════════════════════════════
module.exports = router;
