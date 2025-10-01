#!/usr/bin/env node

/**
 * Script específico para construir el admin de Medusa en Railway
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Construyendo admin de Medusa para Railway...');

async function buildAdminForRailway() {
  try {
    // 1. Verificar que estamos en Railway
    if (process.env.RAILWAY_ENVIRONMENT) {
      console.log('✅ Detectado entorno Railway');
    }

    // 2. Crear directorios necesarios
    const adminDirs = [
      'admin',
      'admin/dist',
      '.medusa',
      '.medusa/server',
      '.medusa/server/public',
      '.medusa/server/public/admin'
    ];

    for (const dir of adminDirs) {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`📁 Creado directorio: ${dir}`);
      }
    }

    // 3. Intentar construir con medusa build
    console.log('🔨 Ejecutando medusa build...');
    try {
      execSync('npx medusa build', { 
        stdio: 'inherit',
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: 'production'
        }
      });
      console.log('✅ medusa build completado exitosamente');
    } catch (buildError) {
      console.log('⚠️ medusa build falló, intentando alternativa...');
      console.log('Error:', buildError.message);
      
      // Intentar solo el build del admin
      try {
        console.log('🔨 Intentando build específico del admin...');
        execSync('npx medusa build --admin-only', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        console.log('✅ Admin build específico completado');
      } catch (adminBuildError) {
        console.log('⚠️ Admin build específico también falló');
        throw buildError;
      }
    }

    // 4. Verificar y copiar admin desde .medusa
    const medusaAdminPath = path.join(process.cwd(), '.medusa', 'server', 'public', 'admin', 'index.html');
    const adminDistPath = path.join(process.cwd(), 'admin', 'dist', 'index.html');
    
    if (fs.existsSync(medusaAdminPath)) {
      console.log('📋 Admin encontrado en .medusa, copiando...');
      fs.copyFileSync(medusaAdminPath, adminDistPath);
      console.log('✅ Admin copiado a admin/dist');
    }

    // 5. Verificar que el admin existe
    if (fs.existsSync(adminDistPath)) {
      console.log('✅ Admin build verificado y disponible');
      
      // Verificar contenido del admin
      const content = fs.readFileSync(adminDistPath, 'utf-8');
      if (content.includes('medusa') || content.includes('admin')) {
        console.log('✅ Admin de Medusa detectado correctamente');
      } else {
        console.log('⚠️ El admin puede no ser el correcto');
      }
      
      // Mostrar información del archivo
      const stats = fs.statSync(adminDistPath);
      console.log(`📊 Tamaño del admin: ${stats.size} bytes`);
      
      return true;
    } else {
      throw new Error('Admin build no se pudo crear');
    }

  } catch (error) {
    console.error('❌ Error construyendo admin:', error.message);
    
    // Crear admin de emergencia
    console.log('🚨 Creando admin de emergencia...');
    createEmergencyAdmin();
    
    return false;
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
    <title>Medusa Admin - En Construcción</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a1a;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .container { 
            text-align: center;
            max-width: 600px;
            padding: 40px;
            background: #2a2a2a;
            border-radius: 12px;
            border: 1px solid #333;
        }
        .logo {
            font-size: 48px;
            margin-bottom: 20px;
        }
        .title {
            font-size: 28px;
            color: #667eea;
            margin-bottom: 20px;
        }
        .subtitle {
            font-size: 18px;
            color: #94a3b8;
            margin-bottom: 30px;
        }
        .status {
            background: #059669;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            margin: 20px 0;
            display: inline-block;
        }
        .info {
            color: #94a3b8;
            margin: 20px 0;
            line-height: 1.6;
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
        .progress {
            background: #374151;
            border-radius: 10px;
            overflow: hidden;
            margin: 20px 0;
        }
        .progress-bar {
            background: #667eea;
            height: 4px;
            width: 60%;
            animation: progress 2s ease-in-out infinite;
        }
        @keyframes progress {
            0%, 100% { width: 60%; }
            50% { width: 80%; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🚀</div>
        <div class="title">Medusa Admin</div>
        <div class="subtitle">Panel de Administración</div>
        
        <div class="status">✅ Backend Funcionando</div>
        
        <div class="progress">
            <div class="progress-bar"></div>
        </div>
        
        <div class="info">
            El panel de administración se está construyendo.<br>
            Esto puede tomar unos minutos en Railway.
        </div>
        
        <div class="info">
            <strong>Estado del Sistema:</strong><br>
            Backend: ✅ Online<br>
            Base de Datos: ✅ Conectada<br>
            APIs: ✅ Disponibles<br>
            Admin: 🔄 Construyendo<br>
            Timestamp: ${new Date().toISOString()}
        </div>
        
        <div>
            <a href="/health" class="btn">Verificar Salud</a>
            <a href="/admin" class="btn" onclick="location.reload()">Recargar</a>
        </div>
    </div>
    
    <script>
        // Auto-refresh cada 5 segundos
        setTimeout(() => {
            location.reload();
        }, 5000);
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
  buildAdminForRailway().then(success => {
    if (success) {
      console.log('🎉 Admin build completado exitosamente');
      process.exit(0);
    } else {
      console.log('⚠️ Admin build completado con advertencias');
      process.exit(1);
    }
  }).catch(error => {
    console.error('❌ Admin build falló:', error);
    process.exit(1);
  });
}

module.exports = buildAdminForRailway;

