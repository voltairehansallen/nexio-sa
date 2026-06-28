'use strict';
const db     = require('../config/db');
const bcrypt = require('bcryptjs');
const agents = require('../agents');
const logger = require('../config/logger');

// ── Stats globales ────────────────────────────────────────────
async function getStats() {
  const [[prod]]   = await db.execute("SELECT COUNT(*) n FROM produits");
  const [[cmd]]    = await db.execute("SELECT COUNT(*) n FROM commandes");
  const [[clients]]= await db.execute("SELECT COUNT(*) n FROM users u JOIN roles r ON u.id_role=r.id_role WHERE r.nom='Client'");
  const [[ca]]     = await db.execute("SELECT COALESCE(SUM(montant),0) n FROM commandes WHERE statut!='Annulée'");
  const [[att]]    = await db.execute("SELECT COUNT(*) n FROM commandes WHERE statut='En attente'");
  const [[bas]]    = await db.execute("SELECT COUNT(*) n FROM produits WHERE quantite<=seuil_alerte");
  const [[fb]]     = await db.execute("SELECT COUNT(*) n FROM feedbacks WHERE statut='En attente'");
  const [[camois]] = await db.execute("SELECT COALESCE(SUM(montant),0) n FROM commandes WHERE MONTH(date_commande)=MONTH(NOW()) AND YEAR(date_commande)=YEAR(NOW()) AND statut!='Annulée'");
  let msg = 0;
  try { const [[m]] = await db.execute("SELECT COUNT(*) n FROM messages_contact WHERE statut='Non lu'"); msg=m.n; } catch {}
  return { produits:prod.n, commandes:cmd.n, clients:clients.n, ca:ca.n, en_attente:att.n, stock_bas:bas.n, feedbacks:fb.n, ca_mois:camois.n, messages:msg };
}

// ── Dashboard principal ────────────────────────────────────────
exports.dashboard = async (req, res) => {
  const stats   = await getStats();
  const [recent]= await db.execute("SELECT c.*,u.nom,u.prenom FROM commandes c LEFT JOIN users u ON c.id_user=u.id_user ORDER BY c.date_commande DESC LIMIT 8");
  const [alerts]= await db.execute("SELECT nom,quantite,seuil_alerte FROM produits WHERE quantite<=seuil_alerte ORDER BY quantite ASC LIMIT 6");
  const [chart7]= await db.execute("SELECT DATE(date_commande) j, COALESCE(SUM(montant),0) t, COUNT(*) nb FROM commandes WHERE date_commande>=NOW()-INTERVAL 7 DAY AND statut!='Annulée' GROUP BY j ORDER BY j");
  const [top5]  = await db.execute("SELECT p.nom,SUM(dc.quantite) qte FROM details_commandes dc JOIN produits p ON dc.id_produit=p.id_produit JOIN commandes c ON dc.id_commande=c.id_commande WHERE c.statut!='Annulée' GROUP BY dc.id_produit ORDER BY qte DESC LIMIT 5");

  // Helpers EJS injectés comme strings
  const badgeStatut = (s) => {
    const m = {'En attente':'b-wait','Confirmée':'b-ship','Expédiée':'b-ship','Livrée':'b-ok','Annulée':'b-cancel','Disponible':'b-avail','Rupture':'b-rupture','Actif':'b-ok','Inactif':'b-cancel'};
    const cls = m[s] || 'b-wait';
    return `<span class="badge ${cls}">${s}</span>`;
  };

  const chartJS_7days = (data) => {
    if (!data.length) return '';
    const labels = JSON.stringify(data.map(v => new Date(v.j).toLocaleDateString('fr-FR', {day:'2-digit',month:'2-digit'})));
    const vals   = JSON.stringify(data.map(v => parseFloat(v.t)||0));
    return `const ctx7=document.getElementById('chartVentes');if(ctx7)new Chart(ctx7,{type:'bar',data:{labels:${labels},datasets:[{label:'CA HTG',data:${vals},backgroundColor:'rgba(0,200,255,.15)',borderColor:'#00C8FF',borderWidth:2,borderRadius:6,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#64748B',font:{size:11}}},y:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#64748B',font:{size:11},callback:v=>\`\${(v/1000).toFixed(0)}k\`}}}}});`;
  };

  const adminJS = `
function toggleSidebar(){const sb=document.getElementById('sidebar');const open=sb.style.transform!=='translateX(-100%)';sb.style.transform=open?'translateX(-100%)':'translateX(0)';}
if(window.innerWidth<1024)document.getElementById('sidebar').style.transform='translateX(-100%)';
document.querySelectorAll('.flash').forEach(el=>setTimeout(()=>{el.style.transition='opacity .4s';el.style.opacity='0';setTimeout(()=>el.remove(),400);},4500));
function showToast(msg,type='success'){const t=document.createElement('div');t.style.cssText='position:fixed;top:70px;right:1.2rem;z-index:9999;padding:.75rem 1.1rem;border-radius:10px;font-size:.83rem;font-weight:700;display:flex;align-items:center;gap:.5rem;box-shadow:0 8px 24px rgba(0,0,0,.4);max-width:340px;';t.style.cssText+=type==='success'?'background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.25);color:#34D399;':'background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.25);color:#FCA5A5;';t.innerHTML=\`<i class="bi bi-\${type==='success'?'check-circle':'exclamation-circle'}-fill"></i>\${msg}<button onclick="this.parentNode.remove()" style="margin-left:auto;background:none;border:none;color:inherit;cursor:pointer;">×</button>\`;document.body.appendChild(t);setTimeout(()=>{t.style.transition='opacity .4s';t.style.opacity='0';setTimeout(()=>t.remove(),400);},4000);}
async function lancerAnalyseIA(){showToast('Analyse IA en cours…','success');const r=await fetch(BASE_URL+'/admin/api/ia',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'rapport_ventes',jours:30})});const d=await r.json();alert(d.analyse_ia||'Analyse terminée.');}
  `;

  res.render('admin/dashboard', {
    title:'Tableau de bord', stats, recent, alerts, chart7, top5,
    page:'dashboard',
    badgeStatut, chartJS_7days, adminJS,
  });
};

// ── CRUD Produits ─────────────────────────────────────────────
exports.produits = async (req, res) => {
  const q    = req.query.q    || '';
  const cat  = parseInt(req.query.cat)  || 0;
  const stat = req.query.stat || '';
  const pg   = parseInt(req.query.pg)||1; const pp=15;
  let sql    = "SELECT p.*,m.nom AS marque,c.nom AS categorie FROM produits p LEFT JOIN marques m ON p.id_marque=m.id_marque LEFT JOIN sous_categories sc ON p.id_sous_categorie=sc.id_sous_categorie LEFT JOIN categories c ON sc.id_categorie=c.id_categorie WHERE 1";
  const params=[];
  if (q)    { sql+=' AND (p.nom LIKE ? OR p.description LIKE ?)'; params.push(`%${q}%`,`%${q}%`); }
  if (cat)  { sql+=' AND sc.id_categorie=?'; params.push(cat); }
  if (stat) { sql+=' AND p.statut=?'; params.push(stat); }
  sql += ' ORDER BY p.id_produit DESC';
  const [[{total}]] = await db.execute(`SELECT COUNT(*) total FROM (${sql}) t`, params);
  const [rows]      = await db.execute(`${sql} LIMIT ${pp} OFFSET ${(pg-1)*pp}`, params);
  const [sous_cats] = await db.execute("SELECT sc.*,c.nom AS cat FROM sous_categories sc LEFT JOIN categories c ON sc.id_categorie=c.id_categorie ORDER BY c.nom,sc.nom");
  const [marques]   = await db.execute("SELECT * FROM marques ORDER BY nom");
  const [fourniss]  = await db.execute("SELECT * FROM fournisseurs ORDER BY nom").catch(()=>[[]]);
  const [categories]= await db.execute("SELECT * FROM categories ORDER BY nom");
  let edit = null;
  if (req.query.edit) { const [[e]]=await db.execute('SELECT * FROM produits WHERE id_produit=?',[req.query.edit]); edit=e||null; }
  res.render('admin/produits', { title:'Produits', rows, total, pages:Math.ceil(total/pp), pg, q, cat, stat, sous_cats, marques, fournisseurs:fourniss, categories, edit, page:'produits', stats:await getStats() });
};

exports.saveProduit = async (req, res) => {
  const { id, nom, prix, cout, quantite, seuil_alerte, id_sous_categorie, id_marque, id_fournisseur, garantie, statut, description } = req.body;
  let image = req.body.image || '';
  if (req.files?.image_file) {
    const file = req.files.image_file;
    const ext  = file.name.split('.').pop().toLowerCase();
    if (['jpg','jpeg','png','webp','gif'].includes(ext)) {
      const fn = `prod_${Date.now()}.${ext}`;
      await file.mv(`${__dirname}/../../public/uploads/${fn}`);
      image = `/uploads/${fn}`;
    }
  }
  const bind = [id_sous_categorie||null,id_marque||null,id_fournisseur||null,nom,description||'',parseFloat(prix),cout?parseFloat(cout):null,parseInt(quantite)||0,parseInt(seuil_alerte)||5,image,garantie||'',statut||'Disponible'];
  if (id) { await db.execute("UPDATE produits SET id_sous_categorie=?,id_marque=?,id_fournisseur=?,nom=?,description=?,prix=?,cout=?,quantite=?,seuil_alerte=?,image=?,garantie=?,statut=? WHERE id_produit=?", [...bind,id]); req.flash('success','Produit mis à jour.'); }
  else    { await db.execute("INSERT INTO produits(id_sous_categorie,id_marque,id_fournisseur,nom,description,prix,cout,quantite,seuil_alerte,image,garantie,statut) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", bind); req.flash('success','Produit ajouté !'); }
  res.redirect('/admin/produits');
};

exports.deleteProduit = async (req, res) => {
  await db.execute('DELETE FROM produits WHERE id_produit=?',[req.params.id]);
  req.flash('success','Produit supprimé.'); res.redirect('/admin/produits');
};

// ── CRUD Catégories ───────────────────────────────────────────
exports.categories = async (req, res) => {
  const [rows] = await db.execute("SELECT c.*,(SELECT COUNT(*) FROM sous_categories WHERE id_categorie=c.id_categorie) nb_sc,(SELECT COUNT(*) FROM produits p JOIN sous_categories sc ON p.id_sous_categorie=sc.id_sous_categorie WHERE sc.id_categorie=c.id_categorie) nb_prod FROM categories c ORDER BY c.nom");
  let edit=null; if(req.query.edit){const[[e]]=await db.execute('SELECT * FROM categories WHERE id_categorie=?',[req.query.edit]);edit=e||null;}
  res.render('admin/categories',{title:'Catégories',rows,edit,page:'categories',stats:await getStats()});
};
exports.saveCategorie = async (req,res)=>{
  const {id,nom}=req.body;
  if(id) await db.execute('UPDATE categories SET nom=? WHERE id_categorie=?',[nom,id]);
  else   await db.execute('INSERT INTO categories(nom) VALUES(?)',[nom]);
  req.flash('success','Catégorie enregistrée.'); res.redirect('/admin/categories');
};
exports.deleteCategorie = async (req,res)=>{
  try{ await db.execute('DELETE FROM categories WHERE id_categorie=?',[req.params.id]); req.flash('success','Supprimée.');}
  catch{ req.flash('error','Impossible : produits liés.'); }
  res.redirect('/admin/categories');
};

// ── CRUD Marques ──────────────────────────────────────────────
exports.marques = async (req, res) => {
  const q=req.query.q||''; const pg=parseInt(req.query.pg)||1; const pp=15;
  const p2=q?[`%${q}%`]:[];
  const w=q?'WHERE nom LIKE ?':'';
  const sql=`SELECT m.*,(SELECT COUNT(*) FROM produits WHERE id_marque=m.id_marque) nb_produits FROM marques m ${w} ORDER BY nom`;
  const [[{total}]]=await db.execute(`SELECT COUNT(*) total FROM (${sql}) t`,p2);
  const [rows]=await db.execute(`${sql} LIMIT ${pp} OFFSET ${(pg-1)*pp}`,p2);
  let edit=null; if(req.query.edit){const[[e]]=await db.execute('SELECT * FROM marques WHERE id_marque=?',[req.query.edit]);edit=e||null;}
  res.render('admin/marques',{title:'Marques',rows,total,pages:Math.ceil(total/pp),pg,q,edit,page:'marques',stats:await getStats()});
};
exports.saveMarque=async(req,res)=>{const{id,nom,pays}=req.body;if(id)await db.execute('UPDATE marques SET nom=?,pays_origine=? WHERE id_marque=?',[nom,pays||'',id]);else await db.execute('INSERT INTO marques(nom,pays_origine) VALUES(?,?)',[nom,pays||'']);req.flash('success','Marque enregistrée.');res.redirect('/admin/marques');};
exports.deleteMarque=async(req,res)=>{try{await db.execute('DELETE FROM marques WHERE id_marque=?',[req.params.id]);req.flash('success','Supprimée.');}catch{req.flash('error','Impossible.');}res.redirect('/admin/marques');};

// ── CRUD Commandes ────────────────────────────────────────────
exports.commandes = async (req, res) => {
  const sf=req.query.statut||''; const pg=parseInt(req.query.pg)||1; const pp=15;
  const p2=sf?[sf]:[];
  const w=sf?'WHERE c.statut=?':'';
  const sql=`SELECT c.*,u.nom,u.prenom,u.email FROM commandes c LEFT JOIN users u ON c.id_user=u.id_user ${w} ORDER BY c.date_commande DESC`;
  const [[{total}]]=await db.execute(`SELECT COUNT(*) total FROM (${sql}) t`,p2);
  const [rows]=await db.execute(`${sql} LIMIT ${pp} OFFSET ${(pg-1)*pp}`,p2);
  let detail=null, detailItems=[];
  if(req.query.detail){
    const[[d]]=await db.execute('SELECT c.*,u.nom,u.prenom,u.email,u.telephone FROM commandes c LEFT JOIN users u ON c.id_user=u.id_user WHERE c.id_commande=?',[req.query.detail]);
    detail=d||null;
    if(detail){const[di]=await db.execute('SELECT dc.*,p.nom,p.image FROM details_commandes dc LEFT JOIN produits p ON dc.id_produit=p.id_produit WHERE dc.id_commande=?',[detail.id_commande]);detailItems=di;}
  }
  res.render('admin/commandes',{title:'Commandes',rows,total,pages:Math.ceil(total/pp),pg,statut_f:sf,detail,detailItems,page:'commandes',stats:await getStats()});
};
exports.updateStatut=async(req,res)=>{await db.execute('UPDATE commandes SET statut=? WHERE id_commande=?',[req.body.statut,req.body.id]);req.flash('success','Statut mis à jour.');res.redirect('/admin/commandes');};

// ── CRUD Clients ──────────────────────────────────────────────
exports.clients = async (req, res) => {
  const q=req.query.q||''; const sf=req.query.statut||''; const pg=parseInt(req.query.pg)||1; const pp=15;
  let sql="SELECT u.*,r.nom AS role,(SELECT COUNT(*) FROM commandes WHERE id_user=u.id_user) nb_cmd FROM users u JOIN roles r ON u.id_role=r.id_role WHERE r.nom='Client'";
  const p2=[];
  if(q){sql+=' AND (u.nom LIKE ? OR u.prenom LIKE ? OR u.email LIKE ?)';p2.push(`%${q}%`,`%${q}%`,`%${q}%`);}
  if(sf){sql+=' AND u.statut=?';p2.push(sf);}
  sql+=' ORDER BY u.date_creation DESC';
  const [[{total}]]=await db.execute(`SELECT COUNT(*) total FROM (${sql}) t`,p2);
  const [rows]=await db.execute(`${sql} LIMIT ${pp} OFFSET ${(pg-1)*pp}`,p2);
  res.render('admin/clients',{title:'Clients',rows,total,pages:Math.ceil(total/pp),pg,q,statut_f:sf,page:'clients',stats:await getStats()});
};
exports.toggleClient=async(req,res)=>{const[[u]]=await db.execute('SELECT statut FROM users WHERE id_user=?',[req.params.id]);await db.execute('UPDATE users SET statut=? WHERE id_user=?',[u.statut==='Actif'?'Inactif':'Actif',req.params.id]);req.flash('success','Statut mis à jour.');res.redirect('/admin/clients');};
exports.deleteClient=async(req,res)=>{try{await db.execute('DELETE FROM users WHERE id_user=?',[req.params.id]);req.flash('success','Client supprimé.');}catch{req.flash('error','Impossible.');}res.redirect('/admin/clients');};

// ── Stocks, Feedbacks, Messages, Campagnes, Rapports ─────────
exports.stocks = async (req,res)=>{
  const sf=req.query.alerte||'';
  const w=sf==='bas'?'WHERE p.quantite<=p.seuil_alerte':sf==='rupture'?'WHERE p.quantite=0':'';
  const [rows]=await db.execute(`SELECT p.*,m.nom AS marque FROM produits p LEFT JOIN marques m ON p.id_marque=m.id_marque ${w} ORDER BY p.quantite ASC`);
  res.render('admin/stocks',{title:'Stocks',rows,alerte_f:sf,page:'stocks',stats:await getStats()});
};

exports.feedbacks=async(req,res)=>{
  const sf=req.query.statut||''; const sn=parseInt(req.query.note)||0;
  const pg=parseInt(req.query.pg)||1; const pp=15;
  let sql="SELECT f.*,u.prenom,u.nom AS nom_user FROM feedbacks f LEFT JOIN users u ON f.id_user=u.id_user WHERE 1";
  const p2=[];
  if(sf){sql+=' AND f.statut=?';p2.push(sf);} if(sn){sql+=' AND f.note=?';p2.push(sn);}
  sql+=' ORDER BY f.date_feedback DESC';
  const [[{total}]]=await db.execute(`SELECT COUNT(*) total FROM (${sql}) t`,p2);
  const [rows]=await db.execute(`${sql} LIMIT ${pp} OFFSET ${(pg-1)*pp}`,p2);
  res.render('admin/feedbacks',{title:'Feedbacks',rows,total,pages:Math.ceil(total/pp),pg,statut_f:sf,note_f:sn,page:'feedbacks',stats:await getStats()});
};
exports.updateFeedback=async(req,res)=>{await db.execute('UPDATE feedbacks SET statut=? WHERE id_feedback=?',[req.body.statut,req.body.id]);req.flash('success','Mis à jour.');res.redirect('/admin/feedbacks');};
exports.deleteFeedback=async(req,res)=>{await db.execute('DELETE FROM feedbacks WHERE id_feedback=?',[req.params.id]);req.flash('success','Supprimé.');res.redirect('/admin/feedbacks');};

exports.messages=async(req,res)=>{
  const sf=req.query.statut||''; const pg=parseInt(req.query.pg)||1; const pp=15;
  let rows=[],total=0,pages=1;
  try{
    const w=sf?'WHERE statut=?':''; const p2=sf?[sf]:[];
    const sql=`SELECT * FROM messages_contact ${w} ORDER BY date_envoi DESC`;
    const[[{t}]]=await db.execute(`SELECT COUNT(*) t FROM (${sql}) x`,p2);
    total=t||0; pages=Math.ceil(total/pp)||1;
    [rows]=await db.execute(`${sql} LIMIT ${pp} OFFSET ${(pg-1)*pp}`,p2);
  }catch{}
  res.render('admin/messages',{title:'Messages',rows,total,pages,pg,statut_f:sf,page:'messages',stats:await getStats()});
};
exports.updateMessage=async(req,res)=>{try{await db.execute('UPDATE messages_contact SET statut=? WHERE id_contact=?',[req.body.statut,req.body.id]);}catch{}req.flash('success','Mis à jour.');res.redirect('/admin/messages');};

exports.campagnes=async(req,res)=>{
  let rows=[],total=0,pages=1; const pg=parseInt(req.query.pg)||1; const pp=15;
  try{const[[{t}]]=await db.execute('SELECT COUNT(*) t FROM campagnes');total=t||0;pages=Math.ceil(total/pp)||1;[rows]=await db.execute('SELECT * FROM campagnes ORDER BY id_campagne DESC LIMIT ? OFFSET ?',[pp,(pg-1)*pp]);}catch{}
  let edit=null;if(req.query.edit){try{const[[e]]=await db.execute('SELECT * FROM campagnes WHERE id_campagne=?',[req.query.edit]);edit=e||null;}catch{}}
  res.render('admin/campagnes',{title:'Campagnes',rows,total,pages,pg,edit,page:'campagnes',stats:await getStats()});
};
exports.saveCampagne=async(req,res)=>{
  const{id,nom,canal,contenu,date_envoi,statut}=req.body;
  const bind=[nom,canal||'Email',contenu||'',date_envoi||null,statut||'Brouillon'];
  if(id)await db.execute('UPDATE campagnes SET nom=?,canal=?,contenu=?,date_envoi=?,statut=? WHERE id_campagne=?',[...bind,id]);
  else  await db.execute('INSERT INTO campagnes(nom,canal,contenu,date_envoi,statut) VALUES(?,?,?,?,?)',bind);
  req.flash('success','Campagne enregistrée.');res.redirect('/admin/campagnes');
};
exports.deleteCampagne=async(req,res)=>{await db.execute('DELETE FROM campagnes WHERE id_campagne=?',[req.params.id]);req.flash('success','Supprimée.');res.redirect('/admin/campagnes');};

exports.rapports=async(req,res)=>{
  const jours=parseInt(req.query.jours)||30;
  const [ventes]=await db.execute(`SELECT DATE(date_commande) jour,COUNT(*) nb,SUM(montant) total FROM commandes WHERE date_commande>=NOW()-INTERVAL ? DAY AND statut!='Annulée' GROUP BY jour ORDER BY jour DESC`,[jours]);
  const [top]=await db.execute("SELECT p.nom,SUM(dc.quantite) qte,SUM(dc.quantite*dc.prix) ca FROM details_commandes dc JOIN produits p ON dc.id_produit=p.id_produit JOIN commandes c ON dc.id_commande=c.id_commande WHERE c.statut!='Annulée' GROUP BY dc.id_produit ORDER BY qte DESC LIMIT 10");
  const [cat_top]=await db.execute("SELECT cat.nom,SUM(dc.quantite*dc.prix) ca FROM details_commandes dc JOIN produits p ON dc.id_produit=p.id_produit JOIN sous_categories sc ON p.id_sous_categorie=sc.id_sous_categorie JOIN categories cat ON sc.id_categorie=cat.id_categorie JOIN commandes c ON dc.id_commande=c.id_commande WHERE c.statut!='Annulée' GROUP BY cat.id_categorie ORDER BY ca DESC LIMIT 5");
  res.render('admin/rapports',{title:'Rapports',ventes,top,cat_top,jours,page:'rapports',stats:await getStats()});
};

exports.journaux=async(req,res)=>{
  const pg=parseInt(req.query.pg)||1;const pp=20;
  let rows=[],total=0;
  try{const[[{t}]]=await db.execute('SELECT COUNT(*) t FROM journal_activites');total=t||0;[rows]=await db.execute('SELECT j.*,u.nom,u.prenom FROM journal_activites j LEFT JOIN users u ON j.id_user=u.id_user ORDER BY j.date_action DESC LIMIT ? OFFSET ?',[pp,(pg-1)*pp]);}catch{}
  res.render('admin/journaux',{title:'Journaux',rows,total,pages:Math.ceil(total/pp)||1,pg,page:'journaux',stats:await getStats()});
};

exports.chat=async(req,res)=>{
  const pg=parseInt(req.query.pg)||1;const pp=20;
  const[[{t}]]=await db.execute('SELECT COUNT(*) t FROM chat_messages').catch(()=>[[{t:0}]]);
  const[rows]=await db.execute('SELECT cm.*,u.nom,u.prenom FROM chat_messages cm LEFT JOIN users u ON cm.id_user=u.id_user ORDER BY cm.date_envoi DESC LIMIT ? OFFSET ?',[pp,(pg-1)*pp]).catch(()=>[[]]);
  res.render('admin/chat',{title:'Chat NEX',rows,total:t,pages:Math.ceil(t/pp)||1,pg,page:'chat',stats:await getStats()});
};

// ── API IA (AJAX) ─────────────────────────────────────────────
exports.apiChat = async (req, res) => {
  const chatbot = require('../services/chatbot.service');
  const { message, session_id } = req.body;
  if (!message) return res.json({ reply:'Message vide.' });
  const sessionId = session_id || req.sessionID || 'anonymous';
  const uid       = req.session.user?.id || null;
  try {
    const reply = await chatbot.reply(message, sessionId, uid);
    res.json({ reply, status:'ok' });
  } catch {
    res.json({ reply: chatbot.demoReply(message), status:'demo' });
  }
};

exports.apiPublicites = async (req, res) => {
  const uid = req.session.user?.id;
  if (!uid) return res.json({ pubs:[], personnal:false });
  const pubs = await agents.publicites.genererPubUtilisateur(uid);
  res.json({ pubs, personnal:true });
};

exports.apiIA = async (req, res) => {
  const { action, id_campagne, id_user, jours } = req.body;
  try {
    switch (action) {

      case 'ping':
        return res.json({
          ok: true,
          status: 'ok',
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          groq: !!(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'VOTRE_CLE_GROQ_ICI'),
          env: process.env.NODE_ENV || 'development',
        });

      case 'generer_campagne': {
        const [[camp]] = await db.execute('SELECT * FROM campagnes WHERE id_campagne=?',[id_campagne||0]).catch(()=>[[null]]);
        if (!camp) return res.json({ error:'Campagne introuvable' });
        const generated = await agents.campagneIA.generer({ nom:camp.nom, canal:camp.canal||'Email', segment:camp.segment||'', idUser:camp.id_user_cible||null });
        await db.execute('UPDATE campagnes SET titre_ia=?,contenu=?,contenu_email=?,contenu_whatsapp=?,contenu_facebook=?,appel_action=? WHERE id_campagne=?',
          [generated.titre||camp.nom, generated.contenu||'', generated.email||'', generated.whatsapp||'', generated.facebook||'', generated.appel_action||'', id_campagne]).catch(()=>{});
        return res.json({ ok:true, msg:'Campagne générée par NEX IA !', data:generated });
      }

      case 'envoyer_campagne':
        return res.json(await agents.envoi.envoyerCampagne(parseInt(id_campagne)));

      // Analyser UN client spécifique
      case 'analyser_user': {
        if (!id_user) return res.json({ error:'id_user requis' });
        const result = await agents.comportemental.analyserUtilisateur(parseInt(id_user));
        // Sauvegarder le profil complet
        try {
          await db.execute(`
            INSERT INTO analyses_comportementales
              (id_user, score_engagement, score_fidelite, categories_preferees, panier_moyen, nb_commandes, ia_analyse, updated_at)
            VALUES (?,?,?,?,?,?,?,NOW())
            ON DUPLICATE KEY UPDATE
              score_engagement=VALUES(score_engagement),
              score_fidelite=VALUES(score_fidelite),
              categories_preferees=VALUES(categories_preferees),
              panier_moyen=VALUES(panier_moyen),
              nb_commandes=VALUES(nb_commandes),
              ia_analyse=VALUES(ia_analyse),
              updated_at=NOW()
          `, [
            id_user,
            result.score_engagement||0,
            result.score_fidelite||0,
            JSON.stringify(result.categories_preferees||[]),
            result.panier_moyen||0,
            result.nb_commandes||0,
            JSON.stringify(result.ia||{}),
          ]);
        } catch(e) { logger.warn('Save analyse_user:'+e.message); }
        return res.json({ ok:true, msg:`Analyse de l'utilisateur ${id_user} terminée !`, data:result });
      }

      // Analyser TOUS les clients
      case 'analyser_tous': {
        const [users] = await db.execute(`
          SELECT u.id_user, u.prenom, u.nom
          FROM users u JOIN roles r ON u.id_role=r.id_role
          WHERE r.nom='Client' AND u.statut='Actif'
        `);
        if (!users.length) return res.json({ ok:false, msg:'Aucun client actif trouvé.' });

        let nb_ok = 0, nb_err = 0;
        const resultats = [];

        for (const u of users) {
          try {
            const result = await agents.comportemental.analyserUtilisateur(u.id_user);
            await db.execute(`
              INSERT INTO analyses_comportementales
                (id_user, score_engagement, score_fidelite, categories_preferees, panier_moyen, nb_commandes, ia_analyse, updated_at)
              VALUES (?,?,?,?,?,?,?,NOW())
              ON DUPLICATE KEY UPDATE
                score_engagement=VALUES(score_engagement),
                score_fidelite=VALUES(score_fidelite),
                categories_preferees=VALUES(categories_preferees),
                panier_moyen=VALUES(panier_moyen),
                nb_commandes=VALUES(nb_commandes),
                ia_analyse=VALUES(ia_analyse),
                updated_at=NOW()
            `, [
              u.id_user,
              result.score_engagement||0,
              result.score_fidelite||0,
              JSON.stringify(result.categories_preferees||[]),
              result.panier_moyen||0,
              result.nb_commandes||0,
              JSON.stringify(result.ia||{}),
            ]);
            resultats.push({ id_user:u.id_user, nom:`${u.prenom} ${u.nom}`, statut:'ok' });
            nb_ok++;
          } catch(e) {
            resultats.push({ id_user:u.id_user, nom:`${u.prenom} ${u.nom}`, statut:'erreur', detail:e.message });
            nb_err++;
          }
        }

        // Log
        await db.execute(
          "INSERT INTO log_analyses_ia(agent,action,statut,detail) VALUES('AgentComportemental','analyser_tous','succès',?)",
          [JSON.stringify({ nb_ok, nb_err })]
        ).catch(()=>{});

        return res.json({
          ok: true,
          msg: `✓ ${nb_ok} client(s) analysé(s) avec succès${nb_err>0?`, ${nb_err} erreur(s)`:''}. Rechargez la page pour voir les résultats.`,
          nb_ok, nb_err, resultats
        });
      }

      case 'rapport_ventes':
        return res.json(await agents.ventes.rapportComplet(parseInt(jours)||30));

      case 'stocks':
        return res.json(await agents.stock.analyser());

      case 'previsions':
        return res.json(await agents.prevision.prevoir());

      case 'segments':
        return res.json({ campagnes: await agents.campagneIA.genererSegments() });

      default:
        return res.json({ error:`Action "${action}" inconnue. Actions disponibles : analyser_user, analyser_tous, rapport_ventes, stocks, previsions, segments, generer_campagne, envoyer_campagne` });
    }
  } catch (err) {
    logger.error('API IA:', err);
    res.status(500).json({ error: err.message });
  }
};

// ── CRUD Fournisseurs ─────────────────────────────────────────
exports.fournisseurs = async (req, res) => {
  const q=req.query.q||''; const pg=parseInt(req.query.pg)||1; const pp=15;
  const p2=q?[`%${q}%`,`%${q}%`]:[];
  const w=q?'WHERE f.nom LIKE ? OR f.pays LIKE ?':'';
  const sql=`SELECT f.*,(SELECT COUNT(*) FROM produits WHERE id_fournisseur=f.id_fournisseur) nb_produits FROM fournisseurs f ${w} ORDER BY f.nom`;
  let rows=[],total=0,pages=1;
  try {
    const [[{t}]]=await db.execute(`SELECT COUNT(*) t FROM (${sql}) x`,p2);
    total=t||0; pages=Math.ceil(total/pp)||1;
    [rows]=await db.execute(`${sql} LIMIT ${pp} OFFSET ${(pg-1)*pp}`,p2);
  } catch(e) { logger.warn('Fournisseurs:'+e.message); }
  let edit=null;
  if(req.query.edit){try{const[[e]]=await db.execute('SELECT * FROM fournisseurs WHERE id_fournisseur=?',[req.query.edit]);edit=e||null;}catch{}}
  res.render('admin/fournisseurs',{title:'Fournisseurs',rows,total,pages,pg,q,edit,page:'fournisseurs',stats:await getStats()});
};
exports.saveFournisseur=async(req,res)=>{
  const{id,nom,email,telephone,adresse,pays}=req.body;
  const bind=[nom,email||'',telephone||'',adresse||'',pays||''];
  try{
    if(id) await db.execute('UPDATE fournisseurs SET nom=?,email=?,telephone=?,adresse=?,pays=? WHERE id_fournisseur=?',[...bind,id]);
    else   await db.execute('INSERT INTO fournisseurs(nom,email,telephone,adresse,pays) VALUES(?,?,?,?,?)',bind);
    req.flash('success','Fournisseur enregistré.');
  }catch(e){req.flash('error',e.message);}
  res.redirect('/admin/fournisseurs');
};
exports.deleteFournisseur=async(req,res)=>{
  try{await db.execute('DELETE FROM fournisseurs WHERE id_fournisseur=?',[req.params.id]);req.flash('success','Supprimé.');}
  catch{req.flash('error','Impossible : produits liés.');}
  res.redirect('/admin/fournisseurs');
};

// ── CRUD Sous-catégories ─────────────────────────────────────
exports.sousCats = async (req, res) => {
  const q=req.query.q||''; const pg=parseInt(req.query.pg)||1; const pp=15;
  const p2=q?[`%${q}%`,`%${q}%`]:[];
  const w=q?'WHERE sc.nom LIKE ? OR c.nom LIKE ?':'';
  const sql=`SELECT sc.*,c.nom AS categorie FROM sous_categories sc LEFT JOIN categories c ON sc.id_categorie=c.id_categorie ${w} ORDER BY c.nom,sc.nom`;
  let rows=[],total=0,pages=1;
  try {
    const[[{t}]]=await db.execute(`SELECT COUNT(*) t FROM (${sql}) x`,p2);
    total=t||0;pages=Math.ceil(total/pp)||1;
    [rows]=await db.execute(`${sql} LIMIT ${pp} OFFSET ${(pg-1)*pp}`,p2);
  }catch(e){logger.warn('SousCats:'+e.message);}
  const [categories]=await db.execute('SELECT * FROM categories ORDER BY nom').catch(()=>[[],null]);
  let edit=null;
  if(req.query.edit){try{const[[e]]=await db.execute('SELECT * FROM sous_categories WHERE id_sous_categorie=?',[req.query.edit]);edit=e||null;}catch{}}
  res.render('admin/sous_categories',{title:'Sous-catégories',rows,total,pages,pg,q,edit,categories,page:'sous_categories',stats:await getStats()});
};
exports.saveSousCat=async(req,res)=>{
  const{id,nom,id_categorie}=req.body;
  try{
    if(id) await db.execute('UPDATE sous_categories SET nom=?,id_categorie=? WHERE id_sous_categorie=?',[nom,id_categorie,id]);
    else   await db.execute('INSERT INTO sous_categories(nom,id_categorie) VALUES(?,?)',[nom,id_categorie]);
    req.flash('success','Sous-catégorie enregistrée.');
  }catch(e){req.flash('error',e.message);}
  res.redirect('/admin/sous_categories');
};
exports.deleteSousCat=async(req,res)=>{
  try{await db.execute('DELETE FROM sous_categories WHERE id_sous_categorie=?',[req.params.id]);req.flash('success','Supprimée.');}
  catch{req.flash('error','Impossible.');}
  res.redirect('/admin/sous_categories');
};

// ── Marketing IA ─────────────────────────────────────────────
exports.marketingIA = async (req, res) => {
  let campagnes=[], clients=[], stats_mkt={};
  try {
    [campagnes]=await db.execute('SELECT * FROM campagnes ORDER BY id_campagne DESC LIMIT 20');
    const [[{total_clients}]]=await db.execute("SELECT COUNT(*) total_clients FROM users u JOIN roles r ON u.id_role=r.id_role WHERE r.nom='Client'");
    const [[{camp_actives}]]=await db.execute("SELECT COUNT(*) camp_actives FROM campagnes WHERE statut IN ('En cours','Planifiée')").catch(()=>[[{camp_actives:0}]]);
    const [[{envoyes}]]=await db.execute("SELECT COUNT(*) envoyes FROM campagnes WHERE statut='Envoyée'").catch(()=>[[{envoyes:0}]]);
    stats_mkt={total_clients,camp_actives,envoyes};
  } catch(e){logger.warn('MarketingIA:'+e.message);}
  res.render('admin/marketing',{title:'Marketing IA',campagnes,stats_mkt,page:'marketing',stats:await getStats()});
};

// ── Agents IA — page moniteur + générateur messages ──────────
exports.agentsIA = async (req, res) => {
  let profils = [], logs = [], clients = [];

  // Tous les clients actifs (pour le dropdown)
  try {
    [clients] = await db.execute(`
      SELECT u.id_user, u.prenom, u.nom, u.email,
             a.score_engagement, a.score_fidelite,
             a.categories_preferees, a.panier_moyen
      FROM users u
      JOIN roles r ON u.id_role = r.id_role
      LEFT JOIN analyses_comportementales a ON u.id_user = a.id_user
      WHERE r.nom = 'Client' AND u.statut = 'Actif'
      ORDER BY u.prenom ASC
    `);
  } catch(e) { logger.warn('agentsIA clients: ' + e.message); }

  // Profils IA existants (tableau récapitulatif)
  try {
    [profils] = await db.execute(`
      SELECT a.*, u.prenom, u.nom, u.email
      FROM analyses_comportementales a
      LEFT JOIN users u ON a.id_user = u.id_user
      ORDER BY a.updated_at DESC LIMIT 20
    `);
  } catch(e) { logger.warn('agentsIA profils: ' + e.message); }

  // Logs IA récents
  try {
    [logs] = await db.execute(`
      SELECT * FROM log_analyses_ia ORDER BY id DESC LIMIT 30
    `);
  } catch(e) { logger.warn('agentsIA logs: ' + e.message); }

  res.render('admin/agents', {
    title: 'Agents IA', profils, logs, clients,
    page: 'agents', stats: await getStats()
  });
};

// ── API : Générer message personnalisé pour un utilisateur ────
exports.apiMessagePersonnalise = async (req, res) => {
  const { id_user, canal = 'Email', ton = 'commercial' } = req.body;
  if (!id_user) return res.status(400).json({ error: 'id_user requis' });
  try {
    // 1. Récupérer le profil
    const [[profil]] = await db.execute(`
      SELECT a.*,u.prenom,u.nom,u.email
      FROM analyses_comportementales a
      LEFT JOIN users u ON a.id_user=u.id_user
      WHERE a.id_user=?
    `, [id_user]).catch(() => [[null]]);

    // 2. Récupérer les achats récents
    const [achats] = await db.execute(`
      SELECT p.nom, dc.quantite, dc.prix
      FROM details_commandes dc
      JOIN commandes c ON dc.id_commande=c.id_commande
      JOIN produits p ON dc.id_produit=p.id_produit
      WHERE c.id_user=? AND c.statut!='Annulée'
      ORDER BY c.date_commande DESC LIMIT 5
    `, [id_user]).catch(() => [[]]);

    // 3. Récupérer wishlist
    const [wishlist] = await db.execute(`
      SELECT p.nom FROM wishlist w JOIN produits p ON w.id_produit=p.id_produit
      WHERE w.id_user=? LIMIT 5
    `, [id_user]).catch(() => [[]]);

    const prenom = profil?.prenom || 'Client';
    const cats   = profil?.categories_preferees ? JSON.parse(profil.categories_preferees).join(', ') : 'Non défini';
    const budget = profil?.panier_moyen ? `${Math.round(profil.panier_moyen).toLocaleString()} HTG` : 'Non défini';
    const achatsStr = achats.map(a => a.nom).join(', ') || 'Aucun achat récent';
    const wishStr   = wishlist.map(w => w.nom).join(', ') || 'Vide';

    const prompt = `Tu es un expert en marketing digital pour Nexio S.A., boutique de matériel informatique à Port-au-Prince, Haïti.

Génère un message marketing ULTRA PERSONNALISÉ pour ce client :

Prénom : ${prenom}
Catégories préférées : ${cats}
Budget moyen : ${budget}
Achats récents : ${achatsStr}
Liste de souhaits : ${wishStr}
Score engagement : ${profil?.score_engagement || 0}/100
Score fidélité : ${profil?.score_fidelite || 0}/100

Canal de communication : ${canal}
Ton souhaité : ${ton}

Instructions :
- Commence par saluer chaleureusement par prénom
- Mentionne ses intérêts spécifiques (catégories qu'il aime)
- Propose une offre pertinente liée à ses achats ou wishlist
- Pour Email : structure avec sujet, intro, corps, CTA
- Pour WhatsApp : court, direct, max 3 lignes + emoji
- Pour Facebook : accrocheur, visuel, appel à l'action fort
- Ajoute un code promo fictif adapté à son profil
- Termine par l'identité Nexio S.A.

Réponds UNIQUEMENT en JSON valide :
{
  "sujet": "Ligne d'objet (pour email)",
  "message": "Le message complet formaté",
  "cta": "Texte du bouton d'action",
  "code_promo": "Code promo suggéré",
  "raison_personnalisation": "Pourquoi ce message est adapté"
}`;

    const groq = require('../services/groq.service');
    const result = await groq.analyze({ id_user, profil, canal }, prompt);

    // Log
    try {
      await db.execute(
        "INSERT INTO log_analyses_ia(agent,action,statut,detail) VALUES('AgentMessage','message_personnalise','succès',?)",
        [JSON.stringify({ id_user, canal })]
      );
    } catch {}

    res.json({ ok: true, user: { prenom, id_user }, message: result, canal });
  } catch (err) {
    logger.error('apiMessagePersonnalise:', err);
    res.status(500).json({ error: err.message });
  }
};

// ── Campagnes v2 — avec clients pour ciblage IA ───────────────
exports.campagnesV2 = async (req, res) => {
  const pg = parseInt(req.query.pg)||1; const pp = 15;
  let rows=[], total=0, pages=1, clients=[], edit=null;
  try {
    const[[{t}]] = await db.execute('SELECT COUNT(*) t FROM campagnes');
    total=t||0; pages=Math.ceil(total/pp)||1;
    [rows] = await db.execute(`
      SELECT c.*, u.prenom, u.nom AS nom_client
      FROM campagnes c
      LEFT JOIN users u ON c.id_user_cible=u.id_user
      ORDER BY c.id_campagne DESC LIMIT ? OFFSET ?
    `, [pp,(pg-1)*pp]);
  } catch(e) { logger.warn('CampagnesV2:'+e.message); }

  try {
    [clients] = await db.execute(`
      SELECT u.id_user, u.prenom, u.nom, u.email,
             a.score_engagement, a.score_fidelite, a.categories_preferees
      FROM users u
      JOIN roles r ON u.id_role=r.id_role
      LEFT JOIN analyses_comportementales a ON u.id_user=a.id_user
      WHERE r.nom='Client' AND u.statut='Actif'
      ORDER BY a.score_engagement DESC
    `);
  } catch(e) { logger.warn('Clients pour campagnes:'+e.message); }

  if (req.query.edit) {
    try { const[[e]]=await db.execute('SELECT * FROM campagnes WHERE id_campagne=?',[req.query.edit]); edit=e||null; } catch {}
  }

  res.render('admin/campagnes', {
    title:'Campagnes IA', rows, total, pages, pg,
    edit, clients, page:'campagnes', stats: await getStats()
  });
};

// ── API : envoyer campagne individuelle ou segment ─────────────
exports.apiEnvoiCampagne = async (req, res) => {
  const { id_campagne, canal, cible } = req.body; // cible = 'individuel'|'segment'|'tous'
  try {
    const [[camp]] = await db.execute('SELECT * FROM campagnes WHERE id_campagne=?',[id_campagne]);
    if (!camp) return res.json({ error:'Campagne introuvable' });

    // Récupérer destinataires selon cible
    let destinataires = [];
    if (camp.id_user_cible) {
      const [[u]] = await db.execute('SELECT id_user,prenom,nom,email,telephone FROM users WHERE id_user=?',[camp.id_user_cible]);
      if (u) destinataires = [u];
    } else if (camp.segment) {
      const [us] = await db.execute(`
        SELECT u.id_user,u.prenom,u.nom,u.email,u.telephone
        FROM users u JOIN roles r ON u.id_role=r.id_role
        WHERE r.nom='Client' AND u.statut='Actif' LIMIT 100
      `);
      destinataires = us;
    } else {
      const [us] = await db.execute(`
        SELECT u.id_user,u.prenom,u.nom,u.email,u.telephone
        FROM users u JOIN roles r ON u.id_role=r.id_role
        WHERE r.nom='Client' AND u.statut='Actif' LIMIT 200
      `);
      destinataires = us;
    }

    // Enregistrer envoi et marquer comme envoyée
    await db.execute(
      'UPDATE campagnes SET statut=?,date_envoi=NOW(),nb_destins=?,nb_envoyes=? WHERE id_campagne=?',
      ['Envoyée', destinataires.length, destinataires.length, id_campagne]
    ).catch(()=>{});

    // Log chaque envoi simulé
    for (const d of destinataires) {
      await db.execute(
        'INSERT INTO messages_marketing(id_campagne,id_user,canal,contenu,statut) VALUES(?,?,?,?,?)',
        [id_campagne, d.id_user, canal||camp.canal||'Email', camp.contenu||camp.titre_ia||'', 'Envoyé']
      ).catch(()=>{});
    }

    res.json({ ok:true, envoyes:destinataires.length, destinataires:destinataires.length, statut:'Envoyée' });
  } catch(e) {
    res.status(500).json({ error:e.message });
  }
};
