#!/usr/bin/env node

console.log('🚀 Iniciando build optimizado para Railway...');

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Step 1: Build Medusa
  console.log('📦 Construyendo Medusa...');
  execSync('medusa build', { 
    stdio: 'inherit',
    timeout: 300000 // 5 minutes timeout
  });

  // Step 2: Copy admin assets
  console.log('📋 Copiando assets del admin...');
  execSync('node copy-admin-assets.js', { 
    stdio: 'inherit',
    timeout: 60000 // 1 minute timeout
  });

  // Step 3: Run Railway fix
  console.log('🔧 Aplicando fix para Railway...');
  try {
    execSync('node fix-railway-admin.js', { 
      stdio: 'inherit',
      timeout: 30000 // 30 seconds timeout
    });
  } catch (error) {
    console.log('⚠️ Railway fix falló, continuando...');
  }

  // Step 4: Run postBuild
  console.log('🏁 Ejecutando postBuild...');
  execSync('node src/scripts/postBuild.js', { 
    stdio: 'inherit',
    timeout: 120000 // 2 minutes timeout
  });

  console.log('✅ Build optimizado completado exitosamente!');

} catch (error) {
  console.error('❌ Error en build optimizado:', error.message);
  process.exit(1);
}
