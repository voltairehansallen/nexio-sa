/**
 * Nexio S.A. — Tous les agents IA (Node.js)
 * 15 agents, pool MySQL partagé, groq.service.js exclusivement
 */
const db   = require('../config/db');
const groq = require('../services/groq.service');
const logger = require('../config/logger');

// ══════════════════════════════════════════════════════════════
// AGENT 1 — Analyse Comportementale
// ══════════════════════════════════════════════════════════════
class AgentComportemental {
  async analyserUtilisateur(idUser) {
    try {
      const [[cmd]] = await db.execute(
        `SELECT COUNT(*) AS nb_cmd, COALESCE(SUM(montant),0) AS ca_total, COALESCE(AVG(montant),0) AS panier_moyen
         FROM commandes WHERE id_user=? AND statut!='Annulée'`, [idUser]);
      const [cats] = await db.execute(
        `SELECT c.nom AS categorie, COUNT(*) AS score FROM interactions i
         JOIN produits p ON i.id_produit=p.id_produit
         LEFT JOIN sous_categories sc ON p.id_sous_categorie=sc.id_sous_categorie
         LEFT JOIN categories c ON sc.id_categorie=c.id_categorie
         WHERE i.id_user=? GROUP BY c.nom ORDER BY score DESC LIMIT 5`, [idUser]);
      const nb = parseInt(cmd.nb_cmd)||0, ca = parseFloat(cmd.ca_total)||0;
      const engagement = Math.min(100, Math.round(nb*20 + ca/10000));
      const fidelite   = Math.min(100, Math.round(nb*15 + (ca>50000?10:0)));
      const data = {
        id_user: idUser, nb_commandes: nb, ca_total: ca,
        panier_moyen: parseFloat(cmd.panier_moyen)||0,
        categories_preferees: cats.filter(c=>c.categorie).map(c=>c.categorie),
        score_engagement: engagement, score_fidelite: fidelite,
      };
      const analyse = await groq.analyze(data, `Analyse le comportement de l'utilisateur ${idUser} de Nexio S.A. Donne: centres_interet, probabilite_achat (0-1), segment (gamers/entreprises/etudiants/fidelises/nouveaux/professionnels), recommandations.`);
      try {
        await db.execute(`INSERT INTO analyses_comportementales(id_user,score_engagement,score_fidelite,categories_preferees,panier_moyen,nb_commandes,ca_total,ia_analyse)
          VALUES(?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE score_engagement=VALUES(score_engagement),score_fidelite=VALUES(score_fidelite),categories_preferees=VALUES(categories_preferees),ia_analyse=VALUES(ia_analyse),updated_at=NOW()`,
          [idUser,engagement,fidelite,JSON.stringify(cats.map(c=>c.categorie)),cmd.panier_moyen,nb,ca,JSON.stringify(analyse)]);
      } catch(e) { logger.warn(`Comportemental save: ${e.message}`); }
      return { ...data, ia: analyse };
    } catch(e) { logger.error(`AgentComportemental: ${e.message}`); return { error: e.message }; }
  }
  async analyserTous() {
    const [users] = await db.execute(`SELECT u.id_user FROM users u JOIN roles r ON u.id_role=r.id_role WHERE r.nom='Client' LIMIT 50`);
    return Promise.all(users.map(u => this.analyserUtilisateur(u.id_user)));
  }
}

// ══════════════════════════════════════════════════════════════
// AGENT 2 — Recommandation
// ══════════════════════════════════════════════════════════════
class AgentRecommandation {
  async recommanderPourUser(idUser) {
    try {
      const [[profil]] = await db.execute(
        `SELECT score_engagement,score_fidelite,categories_preferees,panier_moyen FROM analyses_comportementales WHERE id_user=?`, [idUser]
      ).catch(() => [[{}]]);
      const [produits] = await db.execute(
        `SELECT p.id_produit,p.nom,p.prix,m.nom AS marque,c.nom AS categorie FROM produits p
         LEFT JOIN marques m ON p.id_marque=m.id_marque
         LEFT JOIN sous_categories sc ON p.id_sous_categorie=sc.id_sous_categorie
         LEFT JOIN categories c ON sc.id_categorie=c.id_categorie
         WHERE p.statut='Disponible' LIMIT 50`);
      if (!produits.length) return [];
      const recs = await groq.recommend({ id_user: idUser, profil: profil||{} }, produits);
      for (const r of recs) {
        if (!r.id_produit) continue;
        try {
          await db.execute(`INSERT INTO recommandations(id_user,id_produit,score,raison) VALUES(?,?,?,?)
            ON DUPLICATE KEY UPDATE score=VALUES(score),raison=VALUES(raison)`,
            [idUser, r.id_produit, r.score||0.5, r.raison||'']);
        } catch {}
      }
      return recs;
    } catch(e) { logger.error(`AgentReco: ${e.message}`); return []; }
  }
  async produitsSimilaires(idProduit) {
    try {
      const [[prod]] = await db.execute(
        `SELECT p.*,sc.id_categorie FROM produits p LEFT JOIN sous_categories sc ON p.id_sous_categorie=sc.id_sous_categorie WHERE p.id_produit=?`, [idProduit]);
      if (!prod) return [];
      const [candidats] = await db.execute(
        `SELECT p.id_produit,p.nom,p.prix,m.nom AS marque FROM produits p
         LEFT JOIN marques m ON p.id_marque=m.id_marque
         LEFT JOIN sous_categories sc ON p.id_sous_categorie=sc.id_sous_categorie
         WHERE sc.id_categorie=? AND p.id_produit!=? AND p.statut='Disponible' LIMIT 20`,
        [prod.id_categorie, idProduit]);
      if (!candidats.length) return [];
      const prompt = `Produit: ${prod.nom}\nCandidats: ${JSON.stringify(candidats)}\nSélectionne les 4 plus similaires. JSON: [{"id_produit":1,"raison":"..."}]`;
      const raw = await groq.generate(prompt, { maxTokens: 400 });
      try { return JSON.parse(raw.replace(/```json|```/g,'').trim()); } catch { return candidats.slice(0,4); }
    } catch(e) { return []; }
  }
}

// ══════════════════════════════════════════════════════════════
// AGENT 3 — Marketing
// ══════════════════════════════════════════════════════════════
class AgentMarketing {
  async genererCampagne(idCampagne) {
    try {
      const [[camp]] = await db.execute(`SELECT * FROM campagnes WHERE id_campagne=?`, [idCampagne]);
      if (!camp) return { error: 'Campagne introuvable' };
      const contenu = await groq.generateCampaign(camp.canal, camp.segment||'general', `Campagne: ${camp.nom}\n${camp.contenu||''}`);
      const prompt2 = `Crée pour cette campagne: titre accrocheur, slogan, email HTML (court), message WhatsApp (court), post Facebook, appel à l'action.\nCampagne: ${camp.nom} | Canal: ${camp.canal}\nRéponds UNIQUEMENT en JSON: {"titre":"...","slogan":"...","email":"...","whatsapp":"...","facebook":"...","appel_action":"..."}`;
      const structured = await groq.analyze({}, prompt2);
      try {
        await db.execute(`UPDATE campagnes SET titre_ia=?,slogan=?,contenu_email=?,contenu_whatsapp=?,contenu_facebook=?,appel_action=?,contenu=?,statut='Brouillon' WHERE id_campagne=?`,
          [structured.titre||camp.nom, structured.slogan||'', structured.email||contenu, structured.whatsapp||contenu, structured.facebook||contenu, structured.appel_action||'Découvrir', contenu, idCampagne]);
      } catch(e) { logger.warn(`Marketing update: ${e.message}`); }
      return { ...structured, contenu };
    } catch(e) { logger.error(`AgentMarketing: ${e.message}`); return { error: e.message }; }
  }
  async detecterPaniersAbandonnes() {
    try {
      const [rows] = await db.execute(
        `SELECT p.id_user,u.prenom,u.nom,u.email,SUM(p.quantite*pr.prix) AS valeur,COUNT(*) AS articles
         FROM panier p JOIN users u ON p.id_user=u.id_user JOIN produits pr ON p.id_produit=pr.id_produit
         WHERE p.date_ajout < NOW()-INTERVAL 24 HOUR GROUP BY p.id_user LIMIT 20`);
      return rows;
    } catch(e) { return []; }
  }
}

// ══════════════════════════════════════════════════════════════
// AGENT 4 — Ventes
// ══════════════════════════════════════════════════════════════
class AgentVentes {
  async rapportComplet(jours = 30) {
    try {
      const [ventes] = await db.execute(
        `SELECT DATE(date_commande) AS jour, COUNT(*) AS nb, SUM(montant) AS total
         FROM commandes WHERE date_commande>=NOW()-INTERVAL ? DAY AND statut!='Annulée' GROUP BY jour ORDER BY jour DESC`,
        [jours]);
      const [top] = await db.execute(
        `SELECT p.nom, SUM(dc.quantite) AS qte, SUM(dc.quantite*dc.prix) AS ca
         FROM details_commandes dc JOIN produits p ON dc.id_produit=p.id_produit
         JOIN commandes c ON dc.id_commande=c.id_commande WHERE c.statut!='Annulée' GROUP BY dc.id_produit ORDER BY qte DESC LIMIT 10`);
      const ca = ventes.reduce((s,v)=>s+parseFloat(v.total||0),0);
      const nb = ventes.reduce((s,v)=>s+parseInt(v.nb||0),0);
      const analyse = await groq.analyze({ ventes, top_produits: top, ca_total: ca, nb_commandes: nb },
        `Analyse les performances de ventes de Nexio S.A. sur ${jours} jours. Donne: tendance, points_forts, points_amelioration, recommandations.`);
      return { ventes, top_produits: top, ca_total: ca, nb_commandes: nb, panier_moyen: nb?ca/nb:0, ia: analyse };
    } catch(e) { return { error: e.message }; }
  }
}

// ══════════════════════════════════════════════════════════════
// AGENT 5 — Prévisions
// ══════════════════════════════════════════════════════════════
class AgentPrevision {
  async prevoir() {
    try {
      const [hist] = await db.execute(
        `SELECT DATE(date_commande) AS date, COUNT(*) AS ventes, SUM(montant) AS ca
         FROM commandes WHERE date_commande>=NOW()-INTERVAL 30 DAY AND statut!='Annulée' GROUP BY DATE(date_commande) ORDER BY date`);
      const previsions = await groq.forecastSales(hist);
      const [ruptBas] = await db.execute(`SELECT nom,quantite,seuil_alerte FROM produits WHERE quantite<=seuil_alerte ORDER BY quantite ASC LIMIT 10`);
      return { previsions, ruptures_anticipees: ruptBas };
    } catch(e) { return { error: e.message }; }
  }
}

// ══════════════════════════════════════════════════════════════
// AGENT 6 — Stock Intelligence
// ══════════════════════════════════════════════════════════════
class AgentStock {
  async analyser() {
    try {
      const [alertes] = await db.execute(
        `SELECT p.nom,p.quantite,p.seuil_alerte,m.nom AS marque FROM produits p LEFT JOIN marques m ON p.id_marque=m.id_marque WHERE p.quantite<=p.seuil_alerte ORDER BY p.quantite ASC LIMIT 20`);
      const [stats] = await db.execute(
        `SELECT COUNT(*) AS total, SUM(quantite) AS total_unites, AVG(quantite) AS moy_stock,
         SUM(CASE WHEN quantite=0 THEN 1 ELSE 0 END) AS ruptures,
         SUM(CASE WHEN quantite<=seuil_alerte AND quantite>0 THEN 1 ELSE 0 END) AS bas
         FROM produits WHERE statut='Disponible'`);
      const analyse = await groq.analyze({ alertes, stats: stats[0] },
        'Analyse les niveaux de stock de Nexio S.A. Donne: alertes_prioritaires, actions_recommandees, risques.');
      return { alertes, stats: stats[0], ia: analyse };
    } catch(e) { return { error: e.message }; }
  }
}

// ══════════════════════════════════════════════════════════════
// AGENT 10 — Fraude
// ══════════════════════════════════════════════════════════════
class AgentFraude {
  async analyserCommande(idCommande) {
    try {
      const [[cmd]] = await db.execute(
        `SELECT c.*,u.email,u.date_creation,COUNT(uc.id_commande) AS nb_cmd_user
         FROM commandes c JOIN users u ON c.id_user=u.id_user
         LEFT JOIN commandes uc ON uc.id_user=c.id_user
         WHERE c.id_commande=? GROUP BY c.id_commande`, [idCommande]);
      if (!cmd) return { error: 'Commande introuvable' };
      return await groq.detectFraud(cmd);
    } catch(e) { return { error: e.message }; }
  }
  async scannerRecentes() {
    try {
      const [cmds] = await db.execute(
        `SELECT c.id_commande,c.montant,c.statut,u.email FROM commandes c JOIN users u ON c.id_user=u.id_user
         WHERE c.date_commande>=NOW()-INTERVAL 24 HOUR ORDER BY c.montant DESC LIMIT 10`);
      return Promise.all(cmds.map(async c => ({ ...c, fraude: await groq.detectFraud(c) })));
    } catch(e) { return []; }
  }
}

// ══════════════════════════════════════════════════════════════
// AGENT 11 — Sentiment
// ══════════════════════════════════════════════════════════════
class AgentSentiment {
  async analyserAvis(idAvis) {
    try {
      const [[avis]] = await db.execute(`SELECT * FROM feedbacks WHERE id_feedback=?`, [idAvis]);
      if (!avis) return { error: 'Avis introuvable' };
      const sentiment = await groq.analyzeSentiment(avis.commentaire||'');
      await db.execute(`UPDATE feedbacks SET sentiment=?,sentiment_score=? WHERE id_feedback=?`,
        [sentiment.sentiment, sentiment.score||0.5, idAvis]).catch(()=>{});
      return { avis, sentiment };
    } catch(e) { return { error: e.message }; }
  }
  async rapportSatisfaction() {
    try {
      const [feedbacks] = await db.execute(`SELECT commentaire,note FROM feedbacks WHERE statut='Approuvé' LIMIT 20`);
      const analyse = await groq.analyze({ feedbacks }, 'Analyse la satisfaction globale des clients de Nexio S.A. Donne: score_global, points_positifs, points_negatifs, recommandations.');
      return { feedbacks, ia: analyse };
    } catch(e) { return { error: e.message }; }
  }
}

// ══════════════════════════════════════════════════════════════
// AGENT 12 — Profil Complet
// ══════════════════════════════════════════════════════════════
class AgentProfilComplet {
  async analyser(idUser) {
    try {
      const [[user]] = await db.execute(`SELECT id_user,prenom,nom,email,date_creation FROM users WHERE id_user=?`, [idUser]);
      if (!user) return { error: 'Utilisateur introuvable' };
      const [[cmds]] = await db.execute(`SELECT COUNT(*) AS nb, COALESCE(SUM(montant),0) AS ca, COALESCE(AVG(montant),0) AS moy FROM commandes WHERE id_user=? AND statut!='Annulée'`, [idUser]);
      const [wish]   = await db.execute(`SELECT p.nom,c.nom AS categorie FROM wishlist w JOIN produits p ON w.id_produit=p.id_produit LEFT JOIN sous_categories sc ON p.id_sous_categorie=sc.id_sous_categorie LEFT JOIN categories c ON sc.id_categorie=c.id_categorie WHERE w.id_user=? LIMIT 10`, [idUser]);
      const [panier] = await db.execute(`SELECT p.nom,pr.prix FROM panier pa JOIN produits p ON pa.id_produit=p.id_produit LEFT JOIN produits pr ON pa.id_produit=pr.id_produit WHERE pa.id_user=? LIMIT 10`, [idUser]);
      const profil_data = { user, commandes: cmds, wishlist: wish, panier };
      const profil = await groq.analyze(profil_data, `Génère un profil complet pour ce client Nexio S.A. Inclus: centres_interet, score_achat (0-100), probabilite_achat_30j (0-1), segment, budget_moyen, frequence_achat, recommandations.`);
      const segment = profil.segment || (parseInt(cmds.nb)>=3 ? 'fidelises' : 'nouveaux');
      try {
        await db.execute(`INSERT INTO profils_ia(id_user,segment,score_achat,probabilite_achat,budget_moyen,frequence_achat,recommandations,analyse_json,updated_at)
          VALUES(?,?,?,?,?,?,?,?,NOW()) ON DUPLICATE KEY UPDATE segment=VALUES(segment),score_achat=VALUES(score_achat),probabilite_achat=VALUES(probabilite_achat),analyse_json=VALUES(analyse_json),updated_at=NOW()`,
          [idUser, segment, profil.score_achat||50, profil.probabilite_achat_30j||0.3, cmds.moy, cmds.nb>0?30/Math.max(1,cmds.nb):0, JSON.stringify(profil.recommandations||[]), JSON.stringify(profil)]);
      } catch(e) { logger.warn(`ProfilComplet save: ${e.message}`); }
      return { user, stats: cmds, profil };
    } catch(e) { logger.error(`AgentProfilComplet: ${e.message}`); return { error: e.message }; }
  }
  async analyserTous() {
    const [users] = await db.execute(`SELECT u.id_user FROM users u JOIN roles r ON u.id_role=r.id_role WHERE r.nom='Client' LIMIT 30`);
    return Promise.all(users.map(u => this.analyser(u.id_user)));
  }
}

// ══════════════════════════════════════════════════════════════
// AGENT 13 — Campagne IA
// ══════════════════════════════════════════════════════════════
class AgentCampagneIA {
  async generer({ nom, canal='Email', segment='', idUser=null }) {
    const context = idUser ? `Client individuel ID: ${idUser}` : (segment ? `Segment: ${segment}` : 'Campagne globale');
    const prompt = `Crée une campagne marketing complète pour Nexio S.A. (matériel informatique, Haïti).\nNom: ${nom} | Canal: ${canal} | ${context}\nRéponds UNIQUEMENT en JSON: {"titre":"...","slogan":"...","contenu":"...","email":"...","whatsapp":"...","facebook":"...","appel_action":"..."}`;
    const result = await groq.analyze({}, prompt);
    return result;
  }
  async genererSegments() {
    const segments = ['gamers','entreprises','etudiants','fidelises','nouveaux','professionnels'];
    return Promise.all(segments.map(async seg => ({
      segment: seg,
      campagne: await this.generer({ nom: `Campagne ${seg}`, canal: 'Email', segment: seg }),
    })));
  }
}

// ══════════════════════════════════════════════════════════════
// AGENT 14 — Publicités
// ══════════════════════════════════════════════════════════════
class AgentPublicites {
  async genererPourUser(idUser) {
    try {
      const [[profil]] = await db.execute(`SELECT segment,categorie_preferee FROM profils_ia WHERE id_user=?`, [idUser]).catch(()=>[[null]]);
      const [produits] = await db.execute(`SELECT p.id_produit,p.nom,p.prix,p.image,c.nom AS categorie FROM produits p LEFT JOIN sous_categories sc ON p.id_sous_categorie=sc.id_sous_categorie LEFT JOIN categories c ON sc.id_categorie=c.id_categorie WHERE p.statut='Disponible' ORDER BY RAND() LIMIT 10`);
      const prompt = `Génère 3 publicités personnalisées pour un client Nexio S.A.\nProfil: ${JSON.stringify(profil||{})}\nProduits disponibles: ${JSON.stringify(produits)}\nRéponds UNIQUEMENT en JSON: [{"titre":"...","contenu":"...","prix":"...","id_produit":1,"lien_relatif":"/produit/1"}]`;
      const pubs = await groq.analyze({}, prompt);
      return Array.isArray(pubs) ? pubs : produits.slice(0,3).map(p => ({
        titre: `🔥 ${p.nom}`, contenu: `${p.categorie} — Disponible maintenant`,
        prix: `${Number(p.prix).toLocaleString()} HTG`, id_produit: p.id_produit,
        lien_relatif: `/produit/${p.id_produit}`, image: p.image,
      }));
    } catch(e) { return []; }
  }
}

// ══════════════════════════════════════════════════════════════
// AGENT 15 — Envoi Multi-canal
// ══════════════════════════════════════════════════════════════
class AgentEnvoi {
  constructor() {
    this.email  = require('../services/email.service');
    this.axios  = require('axios');
  }

  async envoyerCampagne(idCampagne) {
    try {
      const [[camp]] = await db.execute(`SELECT * FROM campagnes WHERE id_campagne=?`, [idCampagne]);
      if (!camp) return { error: 'Campagne introuvable' };

      let destinataires = [];
      if (camp.id_user_cible) {
        const [r] = await db.execute(`SELECT id_user,prenom,nom,email,telephone FROM users WHERE id_user=?`, [camp.id_user_cible]);
        destinataires = r;
      } else if (camp.segment) {
        const [r] = await db.execute(`SELECT u.id_user,u.prenom,u.nom,u.email,u.telephone FROM users u JOIN profils_ia p ON u.id_user=p.id_user WHERE p.segment=? AND u.statut='Actif'`, [camp.segment]);
        destinataires = r;
      } else {
        const [r] = await db.execute(`SELECT u.id_user,u.prenom,u.nom,u.email,u.telephone FROM users u JOIN roles r ON u.id_role=r.id_role WHERE r.nom='Client' AND u.statut='Actif' LIMIT 200`);
        destinataires = r;
      }

      let nbOk = 0;
      for (const dest of destinataires) {
        const sujet  = camp.titre_ia || camp.nom;
        const contenu= camp.contenu_email || camp.contenu || '';
        const cta    = camp.appel_action || 'Voir nos offres';
        if (camp.canal === 'Email' || camp.canal === 'Multi-canal') {
          const html = this.email.buildHtml(dest.prenom, sujet, contenu, cta);
          const r    = await this.email.sendEmail({ to: dest.email, toName: `${dest.prenom} ${dest.nom}`, subject: sujet, html, text: contenu });
          if (['envoyé','simulé'].includes(r.status)) nbOk++;
          try {
            await db.execute(`INSERT INTO messages_marketing(id_campagne,id_user,canal,contenu,statut) VALUES(?,?,'Email',?,?)`,
              [idCampagne, dest.id_user, contenu, r.status==='envoyé'?'Envoyé':'Simulé']);
          } catch {}
        }
        if (camp.canal === 'WhatsApp' || camp.canal === 'Multi-canal') {
          if (dest.telephone && process.env.WHATSAPP_TOKEN) {
            await this._sendWhatsApp(dest.telephone, camp.contenu_whatsapp||contenu).catch(()=>{});
          }
        }
        await new Promise(r => setTimeout(r, 100));
      }
      if (camp.canal === 'Facebook' && process.env.FACEBOOK_PAGE_TOKEN) {
        await this._postFacebook(camp.contenu_facebook||camp.contenu||'').catch(()=>{});
        nbOk++;
      }
      await db.execute(`UPDATE campagnes SET statut='Envoyée',date_envoi=NOW(),nb_destins=?,nb_envoyes=? WHERE id_campagne=?`,
        [destinataires.length, nbOk, idCampagne]);
      return { statut: 'Envoyée', destinataires: destinataires.length, envoyes: nbOk };
    } catch(e) { logger.error(`AgentEnvoi: ${e.message}`); return { error: e.message }; }
  }

  async _sendWhatsApp(phone, message) {
    const num = phone.replace(/\D/g,'');
    const to  = num.startsWith('509') ? num : `509${num}`;
    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
    await this.axios.post(url, { messaging_product:'whatsapp', to, type:'text', text:{ body:message } },
      { headers:{ Authorization:`Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type':'application/json' }, timeout:15000 });
  }

  async _postFacebook(message) {
    const url = `https://graph.facebook.com/v18.0/${process.env.FACEBOOK_PAGE_ID}/feed`;
    await this.axios.post(url, { message, access_token: process.env.FACEBOOK_PAGE_TOKEN }, { timeout:15000 });
  }
}

// ── Instances partagées ──────────────────────────────────────
module.exports = {
  comportemental: new AgentComportemental(),
  recommandation: new AgentRecommandation(),
  marketing:      new AgentMarketing(),
  ventes:         new AgentVentes(),
  prevision:      new AgentPrevision(),
  stock:          new AgentStock(),
  fraude:         new AgentFraude(),
  sentiment:      new AgentSentiment(),
  profil:         new AgentProfilComplet(),
  campagneIA:     new AgentCampagneIA(),
  publicites:     new AgentPublicites(),
  envoi:          new AgentEnvoi(),
};
