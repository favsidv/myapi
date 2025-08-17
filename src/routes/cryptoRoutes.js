const express = require('express');
const cryptoController = require('../controllers/cryptoController');

const router = express.Router();

router.get('/btc-dominance', cryptoController.getBtcDominance);

router.get('/defi-tvl', cryptoController.getGlobalDefiTvl);

router.get('/volumes', cryptoController.getExchangeVolumes);

router.get('/stablecoin-peg', cryptoController.getStablecoinPeg);

router.get('/eth-staking', cryptoController.getEthStakingYield);

router.get('/all-metrics', cryptoController.getAllMetrics);

router.get('/aave-morpho-recommendation', cryptoController.getAaveMorphoRecommendation);

router.get('/temp-model-data', cryptoController.getTempModelData);

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Crypto API is running',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/btc-dominance',
      '/api/defi-tvl',
      '/api/volumes',
      '/api/stablecoin-peg',
      '/api/eth-staking',
      '/api/all-metrics',
      '/api/aave-morpho-recommendation'
    ]
  });
});

module.exports = router;
