# Nexio S.A. — Plateforme E-Commerce Node.js

## Stack
- **Backend** : Node.js 18+ + Express.js
- **Base de données** : MySQL (mysql2/promise)
- **Templates** : EJS
- **IA** : GrokCloud (llama-3.3-70b-versatile)
- **CSS** : Design system custom Mobile First

## Installation locale

```bash
npm install
# Copier .env et remplir les valeurs
cp .env .env.local
# Importer nexio_database.sql dans MySQL
npm start
```

## Déploiement Railway

1. Pusher sur GitHub
2. New Project → Deploy from GitHub
3. Ajouter un service MySQL dans Railway
4. Variables d'environnement dans Railway :

```
PORT=3000
MYSQL_HOST=${{MySQL.MYSQL_HOST}}
MYSQL_PORT=${{MySQL.MYSQL_PORT}}
MYSQL_DATABASE=${{MySQL.MYSQL_DATABASE}}
MYSQL_USER=${{MySQL.MYSQL_USER}}
MYSQL_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
GROQ_API_KEY=gsk_xxxxxxxxxxxx
SESSION_SECRET=votre_secret_long
NODE_ENV=production
APP_URL=https://votre-app.railway.app
```

## Comptes par défaut

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@nexio.com | Admin123! |

## Routes principales

| URL | Description |
|-----|-------------|
| / | Boutique |
| /admin | Tableau de bord |
| /auth/login | Connexion |
| /admin/api/ia | API IA (POST) |
| /api/chat | Chatbot NEX |
| /api/publicites | Pubs personnalisées |

## Actions API IA (POST /admin/api/ia)

```json
{ "action": "generer_campagne", "id_campagne": 1 }
{ "action": "envoyer_campagne", "id_campagne": 1 }
{ "action": "analyser_user",    "id_user": 1 }
{ "action": "rapport_ventes",   "jours": 30 }
{ "action": "stocks" }
{ "action": "previsions" }
{ "action": "segments" }
```
