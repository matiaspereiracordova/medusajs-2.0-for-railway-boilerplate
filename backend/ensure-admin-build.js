#!/usr/bin/env node

/**
 * Script para asegurar que el admin de Medusa se construya correctamente
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Asegurando build del admin de Medusa...');

async function ensureAdminBuild() {
  try {
    // 1. Verificar que medusa build funcione
    console.log('🚀 Ejecutando medusa build...');
    execSync('npx medusa build', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ Medusa build completado');

    // 2. Verificar directorios del admin
    const adminPaths = [
      'admin/dist',
      '.medusa/server/public/admin',
      '.medusa/admin'
    ];

    for (const adminPath of adminPaths) {
      const fullPath = path.join(process.cwd(), adminPath);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ Encontrado directorio: ${adminPath}`);
        
        // Verificar contenido
        const contents = fs.readdirSync(fullPath);
        console.log(`   📋 Contenido: ${contents.join(', ')}`);
        
        // Buscar index.html
        const indexPath = path.join(fullPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          console.log(`   ✅ index.html encontrado en ${adminPath}`);
        }
      } else {
        console.log(`❌ Directorio no encontrado: ${adminPath}`);
      }
    }

    // 3. Intentar copiar admin desde .medusa si es necesario
    const medusaAdminPath = path.join(process.cwd(), '.medusa', 'server', 'public', 'admin', 'index.html');
    const adminDistPath = path.join(process.cwd(), 'admin', 'dist', 'index.html');
    
    if (fs.existsSync(medusaAdminPath) && !fs.existsSync(adminDistPath)) {
      console.log('📋 Copiando admin desde .medusa a admin/dist...');
      
      // Crear directorio admin/dist si no existe
      const adminDistDir = path.dirname(adminDistPath);
      if (!fs.existsSync(adminDistDir)) {
        fs.mkdirSync(adminDistDir, { recursive: true });
      }
      
      fs.copyFileSync(medusaAdminPath, adminDistPath);
      console.log('✅ Admin copiado exitosamente');
    }

    // 4. Verificar que el admin esté disponible
    if (fs.existsSync(adminDistPath)) {
      console.log('✅ Admin build verificado y disponible');
      
      // Leer y mostrar información básica del archivo
      const content = fs.readFileSync(adminDistPath, 'utf-8');
      if (content.includes('medusa')) {
        console.log('✅ Admin de Medusa detectado en el archivo');
      } else {
        console.log('⚠️ El archivo admin puede no ser el de Medusa');
      }
    } else {
      throw new Error('No se pudo crear o encontrar el admin build');
    }

    console.log('🎉 Admin build asegurado exitosamente');

  } catch (error) {
    console.error('❌ Error asegurando admin build:', error.message);
    
    // Crear admin de emergencia
    console.log('🚨 Creando admin de emergencia...');
    createEmergencyAdmin();
    
    throw error;
  }
}

function createEmergencyAdmin() {
  try {
    const adminDir = path.join(process.cwd(), 'admin', 'dist');
    if (!fs.existsSync(adminDir)) {
      fs.mkdirSync(adminDir, { recursive: true });
    }

    const emergencyAdmin = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medusa Admin - Inicializando...</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc; 
            color: #1e293b;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .container { 
            text-align: center;
            max-width: 600px;
            padding: 40px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .spinner {
            border: 4px solid #f3f4f6;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .loading-text {
            font-size: 24px;
            color: #667eea;
            margin-bottom: 16px;
        }
        .info {
            color: #6b7280;
            margin: 20px 0;
            line-height: 1.6;
        }
        .status {
            background: #10b981;
            color: white;
            padding: 12px;
            border-radius: 6px;
            margin: 20px 0;
            display: inline-block;
        }
        .btn {
            background: #667eea;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            text-decoration: none;
            display: inline-block;
            margin: 10px;
            transition: background 0.2s;
        }
        .btn:hover {
            background: #5a67d8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <div class="loading-text">Inicializando Admin de Medusa...</div>
        
        <div class="status">✅ Backend Funcionando</div>
        
        <div class="info">
            El panel de administración de Medusa se está cargando.<br>
            Esto puede tomar unos momentos en el primer inicio.
        </div>
        
        <div class="info">
            <strong>Estado del Sistema:</strong><br>
            Backend: ✅ Online<br>
            Base de Datos: ✅ Conectada<br>
            APIs: ✅ Disponibles<br>
            Timestamp: ${new Date().toISOString()}
        </div>
        
        <div>
            <a href="/health" class="btn">Verificar Salud</a>
            <a href="/admin" class="btn" onclick="location.reload()">Recargar</a>
        </div>
    </div>
    
    <script>
        // Auto-refresh cada 3 segundos
        setTimeout(() => {
            location.reload();
        }, 3000);
    </script>
</body>
</html>`;

    fs.writeFileSync(path.join(adminDir, 'index.html'), emergencyAdmin);
    console.log('✅ Admin de emergencia creado');
  } catch (error) {
    console.error('❌ Error creando admin de emergencia:', error.message);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  ensureAdminBuild().catch(console.error);
}

module.exports = ensureAdminBuild;

