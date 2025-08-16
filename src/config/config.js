require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  coingecko: {
    apiUrl: process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3',
    timeout: process.env.NODE_ENV === 'production' ? 15000 : 10000
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || (process.env.NODE_ENV === 'production' ? 600 : 300)
  },
  nodeEnv: process.env.NODE_ENV || 'development',
  cors: {
    origin: process.env.NODE_ENV === 'production' ? 
      [/\.railway\.app$/, /localhost/, /127\.0\.0\.1/] : 
      true
  }
};
