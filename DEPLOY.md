# 🚀 Guide de Déploiement - Crypto API

Ce guide vous explique comment déployer votre API crypto en public.

## 📋 Options de déploiement

### 1. **Railway (Recommandé - Gratuit)**

**Avantages :**
- ✅ Gratuit (500h/mois)
- ✅ Déploiement automatique depuis GitHub
- ✅ HTTPS inclus
- ✅ Logs en temps réel
- ✅ URL publique automatique

**Étapes :**

1. **Créer un compte Railway**
   - Allez sur [railway.app](https://railway.app)
   - Connectez-vous avec GitHub

2. **Préparer votre code**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Crypto API"
   ```

3. **Créer un repo GitHub**
   - Créez un nouveau repository sur GitHub
   - Poussez votre code :
   ```bash
   git remote add origin https://github.com/VOTRE-USERNAME/crypto-api.git
   git branch -M main
   git push -u origin main
   ```

4. **Déployer sur Railway**
   - Sur Railway, cliquez "New Project"
   - Sélectionnez "Deploy from GitHub repo"
   - Choisissez votre repository
   - Railway détectera automatiquement le `package.json`

5. **Configurer les variables d'environnement**
   - Dans Railway, allez dans l'onglet "Variables"
   - Ajoutez :
     ```
     NODE_ENV=production
     CACHE_TTL=600
     ```

6. **Accéder à votre API**
   - Railway vous donnera une URL comme : `https://votre-app.railway.app`
   - Testez : `https://votre-app.railway.app/api/all-metrics`

---

### 2. **Vercel (Alternative gratuite)**

```bash
npm install -g vercel
vercel
```

### 3. **Heroku (Payant maintenant)**

```bash
git push heroku main
```

---

## 🌐 URLs publiques après déploiement

Une fois déployé, votre API sera accessible via :

```
https://votre-app.railway.app/api/btc-dominance
https://votre-app.railway.app/api/defi-tvl
https://votre-app.railway.app/api/volumes
https://votre-app.railway.app/api/stablecoin-peg
https://votre-app.railway.app/api/eth-staking
https://votre-app.railway.app/api/all-metrics
```

## 📊 Monitoring et maintenance

### Logs
- Railway : Onglet "Logs" dans le dashboard
- Surveillez les erreurs de rate limiting CoinGecko

### Performance
- Cache configuré à 10 minutes en production
- Rate limiting : 100 requêtes/15min par IP

### Coûts
- Railway : Gratuit jusqu'à 500h/mois
- Si vous dépassez : ~$5/mois

## 🔧 Optimisations production

✅ **Déjà configuré :**
- Cache optimisé (10 min en prod vs 5 min en dev)
- Rate limiting activé en production
- CORS configuré pour railway.app
- Timeouts augmentés (15s vs 10s)
- Gestion d'erreurs robuste

## 🚨 Sécurité

### Rate Limiting
- 100 requêtes par IP / 15 minutes
- Protection contre les abus

### CORS
- Configuré pour autoriser railway.app
- Bloque les requêtes non autorisées

### Headers de sécurité
- Helmet.js activé
- Protection XSS, CSRF, etc.

## 📈 Utilisation

### Exemples d'appels
```bash
# Toutes les données
curl https://votre-app.railway.app/api/all-metrics

# BTC Dominance seulement
curl https://votre-app.railway.app/api/btc-dominance

# Santé de l'API
curl https://votre-app.railway.app/api/health
```

### Intégration JavaScript
```javascript
const API_BASE = 'https://votre-app.railway.app/api';

async function getCryptoData() {
  try {
    const response = await fetch(`${API_BASE}/all-metrics`);
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Erreur API:', error);
  }
}
```

## 🔄 Mises à jour

Pour mettre à jour votre API :
1. Modifiez votre code localement
2. Commitez et poussez sur GitHub
3. Railway redéploiera automatiquement

## ❓ Dépannage

**Erreur 502/503 :**
- Vérifiez les logs Railway
- Problème probable : timeout CoinGecko

**Rate limiting :**
- Attendez 15 minutes
- Ou augmentez le cache TTL

**Dépassement quota Railway :**
- Surveillez l'utilisation dans le dashboard
- Optimisez le cache pour réduire les requêtes
