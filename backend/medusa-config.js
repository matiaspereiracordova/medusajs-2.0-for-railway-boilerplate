const { loadEnv, defineConfig } = require('@medusajs/utils');

loadEnv(process.env.NODE_ENV, process.cwd());

const medusaConfig = {
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseLogging: false,
    redisUrl: process.env.REDIS_URL,
    workerMode: process.env.WORKER_MODE || false,
    http: {
      port: process.env.PORT || 9000,
      host: "0.0.0.0",
      adminCors: process.env.ADMIN_CORS || "*",
      authCors: process.env.AUTH_CORS || "*", 
      storeCors: "*",
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET
    },
  },
  admin: {
    backendUrl: process.env.BACKEND_URL || process.env.RAILWAY_PUBLIC_DOMAIN_VALUE || `http://localhost:${process.env.PORT || 9000}`,
    disable: false, // Enable the official MedusaJS admin panel
  },
  modules: [],
  workflows: [],
  jobs: [],
  subscribers: [],
  plugins: [],
  featureFlags: {
    product_categories: true,
    publishable_api_keys: true,
    sales_channels: true,
  },
};

module.exports = defineConfig(medusaConfig);