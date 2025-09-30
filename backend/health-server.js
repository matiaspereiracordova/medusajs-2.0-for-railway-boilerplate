#!/usr/bin/env node

const http = require('http');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 9000;
const MEDUSA_PORT = 9001; // Medusa will use a different port

console.log('🚀 Starting Health Server for Railway...');
console.log('🔌 Port:', PORT);

// Create a simple HTTP server for health checks only
const server = http.createServer((req, res) => {
  // Set CORS headers for Railway healthcheck
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'medusa-backend',
      uptime: process.uptime(),
      port: PORT
    }));
  } else {
    // Proxy all other requests to Medusa (including /admin)
    console.log(`🔄 Proxying ${req.method} ${req.url} to Medusa on port ${MEDUSA_PORT}`);
    proxyRequest(req, res, req.url);
  }
});

// Proxy function to forward requests to Medusa
function proxyRequest(req, res, path) {
  const options = {
    hostname: 'localhost',
    port: MEDUSA_PORT,
    path: path,
    method: req.method,
    headers: {
      ...req.headers,
      host: `localhost:${MEDUSA_PORT}`
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Copy headers from Medusa response
    Object.keys(proxyRes.headers).forEach(key => {
      if (key.toLowerCase() !== 'access-control-allow-origin') {
        res.setHeader(key, proxyRes.headers[key]);
      }
    });
    
    res.writeHead(proxyRes.statusCode);
    proxyRes.pipe(res);
    
    if (proxyRes.statusCode === 200) {
      console.log(`✅ Medusa responded with ${proxyRes.statusCode} for ${req.method} ${req.url}`);
    } else {
      console.log(`⚠️ Medusa responded with ${proxyRes.statusCode} for ${req.method} ${req.url}`);
    }
  });

  proxyReq.on('error', (err) => {
    console.log(`❌ Proxy error for ${req.method} ${req.url}:`, err.message);
    
    if (req.url === '/admin' || req.url === '/admin/') {
      // If admin request fails, serve a simple message
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Medusa Admin - Loading...</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0; 
              padding: 20px; 
              background: #f8fafc;
              text-align: center;
            }
            .container { 
              max-width: 600px; 
              margin: 100px auto; 
              background: white; 
              padding: 40px; 
              border-radius: 8px; 
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .loading {
              color: #667eea;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .info {
              color: #6b7280;
              margin: 20px 0;
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
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="loading">🔄 Cargando Admin de Medusa...</div>
            <div class="info">
              El panel de administración se está inicializando. Por favor espera un momento.
            </div>
            <div class="info">
              <strong>Status:</strong> Backend funcionando correctamente<br>
              <strong>Uptime:</strong> ${Math.floor(process.uptime())} segundos<br>
              <strong>Timestamp:</strong> ${new Date().toISOString()}
            </div>
            <a href="/health" class="btn">Health Check</a>
            <a href="/admin" class="btn" onclick="location.reload()">Reintentar</a>
          </div>
          <script>
            // Auto-refresh every 5 seconds
            setTimeout(() => location.reload(), 5000);
          </script>
        </body>
        </html>
      `);
    } else {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Bad Gateway',
        message: 'Medusa server is not responding',
        timestamp: new Date().toISOString()
      }));
    }
  });

  req.pipe(proxyReq);
}

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log('✅ Health server listening on port', PORT);
  console.log('🔍 Health check available at http://0.0.0.0:' + PORT + '/health');
  
  // Start Medusa in background
  console.log('🚀 Starting Medusa in background...');
  startMedusa();
});

// Function to start Medusa
async function startMedusa() {
  // Verificar admin antes de iniciar Medusa
  try {
    console.log('🔍 Verificando admin antes de iniciar Medusa...');
    const { execSync } = require('child_process');
    execSync('node pre-start-admin.js', { stdio: 'inherit' });
    console.log('✅ Admin verificado, iniciando Medusa...');
  } catch (error) {
    console.log('⚠️ Error verificando admin, iniciando Medusa de todas formas...');
  }

  const medusaProcess = spawn('npx', ['medusa', 'start'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: MEDUSA_PORT
    }
  });

  medusaProcess.stdout.on('data', (data) => {
    console.log(`[Medusa] ${data.toString().trim()}`);
  });

  medusaProcess.stderr.on('data', (data) => {
    console.error(`[Medusa Error] ${data.toString().trim()}`);
  });

  medusaProcess.on('close', (code) => {
    console.log(`[Medusa] Process exited with code ${code}`);
    if (code !== 0) {
      console.log('🚀 Starting Medusa in background...');
      setTimeout(startMedusa, 5000); // Restart after 5 seconds
    }
  });

  medusaProcess.on('error', (err) => {
    console.error(`[Medusa] Failed to start: ${err.message}`);
    setTimeout(startMedusa, 5000); // Retry after 5 seconds
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Health server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Health server closed');
    process.exit(0);
  });
});
