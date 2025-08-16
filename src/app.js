const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/config');
const cryptoRoutes = require('./routes/cryptoRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors(config.cors));

// Rate limiting pour la production
if (config.nodeEnv === 'production') {
  const rateLimit = require('express-rate-limit');
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limite 100 requêtes par IP par fenêtre de 15 min
    message: {
      success: false,
      error: {
        message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
        timestamp: new Date().toISOString()
      }
    }
  });
  app.use('/api', limiter);
}

app.use(express.json());

if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

app.use('/api', cryptoRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Crypto Centralized API',
    version: '1.0.0',
    documentation: {
      endpoints: {
        'GET /api/health': 'Statut de santé de l\'API',
        'GET /api/btc-dominance': 'Dominance Bitcoin',
        'GET /api/defi-tvl': 'TVL DeFi global',
        'GET /api/volumes': 'Volumes CEX/DEX 24h',
        'GET /api/stablecoin-peg': 'Prix USDT/USDC et déviation du peg',
        'GET /api/eth-staking': 'Informations sur le staking Ethereum',
        'GET /api/all-metrics': 'Toutes les métriques en une seule requête'
      }
    },
    timestamp: new Date().toISOString()
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      path: req.originalUrl,
      timestamp: new Date().toISOString()
    }
  });
});

app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`🚀 Crypto API démarrée sur le port ${config.port}`);
  console.log(`📖 Documentation disponible sur http://localhost:${config.port}`);
  console.log(`🔗 Endpoints API: http://localhost:${config.port}/api`);
  
  if (config.nodeEnv === 'development') {
    console.log('🔧 Mode développement activé');
  }
});

process.on('SIGTERM', () => {
  console.log('SIGTERM reçu, arrêt du serveur...');
  server.close(() => {
    console.log('Serveur arrêté');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT reçu, arrêt du serveur...');
  server.close(() => {
    console.log('Serveur arrêté');
    process.exit(0);
  });
});

module.exports = app;
