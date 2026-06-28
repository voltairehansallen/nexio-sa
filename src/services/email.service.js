const nodemailer = require('nodemailer');
const logger     = require('../config/logger');

function getTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

function buildHtml(nom, sujet, contenu, cta = '') {
  const ctaHtml = cta ? `<div style="text-align:center;margin:24px 0"><a href="${process.env.APP_URL||'#'}" style="background:#1D4ED8;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700">${cta}</a></div>` : '';
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#06080F;font-family:Arial,sans-serif">
<table width="100%" style="max-width:600px;margin:20px auto;background:#111827;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.08)">
  <tr><td style="background:linear-gradient(135deg,#0D1F40,#06080F);padding:28px;text-align:center">
    <div style="font-size:22px;font-weight:900;color:#EDF2F7">Nexio<span style="color:#00C8FF">.</span>ht</div>
    <div style="font-size:11px;color:#64748B">Votre partenaire tech à Port-au-Prince</div>
  </td></tr>
  <tr><td style="padding:28px">
    <h2 style="font-size:18px;font-weight:800;color:#00C8FF;margin:0 0 12px">${sujet}</h2>
    <p style="font-size:15px;color:#CBD5E1;margin:0 0 8px">Bonjour ${nom},</p>
    <div style="font-size:14px;color:#94A3B8;line-height:1.7;white-space:pre-line">${contenu}</div>
    ${ctaHtml}
  </td></tr>
  <tr><td style="background:#0D1117;padding:16px;text-align:center">
    <p style="font-size:11px;color:#374151;margin:0">📍 Delmas, Port-au-Prince · 📞 4810-8541 · Lun-Sam 8h-18h</p>
    <p style="font-size:10px;color:#1F2937;margin:6px 0 0">© 2025 Nexio S.A.</p>
  </td></tr>
</table></body></html>`;
}

async function sendEmail({ to, toName, subject, html, text }) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass || user.includes('votre_email')) {
    logger.warn(`Email simulé → ${to}`);
    return { status: 'simulé', to };
  }
  try {
    const t = getTransport();
    await t.sendMail({
      from:    `"${process.env.SMTP_FROM_NAME||'Nexio S.A.'}" <${process.env.SMTP_FROM_EMAIL||user}>`,
      to:      `"${toName}" <${to}>`,
      subject, html, text,
    });
    logger.info(`Email envoyé → ${to}`);
    return { status: 'envoyé', to };
  } catch (err) {
    logger.error(`Email erreur ${to}: ${err.message}`);
    return { status: 'erreur', detail: err.message };
  }
}

module.exports = { sendEmail, buildHtml };
