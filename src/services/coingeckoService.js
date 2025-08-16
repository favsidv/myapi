const axios = require('axios');
const NodeCache = require('node-cache');
const config = require('../config/config');

class CoinGeckoService {
  constructor() {
    this.apiUrl = config.coingecko.apiUrl;
    this.timeout = config.coingecko.timeout;
    this.cache = new NodeCache({ stdTTL: config.cache.ttl });
    
    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      timeout: this.timeout,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Crypto-Centralized-API/1.0.0'
      }
    });
  }

  async makeRequest(endpoint, cacheKey = null) {
    try {
      // Vérifier le cache si une clé est fournie
      if (cacheKey) {
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
          console.log(`Cache hit for ${cacheKey}`);
          return cachedData;
        }
      }

      console.log(`Fetching data from: ${endpoint}`);
      const response = await this.axiosInstance.get(endpoint);
      
      // Mettre en cache si une clé est fournie
      if (cacheKey && response.data) {
        this.cache.set(cacheKey, response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error.message);
      throw new Error(`CoinGecko API Error: ${error.message}`);
    }
  }

  async getGlobalData() {
    return await this.makeRequest('/global', 'global_data');
  }

  async getCoinData(coinId) {
    return await this.makeRequest(`/coins/${coinId}`, `coin_${coinId}`);
  }

  async getExchangeData(exchangeId) {
    return await this.makeRequest(`/exchanges/${exchangeId}`, `exchange_${exchangeId}`);
  }

  async getExchanges() {
    return await this.makeRequest('/exchanges?per_page=250', 'exchanges_list');
  }

  async getDefiData() {
    return await this.makeRequest('/global/decentralized_finance_defi', 'defi_data');
  }

  async getSimplePrices(coinIds, vsCurrency = 'usd') {
    const coinsParam = coinIds.join(',');
    return await this.makeRequest(
      `/simple/price?ids=${coinsParam}&vs_currencies=${vsCurrency}&include_24hr_change=true`,
      `prices_${coinsParam}_${vsCurrency}`
    );
  }
}

module.exports = new CoinGeckoService();
