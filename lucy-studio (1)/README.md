# Lucy Studio

Accès clients à Lucy 2.5 (fal.ai) avec solde en minutes, révocation immédiate et sortie OBS.

## Installation (VPS Linux, Node 20+)
1. `cp .env.example .env` puis remplir `FAL_KEY`, `ADMIN_PASSWORD`, `SESSION_SECRET` (`openssl rand -hex 32`), `APP_URL`.
2. `npm install && npm run build && npm start`
3. Mettre Caddy ou Nginx devant, en HTTPS (obligatoire pour la caméra).
4. Admin : `/` avec ADMIN_USER / ADMIN_PASSWORD, puis créer les clients.

## Limites à connaître
- **Un seul processus Node** : la signalisation OBS est en mémoire (ne pas déployer sur Vercel / serverless).
- Révocation : refus immédiat des requêtes serveur + plus aucun jeton fal (durée 10 s) + heartbeat 5 s qui coupe le studio.
- Le décompte est fait côté serveur par heartbeat, c'est une approximation de la facturation fal (0,04 $/s).

## À VÉRIFIER avant la mise en production (cherchez `VERIFY`)
- `app/studio/page.js` : attache de la caméra à la connexion Lucy, récupération du flux traité (`attachOut`), noms des champs prompt / image de référence.
- `app/api/fal/realtime-token/route.js` : format exact de `allowed_apps`.
Le code du playground fal du modèle sert de référence.

## Railway
- Uploader le **contenu** du projet à la racine (package.json doit être à la racine du dépôt).
- Ajouter un **Volume** monté sur `/data`, et définir `DB_PATH=/data/data.db` (sans volume, la base est effacée à chaque déploiement).
- Variables : FAL_KEY, ADMIN_USER, ADMIN_PASSWORD, SESSION_SECRET, APP_URL (l'URL https de Railway), DB_PATH.
- Garder **1 seule réplique** (signalisation OBS en mémoire).
