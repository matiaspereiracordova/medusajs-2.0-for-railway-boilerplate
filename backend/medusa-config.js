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
  MEILISEARCH_ADMIN_KEY,
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
      storeCors: STORE_CORS || "*",
      jwtSecret: JWT_SECRET,
      cookieSecret: COOKIE_SECRET
    },
  },
  admin: {
    backendUrl: BACKEND_URL,
    disable: false,
  },
  modules: [
    // Módulo Odoo para integración ERP
    ...(ODOO_URL && ODOO_DB && ODOO_USERNAME && ODOO_API_KEY ? [{
      resolve: './src/modules/odoo',
      options: {
        url: ODOO_URL,
        dbName: ODOO_DB,
        username: ODOO_USERNAME,
        apiKey: ODOO_API_KEY,
      },
    }] : []),
    
    // Módulo de notificaciones por email
    {
      resolve: './src/modules/email-notifications',
      options: {
        providers: [
          {
            resolve: './src/modules/email-notifications/services/resend',
            options: {
              api_key: RESEND_API_KEY,
              from_email: RESEND_FROM_EMAIL,
            },
          },
          {
            resolve: './src/modules/email-notifications/services/sendgrid',
            options: {
              api_key: SENDGRID_API_KEY,
              from_email: SENDGRID_FROM_EMAIL,
            },
          },
        ],
      },
    },

    // Módulo de archivos MinIO
    {
      resolve: './src/modules/minio-file',
      options: {
        endpoint: MINIO_ENDPOINT,
        accessKey: MINIO_ACCESS_KEY,
        secretKey: MINIO_SECRET_KEY,
        bucket: MINIO_BUCKET,
      },
    },
  ],
  workflows: [
    {
      resolve: './src/workflows/create-products',
    },
    {
      resolve: './src/workflows/update-products',
    },
    {
      resolve: './src/workflows/sync-from-erp',
    },
  ],
  jobs: [
    {
      resolve: './src/jobs/sync-products-from-erp',
    },
  ],
  subscribers: [
    {
      resolve: './src/subscribers/invite-created',
    },
    {
      resolve: './src/subscribers/order-placed',
    },
  ],
  plugins: [
    // Stripe plugin (opcional)
    ...(STRIPE_API_KEY && STRIPE_WEBHOOK_SECRET ? [{
      resolve: '@medusajs/plugin-stripe',
      options: {
        apiKey: STRIPE_API_KEY,
        webhookSecret: STRIPE_WEBHOOK_SECRET,
      },
    }] : []),
  ],
  featureFlags: {
    product_categories: true,
    publishable_api_keys: true,
    sales_channels: true,
  },
};

export default defineConfig(medusaConfig);