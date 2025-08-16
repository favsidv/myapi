const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err);

  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err.message.includes('CoinGecko API Error')) {
    statusCode = 502;
    message = 'Service temporairement indisponible';
  }

  if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
    statusCode = 504;
    message = 'Timeout lors de la récupération des données';
  }

  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service externe indisponible';
  }

  if (err.response && err.response.status === 429) {
    statusCode = 429;
    message = 'Trop de requêtes, veuillez réessayer plus tard';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err.message 
      })
    }
  });
};

module.exports = errorHandler;
