/**
 * Nexio S.A. — Service Chatbot NEX
 * Conversations sauvegardées en MySQL, historique par session
 */
const db     = require('../config/db');
const groq   = require('./groq.service');
const logger = require('../config/logger');

const SYSTEM = `Tu es NEX, l'assistant virtuel de Nexio S.A., entreprise haïtienne de matériel informatique.
Tu réponds en français, de façon professionnelle, concise et utile.
Tu aides avec : recommandations produits, infos techniques, suivi commandes, support.
Si tu ne sais pas, dis-le honnêtement et propose de contacter le support.
Garde tes réponses courtes (2-4 phrases) sauf si détail demandé.
Nexio S.A. : Delmas, Port-au-Prince | Lun-Sam 8h-18h | MonCash, NatCash, Visa.`;

async function getCatalogue() {
  try {
    const [rows] = await db.execute(`
      SELECT p.nom, p.prix, p.quantite, c.nom AS categorie, m.nom AS marque
      FROM produits p
      LEFT JOIN marques m ON p.id_marque=m.id_marque
      LEFT JOIN sous_categories sc ON p.id_sous_categorie=sc.id_sous_categorie
      LEFT JOIN categories c ON sc.id_categorie=c.id_categorie
      WHERE p.statut='Disponible' LIMIT 20
    `);
    return rows.map(p => `- ${p.nom} (${p.categorie||'?'}) : ${Number(p.prix).toLocaleString()} HTG — stock: ${p.quantite}`).join('\n');
  } catch { return 'Catalogue non disponible.'; }
}

async function getHistory(sessionId) {
  try {
    const [rows] = await db.execute(
      `SELECT role, contenu FROM chat_messages WHERE session_id=? ORDER BY date_envoi DESC LIMIT 5`,
      [sessionId]
    );
    return rows.reverse();
  } catch { return []; }
}

async function saveMessage(sessionId, userId, role, contenu) {
  try {
    await db.execute(
      `INSERT INTO chat_messages(session_id,id_user,role,contenu) VALUES(?,?,?,?)`,
      [sessionId, userId || null, role, contenu]
    );
  } catch (e) { logger.warn(`Chat save: ${e.message}`); }
}

async function reply(message, sessionId, userId = null) {
  const [catalogue, history] = await Promise.all([getCatalogue(), getHistory(sessionId)]);
  const system = `${SYSTEM}\n\nProduits disponibles:\n${catalogue}`;
  const conv   = history.map(h => `${h.role === 'user' ? 'Client' : 'Assistant'}: ${h.contenu}`).join('\n');
  const prompt = `${conv}\nClient: ${message}\nAssistant:`;

  const response = await groq.generate(prompt, { system, maxTokens: 400 });

  await saveMessage(sessionId, userId, 'user',      message);
  await saveMessage(sessionId, userId, 'assistant', response);

  return response;
}

async function trackOrder(orderId, userId) {
  try {
    const [rows] = await db.execute(
      `SELECT c.id_commande,c.statut,c.montant,c.date_commande,COUNT(dc.id_detail) AS nb
       FROM commandes c LEFT JOIN details_commandes dc ON c.id_commande=dc.id_commande
       WHERE c.id_commande=? AND c.id_user=? GROUP BY c.id_commande`,
      [orderId, userId]
    );
    if (!rows[0]) return 'Commande introuvable ou accès non autorisé.';
    const cmd = rows[0];
    const date = cmd.date_commande ? new Date(cmd.date_commande).toLocaleDateString('fr-HT') : '?';
    return `Commande #CMD-${String(cmd.id_commande).padStart(5,'0')} : statut **${cmd.statut}**, ${cmd.nb} article(s), montant ${Number(cmd.montant).toLocaleString()} HTG. Passée le ${date}.`;
  } catch (e) { return `Impossible de récupérer la commande : ${e.message}`; }
}

module.exports = { reply, trackOrder };
