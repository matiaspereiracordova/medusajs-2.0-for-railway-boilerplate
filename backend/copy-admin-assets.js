#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Copiando archivos del admin...');

const sourceDir = '.medusa/server/public/admin';
const destDir = 'admin/dist';

// Verificar que el directorio fuente existe
if (!fs.existsSync(sourceDir)) {
  console.error('❌ Error: No se encontró el directorio fuente del admin:', sourceDir);
  process.exit(1);
}

// Crear el directorio destino si no existe
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log('📁 Directorio destino creado:', destDir);
}

// Función para copiar archivos recursivamente
function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  // Copiar todos los archivos del admin
  copyRecursive(sourceDir, destDir);
  console.log('✅ Archivos del admin copiados exitosamente');
  
  // Verificar que index.html existe
  const indexPath = path.join(destDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    console.log('✅ index.html encontrado en:', indexPath);
  } else {
    console.error('❌ Error: index.html no encontrado después de la copia');
    process.exit(1);
  }
  
  // Verificar que assets existe
  const assetsPath = path.join(destDir, 'assets');
  if (fs.existsSync(assetsPath)) {
    const assetsFiles = fs.readdirSync(assetsPath);
    console.log(`✅ Directorio assets encontrado con ${assetsFiles.length} archivos`);
  } else {
    console.error('❌ Error: Directorio assets no encontrado después de la copia');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Error al copiar archivos del admin:', error.message);
  process.exit(1);
}
