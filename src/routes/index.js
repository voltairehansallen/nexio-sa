'use strict';
const express = require('express');
const router  = express.Router();
const { requireLogin, requireAdmin } = require('../middlewares/auth.middleware');
const authCtrl    = require('../controllers/auth.controller');
const vitrineCtrl = require('../controllers/vitrine.controller');
const adminCtrl   = require('../controllers/admin.controller');

// ── Auth ──────────────────────────────────────────────────────
router.get('/auth/login',    authCtrl.showLogin);
router.post('/auth/login',   authCtrl.login);
router.get('/auth/register', authCtrl.showRegister);
router.post('/auth/register',authCtrl.register);
router.get('/auth/logout',   authCtrl.logout);

// ── Vitrine ───────────────────────────────────────────────────
router.get('/',          vitrineCtrl.home);
router.get('/produit/:id', vitrineCtrl.produit);

// Panier
router.get('/panier',                 vitrineCtrl.panier);
router.get('/panier/ajouter',         vitrineCtrl.panierAjout);
router.post('/panier/ajouter',        vitrineCtrl.panierAjout);
router.post('/panier/update',         vitrineCtrl.panierUpdate);
router.get('/panier/supprimer/:id',   vitrineCtrl.panierSuppr);
router.get('/panier/vider',           vitrineCtrl.panierVider);

// Checkout
router.get('/checkout',   requireLogin, vitrineCtrl.checkout);
router.post('/checkout',  requireLogin, vitrineCtrl.checkoutPost);

// Wishlist
router.get('/wishlist',                           requireLogin, vitrineCtrl.wishlist);
router.get('/wishlist/toggle/:id',                vitrineCtrl.wishlistToggle);
router.get('/wishlist/move-to-cart/:id',          requireLogin, vitrineCtrl.wishlistMoveToCart);

// Compte
router.get('/compte',              requireLogin, vitrineCtrl.compte);
router.post('/compte/update',      requireLogin, vitrineCtrl.compteUpdate);
router.post('/compte/password',    requireLogin, vitrineCtrl.comptePassword);

// Pages statiques vitrine
router.get('/contact',      vitrineCtrl.contact);
router.post('/contact',     vitrineCtrl.contactPost);
router.get('/about',        vitrineCtrl.about);
router.get('/feedback',     vitrineCtrl.feedback);
router.post('/feedback',    vitrineCtrl.feedbackPost);

// API vitrine
router.get('/api/publicites', vitrineCtrl.publicites);
router.post('/api/chat',      adminCtrl.apiChat);

// ── Admin ─────────────────────────────────────────────────────
const A = requireAdmin;

router.get('/admin',               A, adminCtrl.dashboard);
router.get('/admin/produits',      A, adminCtrl.produits);
router.post('/admin/produits',     A, adminCtrl.saveProduit);
router.get('/admin/produits/delete/:id', A, adminCtrl.deleteProduit);

router.get('/admin/categories',    A, adminCtrl.categories);
router.post('/admin/categories',   A, adminCtrl.saveCategorie);
router.get('/admin/categories/delete/:id', A, adminCtrl.deleteCategorie);

router.get('/admin/marques',       A, adminCtrl.marques);
router.post('/admin/marques',      A, adminCtrl.saveMarque);
router.get('/admin/marques/delete/:id', A, adminCtrl.deleteMarque);

router.get('/admin/commandes',     A, adminCtrl.commandes);
router.post('/admin/commandes/statut', A, adminCtrl.updateStatut);

router.get('/admin/clients',       A, adminCtrl.clients);
router.get('/admin/clients/toggle/:id', A, adminCtrl.toggleClient);
router.get('/admin/clients/delete/:id', A, adminCtrl.deleteClient);

router.get('/admin/stocks',        A, adminCtrl.stocks);
router.get('/admin/feedbacks',     A, adminCtrl.feedbacks);
router.post('/admin/feedbacks/update', A, adminCtrl.updateFeedback);
router.get('/admin/feedbacks/delete/:id', A, adminCtrl.deleteFeedback);

router.get('/admin/messages',      A, adminCtrl.messages);
router.post('/admin/messages/update', A, adminCtrl.updateMessage);

router.get('/admin/campagnes',     A, adminCtrl.campagnesV2);
router.post('/admin/campagnes',    A, adminCtrl.saveCampagne);
router.get('/admin/campagnes/delete/:id', A, adminCtrl.deleteCampagne);

router.get('/admin/rapports',      A, adminCtrl.rapports);
router.get('/admin/journaux',      A, adminCtrl.journaux);
router.get('/admin/chat',          A, adminCtrl.chat);

// API Admin IA
router.post('/admin/api/ia',       A, adminCtrl.apiIA);
router.get('/admin/api/publicites',A, adminCtrl.apiPublicites);

module.exports = router;

// Routes ajoutées v3
router.get('/admin/fournisseurs',                A, adminCtrl.fournisseurs);
router.post('/admin/fournisseurs',               A, adminCtrl.saveFournisseur);
router.get('/admin/fournisseurs/delete/:id',     A, adminCtrl.deleteFournisseur);

router.get('/admin/sous_categories',             A, adminCtrl.sousCats);
router.post('/admin/sous_categories',            A, adminCtrl.saveSousCat);
router.get('/admin/sous_categories/delete/:id',  A, adminCtrl.deleteSousCat);

router.get('/admin/marketing',                   A, adminCtrl.marketingIA);

// Agents IA
router.get('/admin/agents',              A, adminCtrl.agentsIA);
router.post('/admin/api/message-ia',     A, adminCtrl.apiMessagePersonnalise);
router.post('/admin/campagnes/envoyer', A, adminCtrl.apiEnvoiCampagne);

// ── Route test agents IA ──────────────────────────────────────
router.get('/admin/test-ia', A, async (req, res) => {
  const groq   = require('../services/groq.service');
  const db     = require('../config/db');
  const result = {};

  // Test 1 — Groq
  try {
    const rep = await groq.generate('Dis juste "Nexio IA opérationnel" en français.', { maxTokens:30 });
    result.groq = { ok: true, reponse: rep };
  } catch(e) {
    result.groq = { ok: false, erreur: e.message };
  }

  // Test 2 — MySQL
  try {
    const [[r]] = await db.execute('SELECT COUNT(*) n FROM users');
    result.mysql = { ok: true, users: r.n };
  } catch(e) {
    result.mysql = { ok: false, erreur: e.message };
  }

  // Test 3 — Agent comportemental
  try {
    const agents = require('../agents');
    const [users] = await db.execute("SELECT id_user FROM users u JOIN roles r ON u.id_role=r.id_role WHERE r.nom='Client' LIMIT 1");
    if (users.length) {
      const analyse = await agents.comportemental.analyserUtilisateur(users[0].id_user);
      result.agent_comportemental = { ok: true, score: analyse.score_engagement };
    } else {
      result.agent_comportemental = { ok: false, erreur: 'Aucun client' };
    }
  } catch(e) {
    result.agent_comportemental = { ok: false, erreur: e.message };
  }

  res.json(result);
});
