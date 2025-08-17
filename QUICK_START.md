# 🚀 Démarrage Rapide - Intégration Flare FDC

## ✅ Installation Complète

Votre projet est maintenant configuré avec l'intégration Flare Data Connector (FDC) !

### 1. 📦 Dépendances Installées

✅ **Node.js** : API REST avec Express  
✅ **Python 3** : Modèle de recommandation Aave vs Morpho  
✅ **Ethers.js** : Interaction blockchain Flare  
✅ **Environment virtuel Python** : Isolation des dépendances  

### 2. 🎯 Fonctionnalités Disponibles

- **API CoinGecko** → Métriques crypto en temps réel
- **Modèle Python** → Recommandations intelligentes Aave vs Morpho
- **Flare FDC** → Attestation des données on-chain
- **Smart Contract** → Stockage et vérification des recommandations
- **APIs REST** → Interface complète pour votre application

## 🚀 Démarrage

### Méthode 1 : Script Automatique (Recommandé)

```bash
# Démarre l'API avec l'environnement Python activé
./start-with-python.sh

# Ou en mode développement
./start-with-python.sh dev
```

### Méthode 2 : Manuel

```bash
# 1. Activer l'environnement Python
source venv/bin/activate

# 2. Démarrer l'API
npm start
# ou npm run dev pour le mode développement
```

## 🧪 Tests Rapides

### 1. Test de l'API de Base

```bash
curl http://localhost:3000/
```

### 2. Test du Modèle Python

```bash
curl http://localhost:3000/api/aave-morpho-recommendation
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "suggestion": "AAVE",
    "confidence": 0.87,
    "scores": {
      "aave": 0.87,
      "morpho": 0.43
    },
    "btc_dominance_pct": 57.7,
    "defi_tvl_usd": 157298590902.85
  }
}
```

### 3. Test de l'Intégration Flare

```bash
# Statut du réseau Flare
curl http://localhost:3000/flare/network-status

# Documentation Flare
curl http://localhost:3000/flare/docs
```

## 🌐 Endpoints Principaux

| Endpoint | Description |
|----------|-------------|
| `GET /` | Documentation de l'API |
| `GET /api/aave-morpho-recommendation` | Recommandation Aave vs Morpho |
| `GET /api/all-metrics` | Toutes les métriques crypto |
| `POST /flare/generate-and-submit` | Soumettre au FDC |
| `GET /flare/contract/recommendation` | Récupérer depuis le contrat |

## ⚙️ Configuration Flare (Optionnel)

Pour activer toutes les fonctionnalités Flare, ajoutez à votre `.env` :

```bash
# Copier depuis flare.env.example
FLARE_RPC_URL=https://coston2-api.flare.network/ext/bc/C/rpc
PRIVATE_KEY=your_private_key_here
```

### Obtenir des Tokens de Test

1. Créez un wallet Flare testnet
2. Visitez : https://faucet.flare.network/coston2
3. Ajoutez votre clé privée à `.env`

## 🔄 Workflow Complet

### 1. Génération Simple

```bash
# Générer une recommandation
curl http://localhost:3000/api/aave-morpho-recommendation
```

### 2. Avec Flare FDC

```bash
# Soumettre au FDC pour attestation
curl -X POST http://localhost:3000/flare/generate-and-submit

# Récupérer les données attestées (après 5-10 min)
curl "http://localhost:3000/flare/attested-recommendation?apiUrl=..."
```

### 3. Smart Contract

```bash
# Déployer le contrat (simulation)
node scripts/deploy.js

# Récupérer depuis le contrat
curl http://localhost:3000/flare/contract/recommendation
```

## 🔧 Développement

### Structure des Données

Le modèle génère des recommandations basées sur :

- **BTC Dominance** : Sentiment du marché
- **TVL DeFi** : Santé de l'écosystème DeFi  
- **Volumes CEX/DEX** : Activité on-chain vs centralisée
- **Stablecoin Pegs** : Stabilité du marché

### Logique de Recommandation

- **AAVE** : Favorisé quand le marché est risk-off (haute dominance BTC)
- **MORPHO** : Favorisé quand l'activité on-chain est forte
- **TIE** : Quand les scores sont similaires

### Personnalisation

Modifiez les paramètres dans `model.py` :

```python
CONFIG = {
    "BTC_DOM_LOW": 40.0,     # Seuil risk-on
    "BTC_DOM_HIGH": 60.0,    # Seuil risk-off
    "TVL_MIN": 80e9,         # TVL minimum
    "AAVE_SAFETY_BIAS": 0.05 # Biais conservateur
}
```

## 🚨 Résolution de Problèmes

### Python

```bash
# Si erreur Python
source venv/bin/activate
pip install requests

# Ou recréer l'environnement
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install requests
```

### API CoinGecko

```bash
# Test direct
curl https://api.coingecko.com/api/v3/global
```

### Flare Network

```bash
# Test connexion
curl http://localhost:3000/flare/network-status
```

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3000/api/health
```

### Logs

```bash
# Mode développement avec logs détaillés
NODE_ENV=development npm run dev
```

## 🎯 Prochaines Étapes

1. **Testez l'API** avec vos données
2. **Configurez Flare** pour l'attestation on-chain
3. **Déployez le contrat** smart contract
4. **Intégrez** dans votre application frontend
5. **Monitorez** les recommandations en production

## 🔗 Ressources

- [Guide Complet](./FLARE_INTEGRATION_GUIDE.md)
- [Documentation Flare FDC](https://dev.flare.network/fdc/)
- [Faucet Testnet](https://faucet.flare.network/coston2)
- [Explorer Coston2](https://coston2-explorer.flare.network/)

---

🎉 **Félicitations !** Votre intégration Flare FDC est opérationnelle !

Pour des questions ou du support, consultez la documentation complète ou les logs de l'application.
