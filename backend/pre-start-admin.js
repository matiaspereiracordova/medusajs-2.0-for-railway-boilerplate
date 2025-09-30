#!/usr/bin/env node

/**
 * Script que se ejecuta ANTES de iniciar Medusa
 * Asegura que el admin esté disponible antes de que Medusa trate de cargarlo
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando admin antes de iniciar Medusa...');

async function preStartAdmin() {
  try {
    // 1. Verificar que admin/dist/index.html existe
    const adminPath = path.join(process.cwd(), 'admin', 'dist', 'index.html');
    
    if (fs.existsSync(adminPath)) {
      const stats = fs.statSync(adminPath);
      console.log(`✅ Admin encontrado: ${stats.size} bytes`);
      return true;
    }

    console.log('⚠️ Admin no encontrado, buscando en otras ubicaciones...');

    // 2. Buscar admin en otras ubicaciones
    const searchPaths = [
      '.medusa/server/public/admin/index.html',
      '.medusa/admin/index.html',
      'admin/index.html'
    ];

    for (const searchPath of searchPaths) {
      const fullPath = path.join(process.cwd(), searchPath);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ Admin encontrado en: ${searchPath}`);
        
        // Copiar a admin/dist
        const targetDir = path.dirname(adminPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        fs.copyFileSync(fullPath, adminPath);
        console.log('✅ Admin copiado a admin/dist');
        return true;
      }
    }

    console.log('❌ Admin no encontrado en ninguna ubicación');
    return false;

  } catch (error) {
    console.error('❌ Error verificando admin:', error.message);
    return false;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  preStartAdmin().then(success => {
    if (success) {
      console.log('✅ Admin verificado, listo para iniciar Medusa');
      process.exit(0);
    } else {
      console.log('⚠️ Admin no disponible, Medusa puede fallar');
      process.exit(1);
    }
  }).catch(error => {
    console.error('❌ Error verificando admin:', error);
    process.exit(1);
  });
}

module.exports = preStartAdmin;
