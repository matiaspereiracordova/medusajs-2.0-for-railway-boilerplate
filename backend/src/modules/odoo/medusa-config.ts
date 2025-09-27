import { defineConfig } from "@medusajs/framework"

export default defineConfig({
  // otras configuraciones ...
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
})
