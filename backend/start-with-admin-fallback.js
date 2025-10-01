#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 Iniciando Medusa con fallback para admin...');

// Verificar si existe el index.html del admin
const adminPaths = [
  'admin/dist/index.html',
  '.medusa/server/public/admin/index.html',
  '.medusa/server/admin/index.html'
];

let adminExists = false;
let adminPath = null;

for (const adminPathCheck of adminPaths) {
  if (fs.existsSync(adminPathCheck)) {
    adminExists = true;
    adminPath = adminPathCheck;
    console.log(`✅ Admin encontrado en: ${adminPathCheck}`);
    break;
  }
}

if (!adminExists) {
  console.log('⚠️ Admin no encontrado, creando configuración temporal sin admin...');
  
  // Crear una copia temporal del medusa-config.js sin admin
  const configPath = 'medusa-config.js';
  const tempConfigPath = 'medusa-config-temp.js';
  
  if (fs.existsSync(configPath)) {
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Deshabilitar admin temporalmente
    configContent = configContent.replace(
      /disable:\s*false/g,
      'disable: true'
    );
    
    fs.writeFileSync(tempConfigPath, configContent);
    console.log('📝 Configuración temporal creada sin admin');
    
    // Usar la configuración temporal
    process.env.MEDUSA_CONFIG_PATH = tempConfigPath;
  }
} else {
  console.log(`✅ Admin disponible, iniciando con admin habilitado`);
}

// Iniciar Medusa
console.log('🚀 Iniciando servidor Medusa...');
const medusaProcess = spawn('medusa', ['start'], {
  stdio: 'inherit',
  env: { ...process.env }
});

medusaProcess.on('close', (code) => {
  console.log(`Medusa process exited with code ${code}`);
  
  // Limpiar archivo temporal si existe
  if (fs.existsSync('medusa-config-temp.js')) {
    fs.unlinkSync('medusa-config-temp.js');
    console.log('🧹 Archivo temporal limpiado');
  }
});

medusaProcess.on('error', (error) => {
  console.error('Error starting Medusa:', error);
  
  // Limpiar archivo temporal si existe
  if (fs.existsSync('medusa-config-temp.js')) {
    fs.unlinkSync('medusa-config-temp.js');
  }
});

// Manejar señales de terminación
process.on('SIGINT', () => {
  console.log('🛑 Recibida señal de terminación...');
  medusaProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal de terminación...');
  medusaProcess.kill('SIGTERM');
});

