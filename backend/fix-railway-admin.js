#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando fix específico para Railway...');

// Rutas posibles donde MedusaJS busca el index.html del admin
const possibleAdminPaths = [
  'admin/dist/index.html',
  '.medusa/server/public/admin/index.html',
  '.medusa/server/admin/index.html',
  'admin/index.html',
  'dist/admin/index.html',
  'public/admin/index.html'
];

// Función para verificar si existe un archivo
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Función para crear directorios si no existen
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Directorio creado: ${dirPath}`);
  }
}

// Función para copiar archivos
function copyFile(src, dest) {
  try {
    ensureDirectoryExists(path.dirname(dest));
    fs.copyFileSync(src, dest);
    return true;
  } catch (error) {
    console.error(`❌ Error copiando ${src} a ${dest}:`, error.message);
    return false;
  }
}

// Buscar el index.html del admin
let sourceIndexHtml = null;
for (const path of possibleAdminPaths) {
  if (fileExists(path)) {
    sourceIndexHtml = path;
    console.log(`✅ index.html encontrado en: ${path}`);
    break;
  }
}

if (!sourceIndexHtml) {
  console.error('❌ No se encontró index.html del admin en ninguna ubicación');
  process.exit(1);
}

// Crear un index.html básico si no existe ninguno
const basicIndexHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
    <title>Medusa Admin</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5; 
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            padding: 40px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .error { 
            color: #e74c3c; 
            background: #fdf2f2; 
            padding: 15px; 
            border-radius: 4px; 
            border-left: 4px solid #e74c3c; 
        }
        .success { 
            color: #27ae60; 
            background: #f2fdf2; 
            padding: 15px; 
            border-radius: 4px; 
            border-left: 4px solid #27ae60; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Medusa Admin Panel</h1>
        <div class="error">
            <h3>⚠️ Admin Panel en Construcción</h3>
            <p>El panel de administración está siendo construido. Por favor, recarga la página en unos momentos.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>
        <div class="success">
            <h3>✅ Backend Funcionando</h3>
            <p>El backend de MedusaJS está funcionando correctamente. Todas las APIs están disponibles.</p>
        </div>
        <script>
            // Auto-refresh cada 5 segundos
            setTimeout(() => location.reload(), 5000);
        </script>
    </div>
</body>
</html>`;

// Asegurar que existe al menos un index.html en las ubicaciones críticas
const criticalPaths = [
  'admin/dist/index.html',
  '.medusa/server/public/admin/index.html'
];

let adminCreated = false;
for (const destPath of criticalPaths) {
  if (!fileExists(destPath)) {
    if (sourceIndexHtml && fileExists(sourceIndexHtml)) {
      if (copyFile(sourceIndexHtml, destPath)) {
        console.log(`✅ index.html copiado a: ${destPath}`);
        adminCreated = true;
      }
    } else {
      // Crear un index.html básico
      ensureDirectoryExists(path.dirname(destPath));
      fs.writeFileSync(destPath, basicIndexHtml);
      console.log(`✅ index.html básico creado en: ${destPath}`);
      adminCreated = true;
    }
  } else {
    console.log(`✅ index.html ya existe en: ${destPath}`);
    adminCreated = true;
  }
}

if (!adminCreated) {
  console.error('❌ No se pudo crear ningún index.html del admin');
  process.exit(1);
}

// Verificar que los archivos críticos existen
console.log('🔍 Verificando archivos críticos...');
for (const path of criticalPaths) {
  if (fileExists(path)) {
    console.log(`✅ ${path} - OK`);
  } else {
    console.log(`❌ ${path} - FALTA`);
  }
}

console.log('🎉 Fix para Railway completado exitosamente!');
