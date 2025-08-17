# Crypto Centralized API

API centralisée pour récupérer des données crypto importantes via l'API CoinGecko.

## 🚀 Fonctionnalités

Cette API récupère et centralise les données suivantes :

- **BTC Dominance** : Pourcentage de dominance du Bitcoin sur le marché crypto
- **TVL DeFi Global** : Total Value Locked dans l'écosystème DeFi
- **Volumes CEX/DEX** : Volumes d'échange 24h sur les exchanges centralisés et décentralisés
- **Peg Stablecoins** : Prix et déviation du peg pour USDT et USDC
- **ETH Staking** : Informations sur le staking Ethereum (données limitées)
- **Recommandations Aave vs Morpho** : Modèle IA pour recommander le meilleur protocole DeFi
- **Intégration Flare FDC** : Attestation des données on-chain via Flare Data Connector

## 📦 Installation

### Prérequis
- Node.js (v14 ou supérieur)
- npm ou yarn

### Étapes d'installation

1. **Cloner ou télécharger le projet**
```bash
cd crypto-api
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
```

4. **Modifier le fichier .env si nécessaire** (optionnel)
```env
PORT=3000
COINGECKO_API_URL=https://api.coingecko.com/api/v3
CACHE_TTL=300
NODE_ENV=development
```

5. **Démarrer l'API**
```bash
# Mode développement (avec rechargement automatique)
npm run dev

# Mode production
npm start
```

L'API sera disponible sur `http://localhost:3000`

## 📋 Endpoints disponibles

### Informations générales
- `GET /` - Documentation de l'API
- `GET /api/health` - Statut de santé de l'API

### Métriques crypto
- `GET /api/btc-dominance` - Dominance Bitcoin
- `GET /api/defi-tvl` - TVL DeFi global
- `GET /api/volumes` - Volumes CEX/DEX 24h
- `GET /api/stablecoin-peg` - Prix USDT/USDC et déviation du peg
- `GET /api/eth-staking` - Informations sur le staking Ethereum
- `GET /api/all-metrics` - Toutes les métriques en une seule requête
- `GET /api/aave-morpho-recommendation` - Recommandation intelligente Aave vs Morpho

### Endpoints Flare Data Connector
- `POST /flare/generate-and-submit` - Soumettre une recommandation au FDC
- `GET /flare/attested-recommendation` - Récupérer les données attestées
- `GET /flare/contract/recommendation` - Recommandation depuis le smart contract
- `GET /flare/docs` - Documentation complète de l'API Flare

## 📖 Exemples d'utilisation

### BTC Dominance
```bash
curl http://localhost:3000/api/btc-dominance
```

Réponse :
```json
{
  "success": true,
  "data": {
    "btc_dominance": 52.34,
    "unit": "%",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### TVL DeFi Global
```bash
curl http://localhost:3000/api/defi-tvl
```

### Volumes CEX/DEX
```bash
curl http://localhost:3000/api/volumes
```

### Peg Stablecoins
```bash
curl http://localhost:3000/api/stablecoin-peg
```

### Toutes les métriques
```bash
curl http://localhost:3000/api/all-metrics
```

### Recommandation Aave vs Morpho
```bash
curl http://localhost:3000/api/aave-morpho-recommendation
```

Réponse :
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

## ⚙️ Configuration

### Variables d'environnement

- `PORT` : Port du serveur (défaut: 3000)
- `COINGECKO_API_URL` : URL de base de l'API CoinGecko
- `CACHE_TTL` : Durée de cache en secondes (défaut: 300 = 5 minutes)
- `NODE_ENV` : Environnement (development/production)
- `FLARE_RPC_URL` : URL RPC pour le réseau Flare (optionnel)
- `PRIVATE_KEY` : Clé privée pour les interactions blockchain (optionnel)

### Cache

L'API utilise un système de cache en mémoire pour :
- Réduire le nombre d'appels à l'API CoinGecko
- Améliorer les performances
- Éviter les limitations de taux (rate limiting)

Le cache par défaut est de 5 minutes, configurable via `CACHE_TTL`.

## 🔧 Structure du projet

```
crypto-api/
├── src/
│   ├── config/config.js          # Configuration
│   ├── services/coingeckoService.js  # Service API CoinGecko
│   ├── controllers/cryptoController.js  # Contrôleurs
│   ├── routes/cryptoRoutes.js     # Routes API
│   ├── middleware/errorHandler.js # Gestion d'erreurs
│   └── app.js                     # Application principale
├── package.json
├── .env.example
├── .gitignore
├── model.py                       # Modèle Python Aave vs Morpho
├── contracts/AaveMorphoOracle.sol # Smart contract Flare
├── scripts/deploy.js              # Script de déploiement
├── venv/                          # Environnement virtuel Python
├── start-with-python.sh           # Script de démarrage
├── QUICK_START.md                 # Guide de démarrage rapide
├── FLARE_INTEGRATION_GUIDE.md     # Guide complet Flare
└── README.md
```

## ⚠️ Limitations

### API CoinGecko
- L'API publique de CoinGecko a des limitations de taux
- Certaines données comme le yield de staking ETH ne sont pas directement disponibles
- Pour un usage intensif, considérez une clé API payante

### Données ETH Staking
CoinGecko ne fournit pas directement le yield de staking ETH. L'endpoint retourne des informations générales et des estimations.

## 🛠️ Développement

### Scripts disponibles
```bash
npm start        # Démarrer en production
npm run dev      # Démarrer en mode développement
./start-with-python.sh  # Démarrer avec environnement Python (recommandé)
npm run dev      # Démarrer en développement avec nodemon
npm test         # Lancer les tests (à implémenter)
```

### Ajouter de nouvelles métriques

1. Ajouter la méthode dans `coingeckoService.js`
2. Créer le contrôleur dans `cryptoController.js`
3. Ajouter la route dans `cryptoRoutes.js`

## 📝 TODO / Améliorations possibles

- [ ] Tests unitaires et d'intégration
- [ ] Authentification/API keys
- [ ] Rate limiting personnalisé
- [ ] Base de données pour persistance
- [ ] Monitoring et métriques
- [ ] Documentation Swagger/OpenAPI
- [ ] Docker containerization
- [ ] CI/CD pipeline

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir des issues ou des pull requests.

## 📄 Licence

MIT License
