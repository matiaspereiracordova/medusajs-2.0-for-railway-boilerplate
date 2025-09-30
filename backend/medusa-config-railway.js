import { loadEnv, Modules, defineConfig } from '@medusajs/utils';
import {
  ADMIN_CORS,
  AUTH_CORS,
  BACKEND_URL,
  COOKIE_SECRET,
  DATABASE_URL,
  JWT_SECRET,
  REDIS_URL,
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
  SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL,
  SHOULD_DISABLE_ADMIN,
  STORE_CORS,
  STRIPE_API_KEY,
  STRIPE_WEBHOOK_SECRET,
  WORKER_MODE,
  MINIO_ENDPOINT,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET,
  MEILISEARCH_HOST,
  MEILISEARCH_ADMIN_KEY
} from 'lib/constants';

loadEnv(process.env.NODE_ENV, process.cwd());

// Railway-specific configuration
const medusaConfig = {
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseLogging: false,
    redisUrl: REDIS_URL,
    workerMode: WORKER_MODE,
    http: {
      port: 9001, // Use internal port for Medusa
      adminCors: "*",
      authCors: "*", 
      storeCors: "*",
      jwtSecret: JWT_SECRET,
      cookieSecret: COOKIE_SECRET
    },
    build: {
      // Simplified build configuration
    }
  },
  admin: {
    backendUrl: BACKEND_URL,
    disable: true, // Disable admin to avoid build issues
  },
  modules: [
    Modules.ADMIN,
    Modules.AUTH,
    Modules.CART,
    Modules.CUSTOMER,
    Modules.DRAFT_ORDER,
    Modules.FULFILLMENT,
    Modules.INVENTORY,
    Modules.NOTIFICATION,
    Modules.ORDER,
    Modules.PAYMENT,
    Modules.PRICING,
    Modules.PRODUCT,
    Modules.PROMOTION,
    Modules.REGION,
    Modules.SALES_CHANNEL,
    Modules.STOCK_LOCATION,
    Modules.STORE,
    Modules.TAX,
    Modules.USER,
    Modules.WORKFLOW_ENGINE,
    Modules.EVENT_BUS,
    Modules.CACHE,
    Modules.FILE,
    Modules.SEARCH,
  ],
  plugins: [
    // Add plugins here if needed
  ],
  featureFlags: {
    // Add feature flags here if needed
  }
};

export default defineConfig(medusaConfig);
