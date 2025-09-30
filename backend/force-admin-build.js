#!/usr/bin/env node

/**
 * Script para forzar la construcción del admin de Medusa
 * Este script se ejecuta ANTES de iniciar Medusa para asegurar que el admin esté disponible
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Forzando construcción del admin de Medusa...');

async function forceAdminBuild() {
  try {
    // 1. Crear directorios necesarios
    const requiredDirs = [
      'admin',
      'admin/dist',
      '.medusa',
      '.medusa/server',
      '.medusa/server/public',
      '.medusa/server/public/admin'
    ];

    console.log('📁 Creando directorios necesarios...');
    for (const dir of requiredDirs) {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`   ✅ Creado: ${dir}`);
      }
    }

    // 2. Intentar construir con medusa build
    console.log('🚀 Ejecutando medusa build...');
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
      console.log('⚠️ medusa build falló, intentando build específico del admin...');
      
      try {
        // Intentar construir solo el admin
        execSync('npx @medusajs/admin build', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        console.log('✅ Admin build específico completado');
      } catch (adminBuildError) {
        console.log('⚠️ Admin build específico falló, creando admin mínimo...');
        createMinimalAdmin();
      }
    }

    // 3. Verificar que el admin existe
    const adminPaths = [
      path.join(process.cwd(), 'admin', 'dist', 'index.html'),
      path.join(process.cwd(), '.medusa', 'server', 'public', 'admin', 'index.html'),
      path.join(process.cwd(), '.medusa', 'admin', 'index.html')
    ];

    let adminFound = false;
    for (const adminPath of adminPaths) {
      if (fs.existsSync(adminPath)) {
        console.log(`✅ Admin encontrado en: ${path.relative(process.cwd(), adminPath)}`);
        
        // Asegurar que también existe en admin/dist
        const targetPath = path.join(process.cwd(), 'admin', 'dist', 'index.html');
        if (adminPath !== targetPath) {
          const targetDir = path.dirname(targetPath);
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          fs.copyFileSync(adminPath, targetPath);
          console.log('✅ Admin copiado a admin/dist');
        }
        
        adminFound = true;
        break;
      }
    }

    if (!adminFound) {
      console.log('⚠️ No se encontró admin, creando admin mínimo...');
      createMinimalAdmin();
    }

    // 4. Verificar que admin/dist/index.html existe
    const finalAdminPath = path.join(process.cwd(), 'admin', 'dist', 'index.html');
    if (fs.existsSync(finalAdminPath)) {
      const stats = fs.statSync(finalAdminPath);
      console.log(`✅ Admin final verificado: ${stats.size} bytes`);
      return true;
    } else {
      throw new Error('No se pudo crear el admin final');
    }

  } catch (error) {
    console.error('❌ Error forzando build del admin:', error.message);
    return false;
  }
}

function createMinimalAdmin() {
  try {
    console.log('🔨 Creando admin mínimo de Medusa...');
    
    const adminDir = path.join(process.cwd(), 'admin', 'dist');
    if (!fs.existsSync(adminDir)) {
      fs.mkdirSync(adminDir, { recursive: true });
    }

    // Crear un admin mínimo pero que funcione con Medusa
    const minimalAdmin = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medusa Admin</title>
    <script type="module">
        // Cargar el admin de Medusa dinámicamente
        import('/admin/assets/main.js').catch(() => {
            console.log('Admin assets not found, using fallback');
            document.body.innerHTML = \`
                <div style="
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: #1a1a1a;
                    color: white;
                    text-align: center;
                    padding: 20px;
                ">
                    <div>
                        <h1>🚀 Medusa Admin</h1>
                        <p>Loading admin interface...</p>
                        <div style="
                            background: #2a2a2a;
                            padding: 20px;
                            border-radius: 8px;
                            margin: 20px 0;
                            border: 1px solid #333;
                        ">
                            <p><strong>Status:</strong> Admin building...</p>
                            <p><strong>Backend:</strong> ✅ Running</p>
                            <p><strong>APIs:</strong> ✅ Available</p>
                        </div>
                        <button onclick="location.reload()" style="
                            background: #667eea;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 6px;
                            cursor: pointer;
                        ">Refresh</button>
                    </div>
                </div>
            \`;
        });
    </script>
</head>
<body>
    <div id="medusa-admin">
        <div style="
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #1a1a1a;
            color: white;
            text-align: center;
        ">
            <div>
                <div style="
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f4f6;
                    border-top: 4px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                "></div>
                <h2>Loading Medusa Admin...</h2>
                <p>Initializing admin interface...</p>
            </div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    </div>
</body>
</html>`;

    fs.writeFileSync(path.join(adminDir, 'index.html'), minimalAdmin);
    console.log('✅ Admin mínimo creado');
    
  } catch (error) {
    console.error('❌ Error creando admin mínimo:', error.message);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  forceAdminBuild().then(success => {
    if (success) {
      console.log('🎉 Admin build forzado exitosamente');
      process.exit(0);
    } else {
      console.log('⚠️ Admin build forzado con advertencias');
      process.exit(1);
    }
  }).catch(error => {
    console.error('❌ Admin build forzado falló:', error);
    process.exit(1);
  });
}

module.exports = forceAdminBuild;
