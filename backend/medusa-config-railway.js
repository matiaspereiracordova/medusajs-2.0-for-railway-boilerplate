// Simplified Medusa configuration for Railway
import { loadEnv, Modules, defineConfig } from '@medusajs/utils';

loadEnv(process.env.NODE_ENV, process.cwd());

const medusaConfig = {
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
    disable: true, // Disable admin for Railway deployment
  },
  modules: []
};

export default defineConfig(medusaConfig);
