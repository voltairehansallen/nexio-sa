/**
 * Nexio S.A. — Service Groq IA v3.1
 * Compatible Railway — lit GROQ_API_KEY depuis process.env
 */
'use strict';

const axios  = require('axios');
const logger = require('../config/logger');

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL      = () => process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const TIMEOUT    = 30000;
const MAX_RETRY  = 3;

// Vérification clé au démarrage
setTimeout(() => {
  const key = process.env.GROQ_API_KEY || '';
  if (!key || key === 'VOTRE_CLE_GROQ_ICI') {
    console.warn('⚠️  GROQ_API_KEY non configurée — mode démo actif');
    console.warn('   Allez dans Railway → Variables → GROQ_API_KEY');
  } else {
    console.log('✅ Groq API configurée — modèle:', MODEL());
  }
}, 500);

// Cache mémoire (TTL 5 min)
const _cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
function cacheGet(k) { const e=_cache.get(k); return (e&&Date.now()<e.exp)?e.val:null; }
function cacheSet(k,v) { _cache.set(k,{val:v,exp:Date.now()+CACHE_TTL}); }

const SYSTEM = `Tu es NEX, l'assistant IA de Nexio S.A., plateforme e-commerce de matériel informatique à Port-au-Prince, Haïti.
Réponds toujours en français, de façon professionnelle et concise.
Contexte : Nexio S.A. | Delmas, Port-au-Prince | Lun-Sam 8h-18h | MonCash, NatCash, Visa acceptés.`;

async function generate(prompt, opts = {}) {
  const {
    system      = SYSTEM,
    maxTokens   = 1024,
    temperature = 0.7,
    useCache    = false,
  } = opts;

  const cacheKey = useCache ? prompt.slice(0, 100) : null;
  if (useCache && cacheKey) {
    const cached = cacheGet(cacheKey);
    if (cached) return cached;
  }

  const key = process.env.GROQ_API_KEY || '';
  if (!key || key === 'VOTRE_CLE_GROQ_ICI') {
    logger.warn('GROQ_API_KEY manquante — mode démo');
    return demoResponse(prompt);
  }

  let lastErr = null;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      const resp = await axios.post(GROQ_URL, {
        model:       MODEL(),
        messages:    [
          { role: 'system', content: system },
          { role: 'user',   content: prompt }
        ],
        max_tokens:  maxTokens,
        temperature,
      }, {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type':  'application/json',
        },
        timeout: TIMEOUT,
      });

      const content = resp.data.choices[0].message.content;
      if (useCache && cacheKey) cacheSet(cacheKey, content);
      logger.info(`Groq OK | tokens=${resp.data.usage?.total_tokens||'?'} | modèle=${MODEL()}`);
      return content;

    } catch (err) {
      lastErr = err;
      const status  = err.response?.status;
      const detail  = err.response?.data?.error?.message || err.message;
      logger.warn(`Groq tentative ${attempt}/${MAX_RETRY} échouée (HTTP ${status||'?'}) : ${detail}`);

      // Clé invalide — inutile de retry
      if (status === 401 || status === 403) {
        logger.error('Groq : clé API invalide. Vérifiez GROQ_API_KEY dans Railway Variables.');
        break;
      }
      // Rate limit — attendre plus longtemps
      if (status === 429) {
        await new Promise(r => setTimeout(r, 5000 * attempt));
      } else if (attempt < MAX_RETRY) {
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }
    }
  }

  logger.error(`Groq ÉCHEC final : ${lastErr?.message}`);
  return demoResponse(prompt);
}

function demoResponse(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes('recommand'))     return JSON.stringify([{id_produit:1,raison:'Produit populaire',score:0.8},{id_produit:2,raison:'Bien noté',score:0.7}]);
  if (p.includes('sentiment'))     return JSON.stringify({sentiment:'positif',score:0.8,résumé:'Avis favorable'});
  if (p.includes('json'))          return JSON.stringify({message:'NEX IA en mode démo — configurez GROQ_API_KEY dans Railway Variables',ok:true});
  if (p.includes('campagne'))      return 'Campagne démo : Découvrez nos offres exclusives chez Nexio S.A. ! Visitez nexiosa.up.railway.app';
  if (p.includes('comportement'))  return JSON.stringify({centres_interet:['Informatique'],probabilite_achat:0.6,segment:'standard',recommandations:['Voir nos produits populaires']});
  return 'Service NEX IA actif. Configurez GROQ_API_KEY dans Railway → Variables pour activer les réponses intelligentes.';
}

// ── Méthodes spécialisées ─────────────────────────────────────

async function analyze(data, context = '') {
  const prompt = `${context}\n\nDonnées:\n${JSON.stringify(data, null, 2)}\n\nRéponds UNIQUEMENT en JSON valide, sans markdown ni backticks.`;
  const raw = await generate(prompt, { maxTokens: 1500 });
  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { raw, error: 'JSON invalide', ok: false };
  }
}

async function recommend(userData, products) {
  const prompt = `Utilisateur: ${JSON.stringify(userData)}\nProduits: ${JSON.stringify(products.slice(0,20))}\nRecommande les 5 meilleurs. JSON uniquement: [{"id_produit":1,"raison":"...","score":0.9}]`;
  const raw = await generate(prompt, { maxTokens: 600 });
  try { return JSON.parse(raw.replace(/```json|```/g,'').trim()); }
  catch { return []; }
}

async function generateCampaign(canal, segment, context) {
  const sys = `Tu es expert marketing pour Nexio S.A. Haiti. Messages percutants adaptés au contexte haïtien.`;
  const prompt = `Canal: ${canal}\nSegment: ${segment}\nContexte: ${context}\nMessage marketing en français (max 200 mots) avec appel à l'action.`;
  return generate(prompt, { system: sys, maxTokens: 400 });
}

async function analyzeSentiment(text) {
  const prompt = `Analyse: "${text}"\nJSON: {"sentiment":"positif|neutre|négatif","score":0.85,"résumé":"..."}`;
  const raw = await generate(prompt, { maxTokens: 200 });
  try { return JSON.parse(raw.replace(/```json|```/g,'').trim()); }
  catch { return { sentiment:'neutre', score:0.5, résumé: raw }; }
}

async function detectFraud(orderData) {
  const prompt = `Commande suspecte?\n${JSON.stringify(orderData)}\nJSON: {"risque":"faible|moyen|élevé","score":0.2,"raisons":[]}`;
  const raw = await generate(prompt, { maxTokens: 300 });
  try { return JSON.parse(raw.replace(/```json|```/g,'').trim()); }
  catch { return { risque:'faible', score:0.1, raisons:[] }; }
}

async function forecastSales(historique) {
  const prompt = `Ventes:\n${JSON.stringify(historique)}\nPrévois 7 jours. JSON: {"previsions":[{"date":"YYYY-MM-DD","ventes":5,"ca":50000}],"tendance":"hausse|baisse|stable","confiance":0.8}`;
  const raw = await generate(prompt, { maxTokens: 600 });
  try { return JSON.parse(raw.replace(/```json|```/g,'').trim()); }
  catch { return { previsions:[], tendance:'stable', confiance:0.5 }; }
}

module.exports = { generate, analyze, recommend, generateCampaign, analyzeSentiment, detectFraud, forecastSales };
