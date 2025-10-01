// Configuración específica para el admin de Medusa 2.0
// Este archivo se usa para configurar el build del admin

const path = require('path');

module.exports = {
  // Configuración del admin
  admin: {
    path: '/admin',
    outDir: './admin/dist',
    build: {
      // Configuraciones específicas para el build
      target: 'node',
      minify: false, // No minificar para debug
      sourcemap: true,
    }
  },
  
  // Configuración de desarrollo
  dev: {
    admin: {
      port: 7001,
      host: 'localhost'
    }
  },
  
  // Configuración de producción
  production: {
    admin: {
      // Configuraciones específicas para producción
      minify: true,
      sourcemap: false,
    }
  }
};

