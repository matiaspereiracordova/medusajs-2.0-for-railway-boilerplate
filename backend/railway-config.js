// Railway-specific configuration
// This file provides a simplified configuration for Railway deployment

const config = {
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseLogging: false,
    redisUrl: process.env.REDIS_URL,
    workerMode: 'shared',
    http: {
      port: process.env.PORT || 9000,
      adminCors: "*",
      authCors: "*", 
      storeCors: "*",
      jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret',
      cookieSecret: process.env.COOKIE_SECRET || 'default-cookie-secret'
    }
  },
  admin: {
    backendUrl: process.env.RAILWAY_PUBLIC_DOMAIN ? 
      `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 
      `http://localhost:${process.env.PORT || 9000}`,
    disable: false,
  },
  modules: []
};

module.exports = config;
