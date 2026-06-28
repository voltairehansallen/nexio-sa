/**
 * Nexio S.A. — Service Groq IA Centralisé
 * Singleton avec retry, cache mémoire, toutes les méthodes IA
 */
const axios  = require('axios');
const logger = require('../config/logger');

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL      = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const TEMP       = 0.7;
const MAX_TOKENS = 1024;
const TIMEOUT    = 30000;
const MAX_RETRY  = 3;

// Vérification clé au démarrage
setTimeout(() => {
  const key = process.env.GROQ_API_KEY || '';
  if (!key || key === 'VOTRE_CLE_GROQ_ICI') {
    console.warn('⚠️  GROQ_API_KEY non configurée — mode démo actif');
  } else {
    console.log('✅ Groq API configurée — modèle:', process.env.GROQ_MODEL || 'llama-3.3-70b-versatile');
  }
}, 1000);

// Cache mémoire simple (TTL 5 min)
const _cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
function cacheGet(key) { const e = _cache.get(key); return (e && Date.now() < e.exp) ? e.val : null; }
function cacheSet(key, val) { _cache.set(key, { val, exp: Date.now() + CACHE_TTL }); }

const SYSTEM_DEFAULT = `Tu es l'assistant IA de Nexio S.A., plateforme e-commerce de matériel informatique à Port-au-Prince, Haïti.
Réponds toujours en français, de façon professionnelle et concise.
Nexio S.A. : Delmas, Port-au-Prince | Lun-Sam 8h-18h | MonCash, NatCash, Visa.`;

/**
 * Fonction principale
 */
async function generate(prompt, options = {}) {
  const {
    system      = SYSTEM_DEFAULT,
    maxTokens   = MAX_TOKENS,
    temperature = TEMP,
    useCache    = false,
  } = options;

  const cacheKey = useCache ? prompt.slice(0, 100) : null;
  if (useCache && cacheKey) {
    const cached = cacheGet(cacheKey);
    if (cached) return cached;
  }

  const key = process.env.GROQ_API_KEY || '';
  if (!key || key === 'VOTRE_CLE_GROQ_ICI') {
    logger.warn('GROQ_API_KEY non configurée — mode démo');
    return demoResponse(prompt);
  }

  let lastErr = null;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      const resp = await axios.post(GROQ_URL, {
        model:       MODEL,
        messages:    [{ role: 'system', content: system }, { role: 'user', content: prompt }],
        max_tokens:  maxTokens,
        temperature,
      }, {
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        timeout: TIMEOUT,
      });

      const content = resp.data.choices[0].message.content;
      if (useCache && cacheKey) cacheSet(cacheKey, content);
      logger.info(`Groq OK | tentative=${attempt} | tokens=${resp.data.usage?.total_tokens || '?'}`);
      return content;

    } catch (err) {
      lastErr = err;
      const status = err.response?.status;
      const detail = err.response?.data?.error?.message || err.message;
      logger.warn(`Groq tentative ${attempt} échouée (${status}) : ${detail}`);

      // Erreur clé invalide — pas la peine de réessayer
      if (status === 401 || status === 403) {
        logger.error('Groq : clé API invalide ou expirée. Vérifiez GROQ_API_KEY dans Railway Variables.');
        break;
      }
      // Attendre avant retry
      if (attempt < MAX_RETRY) await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }

  logger.error(`Groq ÉCHEC final : ${lastErr?.message}`);
  return demoResponse(prompt);
}

// Réponse de démo si Groq indisponible
function demoResponse(prompt) {
  if (prompt.includes('recommand')) return JSON.stringify([{id_produit:1,raison:'Produit populaire',score:0.8}]);
  if (prompt.includes('sentiment')) return JSON.stringify({sentiment:'positif',score:0.8,résumé:'Avis favorable'});
  if (prompt.includes('JSON'))      return JSON.stringify({message:'Service IA en mode démo',ok:true});
  return 'Service IA temporairement en mode démo. Vérifiez GROQ_API_KEY dans Railway Variables.';
}

// ── Méthodes spécialisées ─────────────────────────────────────

async function analyze(data, context = '') {
  const prompt = `${context}\n\nDonnées:\n${JSON.stringify(data, null, 2)}\n\nRéponds UNIQUEMENT en JSON valide, sans markdown ni backticks.`;
  const raw = await generate(prompt, { maxTokens: 1500 });
  try { return JSON.parse(raw.replace(/```json|```/g, '').trim()); }
  catch { return { raw, error: 'JSON invalide' }; }
}

async function recommend(userData, products) {
  const prompt = `Utilisateur: ${JSON.stringify(userData)}\nProduits disponibles: ${JSON.stringify(products.slice(0,20))}\nRecommande les 5 meilleurs produits. Réponds UNIQUEMENT en JSON: [{"id_produit":1,"raison":"...","score":0.9}]`;
  const raw = await generate(prompt, { maxTokens: 600 });
  try { return JSON.parse(raw.replace(/```json|```/g,'').trim()); } catch { return []; }
}

async function generateCampaign(canal, segment, context) {
  const system = `Tu es expert en marketing pour Nexio S.A., entreprise haïtienne de matériel informatique. Messages percutants adaptés au contexte haïtien.`;
  const prompt = `Canal: ${canal}\nSegment: ${segment}\nContexte: ${context}\nGénère un message marketing en français (max 200 mots) avec un appel à l'action clair.`;
  return generate(prompt, { system, maxTokens: 400 });
}

async function analyzeSentiment(text) {
  const prompt = `Analyse le sentiment: "${text}"\nRéponds UNIQUEMENT en JSON: {"sentiment":"positif|neutre|négatif","score":0.85,"résumé":"..."}`;
  const raw = await generate(prompt, { maxTokens: 200 });
  try { return JSON.parse(raw.replace(/```json|```/g,'').trim()); }
  catch { return { sentiment: 'neutre', score: 0.5, résumé: raw }; }
}

async function detectFraud(orderData) {
  const prompt = `Analyse cette commande pour détecter une fraude:\n${JSON.stringify(orderData,null,2)}\nRéponds UNIQUEMENT en JSON: {"risque":"faible|moyen|élevé","score":0.2,"raisons":[]}`;
  const raw = await generate(prompt, { maxTokens: 300 });
  try { return JSON.parse(raw.replace(/```json|```/g,'').trim()); }
  catch { return { risque: 'faible', score: 0.1, raisons: [] }; }
}

async function forecastSales(historique) {
  const prompt = `Données ventes:\n${JSON.stringify(historique)}\nPrévois les 7 prochains jours. Réponds UNIQUEMENT en JSON: {"previsions":[{"date":"YYYY-MM-DD","ventes_estimees":5,"ca_estime":50000}],"tendance":"hausse|baisse|stable","confiance":0.8}`;
  const raw = await generate(prompt, { maxTokens: 600 });
  try { return JSON.parse(raw.replace(/```json|```/g,'').trim()); }
  catch { return { previsions: [], tendance: 'stable', confiance: 0.5 }; }
}

module.exports = { generate, analyze, recommend, generateCampaign, analyzeSentiment, detectFraud, forecastSales };