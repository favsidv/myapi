const coingeckoService = require('../services/coingeckoService');
const { exec } = require('child_process');
const path = require('path');

class CryptoController {
  
  async getBtcDominance(req, res, next) {
    try {
      const globalData = await coingeckoService.getGlobalData();
      const btcDominance = globalData.data.market_cap_percentage.btc;
      
      res.json({
        success: true,
        data: {
          btc_dominance: btcDominance,
          unit: '%',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getGlobalDefiTvl(req, res, next) {
    try {
      const defiData = await coingeckoService.getDefiData();
      
      res.json({
        success: true,
        data: {
          total_tvl_usd: defiData.data.defi_market_cap,
          tvl_24h_change: defiData.data.defi_24h_percentage_change,
          unit: 'USD',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getExchangeVolumes(req, res, next) {
    try {
      const exchanges = await coingeckoService.getExchanges();
      
      const dexNames = ['uniswap', 'pancakeswap', 'sushiswap', 'curve', '1inch', 'dydx'];
      
      let cexVolume = 0;
      let dexVolume = 0;
      
      exchanges.forEach(exchange => {
        const isDex = dexNames.some(dexName => 
          exchange.id.toLowerCase().includes(dexName) || 
          exchange.name.toLowerCase().includes(dexName)
        );
        
        if (isDex) {
          dexVolume += exchange.trade_volume_24h_btc || 0;
        } else {
          cexVolume += exchange.trade_volume_24h_btc || 0;
        }
      });

      res.json({
        success: true,
        data: {
          cex_volume_24h_btc: cexVolume,
          dex_volume_24h_btc: dexVolume,
          total_volume_24h_btc: cexVolume + dexVolume,
          unit: 'BTC',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getStablecoinPeg(req, res, next) {
    try {
      const prices = await coingeckoService.getSimplePrices(['tether', 'usd-coin']);
      
      const usdtPrice = prices.tether.usd;
      const usdcPrice = prices['usd-coin'].usd;
      
      const usdtDeviation = ((usdtPrice - 1) * 100).toFixed(4);
      const usdcDeviation = ((usdcPrice - 1) * 100).toFixed(4);

      res.json({
        success: true,
        data: {
          usdt: {
            price: usdtPrice,
            deviation_from_peg: `${usdtDeviation}%`,
            change_24h: prices.tether.usd_24h_change
          },
          usdc: {
            price: usdcPrice,
            deviation_from_peg: `${usdcDeviation}%`,
            change_24h: prices['usd-coin'].usd_24h_change
          },
          unit: 'USD',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getEthStakingYield(req, res, next) {
    try {
      const ethData = await coingeckoService.getCoinData('ethereum');
      
      res.json({
        success: true,
        data: {
          eth_price: ethData.market_data.current_price.usd,
          market_cap: ethData.market_data.market_cap.usd,
          staking_info: {
            note: "Staking yield not directly available from CoinGecko",
            estimated_apy: "3-5%",
            total_staked_eth: "Approximately 32M+ ETH",
            staking_ratio: "~25% of total supply"
          },
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllMetrics(req, res, next) {
    try {
      const [globalData, defiData, exchanges, stablecoinPrices, ethData] = await Promise.all([
        coingeckoService.getGlobalData(),
        coingeckoService.getDefiData(),
        coingeckoService.getExchanges(),
        coingeckoService.getSimplePrices(['tether', 'usd-coin']),
        coingeckoService.getCoinData('ethereum')
      ]);

      const btcDominance = globalData.data.market_cap_percentage.btc;

      const defiTvl = defiData.data.defi_market_cap;

      const dexNames = ['uniswap', 'pancakeswap', 'sushiswap', 'curve', '1inch', 'dydx'];
      let cexVolume = 0;
      let dexVolume = 0;
      
      exchanges.forEach(exchange => {
        const isDex = dexNames.some(dexName => 
          exchange.id.toLowerCase().includes(dexName) || 
          exchange.name.toLowerCase().includes(dexName)
        );
        
        if (isDex) {
          dexVolume += exchange.trade_volume_24h_btc || 0;
        } else {
          cexVolume += exchange.trade_volume_24h_btc || 0;
        }
      });

  
      const usdtPrice = stablecoinPrices.tether.usd;
      const usdcPrice = stablecoinPrices['usd-coin'].usd;

      res.json({
        success: true,
        data: {
          btc_dominance: {
            value: btcDominance,
            unit: '%'
          },
          defi_tvl: {
            value: defiTvl,
            change_24h: defiData.data.defi_24h_percentage_change,
            unit: 'USD'
          },
          volumes: {
            cex_24h_btc: cexVolume,
            dex_24h_btc: dexVolume,
            total_24h_btc: cexVolume + dexVolume,
            unit: 'BTC'
          },
          stablecoins: {
            usdt: {
              price: usdtPrice,
              deviation: `${((usdtPrice - 1) * 100).toFixed(4)}%`
            },
            usdc: {
              price: usdcPrice,
              deviation: `${((usdcPrice - 1) * 100).toFixed(4)}%`
            }
          },
          eth_data: {
            price: ethData.market_data.current_price.usd,
            market_cap: ethData.market_data.market_cap.usd,
            staking_note: "Yield data not available from CoinGecko"
          },
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getAaveMorphoRecommendation(req, res, next) {
    try {
      // D'abord, récupérer toutes les métriques nécessaires pour le modèle Python
      const [globalData, defiData, exchanges, stablecoinPrices] = await Promise.all([
        coingeckoService.getGlobalData(),
        coingeckoService.getDefiData(),
        coingeckoService.getExchanges(),
        coingeckoService.getSimplePrices(['tether', 'usd-coin'])
      ]);

      const btcDominance = globalData.data.market_cap_percentage.btc;
      const defiTvl = defiData.data.defi_market_cap;

      const dexNames = ['uniswap', 'pancakeswap', 'sushiswap', 'curve', '1inch', 'dydx'];
      let cexVolume = 0;
      let dexVolume = 0;
      
      exchanges.forEach(exchange => {
        const isDex = dexNames.some(dexName => 
          exchange.id.toLowerCase().includes(dexName) || 
          exchange.name.toLowerCase().includes(dexName)
        );
        
        if (isDex) {
          dexVolume += exchange.trade_volume_24h_btc || 0;
        } else {
          cexVolume += exchange.trade_volume_24h_btc || 0;
        }
      });

      const usdtPrice = stablecoinPrices.tether.usd;
      const usdcPrice = stablecoinPrices['usd-coin'].usd;

      // Préparer les données dans le format attendu par le modèle Python
      const modelInput = {
        btc_dominance: { value: btcDominance },
        defi_tvl: { value: defiTvl },
        volumes: {
          cex_24h_btc: cexVolume,
          dex_24h_btc: dexVolume
        },
        stablecoins: {
          usdt: { deviation: `${((usdtPrice - 1) * 100).toFixed(3)}%` },
          usdc: { deviation: `${((usdcPrice - 1) * 100).toFixed(3)}%` }
        },
        timestamp: new Date().toISOString()
      };

      // Créer un endpoint temporaire pour servir les données au modèle Python
      const tempApiData = JSON.stringify({
        success: true,
        data: modelInput
      });

      // Exécuter le modèle Python avec les données
      const pythonScript = path.join(__dirname, '../../model.py');
      const tempApiUrl = `${req.protocol}://${req.get('host')}/api/temp-model-data`;
      
      return new Promise((resolve, reject) => {
        // Stocker temporairement les données pour le modèle
        req.app.locals.tempModelData = tempApiData;
        
        exec(`source venv/bin/activate && python ${pythonScript} ${tempApiUrl}`, (error, stdout, stderr) => {
          if (error) {
            console.error('Python execution error:', error);
            return reject(error);
          }
          
          if (stderr) {
            console.error('Python stderr:', stderr);
            return reject(new Error(stderr));
          }
          
          try {
            const recommendation = JSON.parse(stdout);
            
            res.json({
              success: true,
              data: recommendation,
              timestamp: new Date().toISOString(),
              source: 'aave-morpho-model'
            });
            
            // Nettoyer les données temporaires
            delete req.app.locals.tempModelData;
            resolve();
          } catch (parseError) {
            reject(parseError);
          }
        });
      });

    } catch (error) {
      next(error);
    }
  }

  async getTempModelData(req, res, next) {
    try {
      if (req.app.locals.tempModelData) {
        res.json(JSON.parse(req.app.locals.tempModelData));
      } else {
        res.status(404).json({ success: false, error: 'No temporary data available' });
      }
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CryptoController();
