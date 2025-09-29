#!/usr/bin/env node

/**
 * Script para probar la conexión con Odoo
 * Ejecutar con: npx ts-node src/scripts/test-odoo-connection.ts
 */

import { MedusaContainer } from "@medusajs/framework/types"

async function testOdooConnection() {
  console.log('🔍 Probando conexión con Odoo...\n');

  try {
    // 1. Verificar variables de entorno
    console.log('📋 Verificando variables de entorno:');
    const envVars = {
      ODOO_URL: process.env.ODOO_URL,
      ODOO_DB: process.env.ODOO_DB,
      ODOO_USERNAME: process.env.ODOO_USERNAME,
      ODOO_API_KEY: process.env.ODOO_API_KEY
    };

    let envOk = true;
    for (const [key, value] of Object.entries(envVars)) {
      if (value) {
        console.log(`✅ ${key}: configurada`);
      } else {
        console.log(`❌ ${key}: NO configurada`);
        envOk = false;
      }
    }

    if (!envOk) {
      console.log('\n❌ Faltan variables de entorno. Configúralas en Railway.');
      return;
    }

    // 2. Verificar que el módulo se puede importar
    console.log('\n📦 Verificando módulo Odoo:');
    try {
      const OdooModule = await import('../modules/odoo/service');
      console.log('✅ Módulo Odoo importado correctamente');
    } catch (error) {
      console.log('❌ Error importando módulo Odoo:', error.message);
      return;
    }

    // 3. Crear instancia del servicio
    console.log('\n🔧 Creando instancia del servicio:');
    try {
      const OdooService = (await import('../modules/odoo/service')).default;
      const odooService = new OdooService({}, {
        url: envVars.ODOO_URL,
        dbName: envVars.ODOO_DB,
        username: envVars.ODOO_USERNAME,
        apiKey: envVars.ODOO_API_KEY
      });
      console.log('✅ Servicio Odoo creado correctamente');
    } catch (error) {
      console.log('❌ Error creando servicio Odoo:', error.message);
      return;
    }

    // 4. Probar conexión
    console.log('\n🌐 Probando conexión con Odoo:');
    try {
      const OdooService = (await import('../modules/odoo/service')).default;
      const odooService = new OdooService({}, {
        url: envVars.ODOO_URL,
        dbName: envVars.ODOO_DB,
        username: envVars.ODOO_USERNAME,
        apiKey: envVars.ODOO_API_KEY
      });

      await odooService.login();
      console.log('✅ Conexión con Odoo exitosa!');
      
      // 5. Probar listado de productos
      console.log('\n📦 Probando listado de productos:');
      try {
        const products = await odooService.listProducts([], { offset: 0, limit: 1 });
        console.log(`✅ Listado de productos exitoso. Productos encontrados: ${products.length}`);
        if (products.length > 0) {
          console.log(`   Primer producto: ${products[0].name}`);
        }
      } catch (error) {
        console.log('❌ Error listando productos:', error.message);
      }

    } catch (error) {
      console.log('❌ Error de conexión con Odoo:', error.message);
      console.log('   Verifica que las credenciales sean correctas y que Odoo esté accesible');
    }

    console.log('\n🎯 Resumen:');
    console.log('- Si todas las verificaciones muestran ✅, el módulo Odoo está listo');
    console.log('- Si hay ❌, revisa la configuración correspondiente');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testOdooConnection().catch(console.error);
}

export default testOdooConnection;
