// src/modules/odoo/medusa-config.ts

const config = {
  modules: [
    {
      resolve: "./src/modules/odoo",
      options: {
        url: process.env.ODOO_URL,
        dbName: process.env.ODOO_DB_NAME,
        username: process.env.ODOO_USERNAME,
        apiKey: process.env.ODOO_API_KEY,
      },
    },
  ],
};

export default config;
