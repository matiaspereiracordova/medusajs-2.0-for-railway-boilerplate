import { loadEnv, defineConfig } from '@medusajs/utils';
import {
  ADMIN_CORS,
  AUTH_CORS,
  BACKEND_URL,
  COOKIE_SECRET,
  DATABASE_URL,
  JWT_SECRET,
  PORT,
  REDIS_URL,
  WORKER_MODE,
  ODOO_URL,
  ODOO_DB,
  ODOO_USERNAME,
  ODOO_API_KEY
} from 'lib/constants';

loadEnv(process.env.NODE_ENV, process.cwd());

const medusaConfig = {
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseLogging: false,
    redisUrl: REDIS_URL,
    workerMode: WORKER_MODE,
    http: {
      port: PORT,
      host: "0.0.0.0",
      adminCors: ADMIN_CORS || "*",
      authCors: AUTH_CORS || "*", 
      storeCors: "*",
      jwtSecret: JWT_SECRET,
      cookieSecret: COOKIE_SECRET
    },
  },
  admin: {
    backendUrl: BACKEND_URL,
    disable: false,
  },
  modules: [
    // Módulo Odoo para integración ERP (solo si las variables están disponibles)
    ...(ODOO_URL && ODOO_DB && ODOO_USERNAME && ODOO_API_KEY ? [{
      resolve: './src/modules/odoo',
      options: {
        url: ODOO_URL,
        dbName: ODOO_DB,
        username: ODOO_USERNAME,
        apiKey: ODOO_API_KEY,
      },
    }] : []),
  ],
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

export default defineConfig(medusaConfig);