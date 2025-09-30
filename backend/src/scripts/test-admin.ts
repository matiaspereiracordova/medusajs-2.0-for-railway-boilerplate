#!/usr/bin/env node

/**
 * Script para verificar que el panel de administración esté funcionando
 * Ejecutar con: npx ts-node src/scripts/test-admin.ts
 */

import { loadEnv } from '@medusajs/framework/utils';

loadEnv(process.env.NODE_ENV || 'development', process.cwd());

async function testAdmin() {
  console.log('🔍 Verificando configuración del panel de administración...\n');

  try {
    // 1. Verificar variables de entorno básicas
    console.log('📋 Verificando variables de entorno básicas:');
    const basicEnvVars = {
      BACKEND_PUBLIC_URL: process.env.BACKEND_PUBLIC_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      COOKIE_SECRET: process.env.COOKIE_SECRET,
      DATABASE_URL: process.env.DATABASE_URL,
    };

    let basicEnvOk = true;
    for (const [key, value] of Object.entries(basicEnvVars)) {
      if (value) {
        console.log(`✅ ${key}: configurada`);
      } else {
        console.log(`❌ ${key}: NO configurada`);
        basicEnvOk = false;
      }
    }

    if (!basicEnvOk) {
      console.log('\n❌ Faltan variables de entorno básicas para el admin.');
      return;
    }

    // 2. Verificar configuración del admin
    console.log('\n⚙️ Verificando configuración del admin:');
    const adminConfig = {
      'Admin deshabilitado': process.env.MEDUSA_DISABLE_ADMIN === 'true',
      'Backend URL': process.env.BACKEND_PUBLIC_URL,
      'Puerto': process.env.PORT || '8080',
    };

    for (const [key, value] of Object.entries(adminConfig)) {
      console.log(`   - ${key}: ${value}`);
    }

    if (adminConfig['Admin deshabilitado']) {
      console.log('\n⚠️ El admin está deshabilitado por configuración.');
      console.log('   Para habilitarlo, establece MEDUSA_DISABLE_ADMIN=false o elimina la variable.');
    } else {
      console.log('\n✅ El admin está habilitado en la configuración.');
    }

    // 3. Verificar estructura de archivos del admin
    console.log('\n📁 Verificando estructura de archivos del admin:');
    const fs = require('fs');
    const path = require('path');
    
    const adminFiles = [
      'admin/dist/index.html',
      'admin/dist/assets/',
      '.medusa/admin/',
    ];

    for (const file of adminFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} existe`);
        
        // Si es un directorio, mostrar contenido
        if (fs.statSync(filePath).isDirectory()) {
          const contents = fs.readdirSync(filePath);
          console.log(`   📋 Contenido: ${contents.join(', ')}`);
        }
      } else {
        console.log(`❌ ${file} NO existe`);
      }
    }

    // 4. Verificar que el build del admin funcione
    console.log('\n🔨 Verificando configuración de build:');
    try {
      const configPath = path.join(process.cwd(), 'medusa-config.js');
      if (fs.existsSync(configPath)) {
        console.log('✅ medusa-config.js existe');
        
        // Leer configuración y verificar admin
        const configContent = fs.readFileSync(configPath, 'utf8');
        if (configContent.includes('disable: false')) {
          console.log('✅ Admin habilitado en medusa-config.js');
        } else if (configContent.includes('disable: true')) {
          console.log('❌ Admin deshabilitado en medusa-config.js');
        } else {
          console.log('⚠️ Configuración de admin no encontrada en medusa-config.js');
        }
      } else {
        console.log('❌ medusa-config.js NO existe');
      }
    } catch (error) {
      console.log('❌ Error verificando configuración:', error.message);
    }

    // 5. URLs de acceso
    console.log('\n🌐 URLs de acceso:');
    const backendUrl = process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 8080}`;
    console.log(`   - Backend API: ${backendUrl}`);
    console.log(`   - Admin Panel: ${backendUrl}/admin`);
    console.log(`   - Health Check: ${backendUrl}/health`);
    console.log(`   - Store API: ${backendUrl}/store/*`);

    console.log('\n🎯 Resumen:');
    console.log('✅ Configuración del admin verificada');
    console.log('📋 Para acceder al admin:');
    console.log(`   1. Ve a ${backendUrl}/admin`);
    console.log('   2. Crea un usuario administrador si es la primera vez');
    console.log('   3. Inicia sesión con tus credenciales');
    
    if (!adminConfig['Admin deshabilitado']) {
      console.log('\n🚀 El admin debería estar funcionando correctamente.');
    } else {
      console.log('\n⚠️ El admin está deshabilitado. Habilítalo en la configuración.');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testAdmin().catch(console.error);
}

export default testAdmin;
