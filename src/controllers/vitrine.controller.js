'use strict';
const db     = require('../config/db');
const agents = require('../agents');
const bcrypt = require('bcryptjs');

// Helper : récupère l'user depuis la session (unifié)
const getUid = (req) => req.session?.userId || req.session?.user?.id || null;

exports.home = async (req, res) => {
  try {
    const q    = req.query.q    || '';
    const cat  = parseInt(req.query.cat)  || 0;
    const tri  = req.query.tri  || 'recent';
    const pmin = parseFloat(req.query.pmin) || 0;
    const pmax = parseFloat(req.query.pmax) || 0;

    let sql    = `SELECT p.*,m.nom AS marque,c.nom AS categorie FROM produits p
                  LEFT JOIN marques m ON p.id_marque=m.id_marque
                  LEFT JOIN sous_categories sc ON p.id_sous_categorie=sc.id_sous_categorie
                  LEFT JOIN categories c ON sc.id_categorie=c.id_categorie
                  WHERE p.statut='Disponible'`;
    const params = [];
    if (q)    { sql += ' AND (p.nom LIKE ? OR p.description LIKE ?)'; params.push(`%${q}%`,`%${q}%`); }
    if (cat)  { sql += ' AND sc.id_categorie=?'; params.push(cat); }
    if (pmin) { sql += ' AND p.prix>=?'; params.push(pmin); }
    if (pmax) { sql += ' AND p.prix<=?'; params.push(pmax); }
    const orderMap = { prix_asc:'p.prix ASC', prix_desc:'p.prix DESC', nom:'p.nom ASC', recent:'p.id_produit DESC' };
    sql += ` ORDER BY ${orderMap[tri]||'p.id_produit DESC'}`;

    const [produits]   = await db.execute(sql, params);
    const [categories] = await db.execute('SELECT * FROM categories ORDER BY nom');
    const [feedbacks]  = await db.execute(
      "SELECT f.*,u.prenom FROM feedbacks f LEFT JOIN users u ON f.id_user=u.id_user WHERE f.statut='Approuvé' AND f.note>=4 ORDER BY f.date_feedback DESC LIMIT 6"
    ).catch(()=>[[]]);

    // Wishlist de l'utilisateur
    let wishlistIds = [];
    if (getUid(req)) {
      const [wl] = await db.execute('SELECT id_produit FROM wishlist WHERE id_user=?', [getUid(req)]).catch(()=>[[]]);
      wishlistIds = wl.map(w => w.id_produit);
    }

    const [[nbProduits]] = await db.execute("SELECT COUNT(*) AS n FROM produits WHERE statut='Disponible'");
    const [[nbMarques]]  = await db.execute("SELECT COUNT(*) AS n FROM marques");

    res.render('vitrine/index', {
      title:'Boutique', produits, categories, feedbacks, wishlistIds,
      nbProduits: nbProduits.n, nbMarques: nbMarques.n,
      q, cat, tri, pmin, pmax,
    });
  } catch (err) {
    res.render('vitrine/index', { title:'Boutique', produits:[], categories:[], feedbacks:[], wishlistIds:[], nbProduits:0, nbMarques:0, q:'', cat:0, tri:'recent', pmin:0, pmax:0 });
  }
};

exports.produit = async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return res.redirect('/');
  try {
    const [[prod]] = await db.execute(`
      SELECT p.*,m.nom AS marque,c.nom AS categorie,f.nom AS fournisseur
      FROM produits p LEFT JOIN marques m ON p.id_marque=m.id_marque
      LEFT JOIN sous_categories sc ON p.id_sous_categorie=sc.id_sous_categorie
      LEFT JOIN categories c ON sc.id_categorie=c.id_categorie
      LEFT JOIN fournisseurs f ON p.id_fournisseur=f.id_fournisseur
      WHERE p.id_produit=?
    `, [id]);
    if (!prod) return res.redirect('/');

    const similaires = await agents.recommandation.produitsSimilaires(id);

    if (getUid(req)) {
      await db.execute(
        'INSERT INTO interactions(id_user,id_produit,action,page) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE id_interaction=LAST_INSERT_ID(id_interaction)',
        [getUid(req), id, 'view', 'produit']
      ).catch(()=>{});
    }

    const inWish = getUid(req)
      ? !!(await db.execute('SELECT 1 FROM wishlist WHERE id_user=? AND id_produit=?', [getUid(req), id]).then(([r])=>r[0]).catch(()=>null))
      : false;

    res.render('vitrine/produit', { title: prod.nom, prod, similaires, inWish });
  } catch (err) {
    res.redirect('/');
  }
};

// ── Panier ───────────────────────────────────────────────────
exports.panier = async (req, res) => {
  const panier  = req.session.panier || {};
  const items   = [];
  let total     = 0;
  for (const [id, qty] of Object.entries(panier)) {
    const [[p]] = await db.execute('SELECT * FROM produits WHERE id_produit=?', [id]).catch(()=>[[null]]);
    if (p) { const st = p.prix * qty; total += st; items.push({ produit:p, qty, st }); }
  }
  res.render('vitrine/panier', { title:'Mon panier', items, total });
};

exports.panierAjout = async (req, res) => {
  const id  = parseInt(req.query.id||req.body.id);
  const qty = parseInt(req.query.qty||req.body.qty||1);
  if (!req.session.panier) req.session.panier = {};
  req.session.panier[id] = (req.session.panier[id]||0) + qty;

  if (req.query.ajax) {
    return res.json({ count: Object.values(req.session.panier).reduce((a,b)=>a+b,0), status:'ok' });
  }
  req.flash('success', 'Produit ajouté au panier !');
  res.redirect(req.headers.referer || '/');
};

exports.panierUpdate = async (req, res) => {
  const id  = parseInt(req.body.id);
  const qty = parseInt(req.body.qty);
  if (!req.session.panier) req.session.panier = {};
  if (qty <= 0) delete req.session.panier[id];
  else          req.session.panier[id] = qty;

  const total = 0; // recalculé côté client
  if (req.body.ajax) {
    let t = 0;
    for (const [pid, q] of Object.entries(req.session.panier||{})) {
      const [[p]] = await db.execute('SELECT prix FROM produits WHERE id_produit=?',[pid]).catch(()=>[[null]]);
      if (p) t += p.prix * q;
    }
    return res.json({ total:t, count:Object.values(req.session.panier||{}).reduce((a,b)=>a+b,0) });
  }
  res.redirect('/panier');
};

exports.panierSuppr = (req, res) => {
  delete req.session.panier?.[req.params.id];
  res.redirect('/panier');
};

exports.panierVider = (req, res) => {
  req.session.panier = {};
  res.redirect('/panier');
};

// ── Checkout ─────────────────────────────────────────────────
exports.checkout = async (req, res) => {
  if (!getUid(req)) return res.redirect('/auth/login');
  const panier = req.session.panier || {};
  if (!Object.keys(panier).length) return res.redirect('/panier');
  const items = []; let total = 0;
  for (const [id,qty] of Object.entries(panier)) {
    const [[p]] = await db.execute('SELECT * FROM produits WHERE id_produit=?',[id]).catch(()=>[[null]]);
    if (p) { const st=p.prix*qty; total+=st; items.push({produit:p,qty,st}); }
  }
  res.render('vitrine/checkout', { title:'Commander', items, total });
};

exports.checkoutPost = async (req, res) => {
  if (!getUid(req)) return res.redirect('/auth/login');
  const panier = req.session.panier || {};
  if (!Object.keys(panier).length) return res.redirect('/panier');
  const { adresse, methode } = req.body;
  const uid = getUid(req);
  let total = 0;
  const items = [];
  for (const [id,qty] of Object.entries(panier)) {
    const [[p]] = await db.execute('SELECT * FROM produits WHERE id_produit=?',[id]).catch(()=>[[null]]);
    if (p) { total += p.prix*qty; items.push({id_produit:p.id_produit,qty,prix:p.prix}); }
  }
  try {
    const [cmd] = await db.execute(
      "INSERT INTO commandes(id_user,montant,statut,adresse_livraison) VALUES(?,?,'En attente',?)",
      [uid, total, adresse]
    );
    for (const it of items) {
      await db.execute('INSERT INTO details_commandes(id_commande,id_produit,quantite,prix) VALUES(?,?,?,?)',
        [cmd.insertId, it.id_produit, it.qty, it.prix]);
    }
    await db.execute("INSERT INTO paiements(id_commande,montant,methode,statut) VALUES(?,?,?,'En attente')",
      [cmd.insertId, total, methode]);
    req.session.panier = {};
    res.render('vitrine/confirmation', { title:'Commande confirmée', cmdId: cmd.insertId, total, methode });
  } catch (err) {
    req.flash('error', 'Erreur lors de la commande.');
    res.redirect('/checkout');
  }
};

// ── Wishlist ─────────────────────────────────────────────────
exports.wishlist = async (req, res) => {
  if (!getUid(req)) return res.redirect('/auth/login');
  const [items] = await db.execute(`
    SELECT p.*,m.nom AS marque FROM wishlist w JOIN produits p ON w.id_produit=p.id_produit
    LEFT JOIN marques m ON p.id_marque=m.id_marque WHERE w.id_user=? ORDER BY w.date_ajout DESC
  `, [getUid(req)]).catch(()=>[[]]);
  res.render('vitrine/wishlist', { title:'Ma liste de souhaits', items });
};

exports.wishlistToggle = async (req, res) => {
  if (!getUid(req)) {
    if (req.query.ajax) return res.json({ error:'not_logged' });
    return res.redirect('/auth/login');
  }
  const id  = parseInt(req.params.id);
  const uid = getUid(req);
  const [[ex]] = await db.execute('SELECT 1 FROM wishlist WHERE id_user=? AND id_produit=?', [uid,id]).catch(()=>[[null]]);
  let added;
  if (ex) { await db.execute('DELETE FROM wishlist WHERE id_user=? AND id_produit=?',[uid,id]); added=false; }
  else     { await db.execute('INSERT IGNORE INTO wishlist(id_user,id_produit) VALUES(?,?)',[uid,id]); added=true; }
  if (req.query.ajax) return res.json({ added });
  res.redirect(req.headers.referer||'/');
};

exports.wishlistMoveToCart = async (req, res) => {
  if (!getUid(req)) return res.redirect('/auth/login');
  const id = parseInt(req.params.id);
  if (!req.session.panier) req.session.panier = {};
  req.session.panier[id] = (req.session.panier[id]||0)+1;
  req.flash('success','Produit déplacé vers le panier !');
  res.redirect('/panier');
};

// ── Compte ───────────────────────────────────────────────────
exports.compte = async (req, res) => {
  if (!getUid(req)) return res.redirect('/auth/login');
  const [[user]] = await db.execute('SELECT * FROM users WHERE id_user=?',[getUid(req)]);
  const [commandes] = await db.execute('SELECT * FROM commandes WHERE id_user=? ORDER BY date_commande DESC LIMIT 10',[getUid(req)]);
  res.render('vitrine/compte', { title:'Mon compte', user, commandes });
};

exports.compteUpdate = async (req, res) => {
  if (!getUid(req)) return res.redirect('/auth/login');
  const { telephone, adresse } = req.body;
  await db.execute('UPDATE users SET telephone=?,adresse=? WHERE id_user=?', [telephone,adresse,getUid(req)]);
  req.flash('success','Profil mis à jour.');
  res.redirect('/compte');
};

exports.comptePassword = async (req, res) => {
  if (!getUid(req)) return res.redirect('/auth/login');
  const { old_password, new_password, confirm_password } = req.body;
  const [[user]] = await db.execute('SELECT mot_de_passe FROM users WHERE id_user=?',[getUid(req)]);
  if (!(await bcrypt.compare(old_password, user.mot_de_passe))) {
    req.flash('error','Mot de passe actuel incorrect.'); return res.redirect('/compte');
  }
  if (new_password !== confirm_password || new_password.length < 6) {
    req.flash('error','Nouveau mot de passe invalide.'); return res.redirect('/compte');
  }
  const hash = await bcrypt.hash(new_password, 12);
  await db.execute('UPDATE users SET mot_de_passe=? WHERE id_user=?',[hash,getUid(req)]);
  req.flash('success','Mot de passe modifié.');
  res.redirect('/compte');
};

// ── Contact, À propos, Feedback ──────────────────────────────
const emailService = require('../services/email.service');
exports.contact = (req, res) => res.render('vitrine/contact', { title:'Contact' });
exports.contactPost = async (req, res) => {
  const { nom, email, sujet, message } = req.body;
  await db.execute('INSERT INTO messages_contact(nom,email,sujet,message) VALUES(?,?,?,?)',[nom,email,sujet||'',message]).catch(()=>{});
  await emailService.sendContact({ nom, email, sujet, message });
  req.flash('success','Message envoyé ! Nous vous répondrons sous 24h.');
  res.redirect('/contact');
};

exports.about = (req, res) => res.render('vitrine/about', { title:'À propos' });

exports.feedback = async (req, res) => {
  const [feedbacks] = await db.execute(
    "SELECT f.*,u.prenom FROM feedbacks f LEFT JOIN users u ON f.id_user=u.id_user WHERE f.statut='Approuvé' ORDER BY f.date_feedback DESC LIMIT 12"
  ).catch(()=>[[]]);
  res.render('vitrine/feedback', { title:'Feedback', feedbacks });
};

exports.feedbackPost = async (req, res) => {
  const { note, type_feedback, commentaire, nom, email } = req.body;
  const uid    = getUid(req);
  const nomVal = uid ? null : nom;
  const emlVal = uid ? null : email;
  await db.execute(
    'INSERT INTO feedbacks(id_user,nom,email,note,type_feedback,commentaire) VALUES(?,?,?,?,?,?)',
    [uid, nomVal, emlVal, parseInt(note)||5, type_feedback||'Expérience', commentaire]
  ).catch(()=>{});
  req.flash('success','Merci pour votre feedback !');
  res.redirect('/feedback');
};

// ── Publicités AJAX ──────────────────────────────────────────
exports.publicites = async (req, res) => {
  const uid = getUid(req);
  if (!uid) {
    const [prods] = await db.execute("SELECT id_produit,nom,prix,image FROM produits WHERE statut='Disponible' ORDER BY id_produit DESC LIMIT 3");
    return res.json({ pubs: prods.map(p=>({ titre:`🔥 ${p.nom}`, contenu:'Disponible maintenant', prix:`${Number(p.prix).toLocaleString()} HTG`, image:p.image||'', lien_relatif:`/produit/${p.id_produit}`, id_produit:p.id_produit })), personnal:false });
  }
  const pubs = await agents.publicites.genererPubUtilisateur(uid);
  res.json({ pubs, personnal:true });
};
