const bcrypt = require('bcryptjs');
const db     = require('../config/db');
const logger = require('../config/logger');

exports.showLogin = (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('auth/login', { title: 'Connexion — Nexio', err: req.query.err||'' });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.execute(
      `SELECT u.*,r.nom AS role FROM users u JOIN roles r ON u.id_role=r.id_role WHERE u.email=? LIMIT 1`, [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.mot_de_passe))) {
      req.flash('danger', 'Email ou mot de passe incorrect.');
      return res.redirect('/auth/login');
    }
    if (user.statut === 'Inactif') {
      req.flash('danger', 'Compte désactivé. Contactez le support.');
      return res.redirect('/auth/login');
    }
    req.session.userId    = user.id_user;
    req.session.userRole  = user.role;
    req.session.userPrenom= user.prenom;
    req.session.userNom   = user.nom;
    req.session.userEmail = user.email;

    try { await db.execute(`INSERT INTO journal_activites(id_user,action,description,ip_adresse) VALUES(?,?,?,?)`,
      [user.id_user,'connexion',`Connexion de ${user.prenom} ${user.nom}`,req.ip]); } catch {}

    logger.info(`Connexion: ${user.email} (${user.role})`);
    return res.redirect(user.role === 'Administrateur' ? '/admin' : '/');
  } catch(e) {
    logger.error(`Login: ${e.message}`);
    req.flash('danger', 'Erreur serveur.');
    res.redirect('/auth/login');
  }
};

exports.showRegister = (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('auth/register', { title: 'Inscription — Nexio' });
};

exports.register = async (req, res) => {
  const { prenom, nom, email, password, telephone } = req.body;
  try {
    const [exist] = await db.execute(`SELECT id_user FROM users WHERE email=?`, [email]);
    if (exist.length) {
      req.flash('danger', 'Cet email est déjà utilisé.');
      return res.redirect('/auth/register');
    }
    const hash = await bcrypt.hash(password, 12);
    const [roleRow] = await db.execute(`SELECT id_role FROM roles WHERE nom='Client' LIMIT 1`);
    const idRole = roleRow[0]?.id_role || 2;
    await db.execute(
      `INSERT INTO users(prenom,nom,email,mot_de_passe,telephone,id_role,statut) VALUES(?,?,?,?,?,?,'Actif')`,
      [prenom, nom, email, hash, telephone||null, idRole]);
    req.flash('success', 'Compte créé ! Vous pouvez vous connecter.');
    res.redirect('/auth/login');
  } catch(e) {
    logger.error(`Register: ${e.message}`);
    req.flash('danger', 'Erreur lors de l\'inscription.');
    res.redirect('/auth/register');
  }
};

exports.logout = (req, res) => {
  const userId = req.session.userId;
  req.session.destroy(() => {
    if (userId) db.execute(`INSERT INTO journal_activites(id_user,action,description) VALUES(?,?,?)`,
      [userId,'deconnexion','Déconnexion']).catch(()=>{});
    res.redirect('/auth/login');
  });
};
