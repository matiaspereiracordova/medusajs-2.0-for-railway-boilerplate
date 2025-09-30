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
    // Proxy all other requests to Medusa
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
    // Forward response headers
    Object.keys(proxyRes.headers).forEach(key => {
      res.setHeader(key, proxyRes.headers[key]);
    });
    
    res.writeHead(proxyRes.statusCode);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`❌ Proxy error for ${req.method} ${path}:`, err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Bad Gateway',
      message: 'Medusa server is not responding',
      timestamp: new Date().toISOString()
    }));
  });

  req.pipe(proxyReq);
}

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log('✅ Health server listening on port', PORT);
  console.log('🔍 Health check available at http://0.0.0.0:' + PORT + '/health');
  
  // Start Medusa in background
  console.log('🚀 Starting Medusa in background...');
  const medusaProcess = spawn('npm', ['run', 'start:medusa'], {
    stdio: 'pipe',
    shell: true,
    env: { ...process.env }
  });

  medusaProcess.stdout.on('data', (data) => {
    console.log('[Medusa]', data.toString().trim());
  });

  medusaProcess.stderr.on('data', (data) => {
    console.error('[Medusa Error]', data.toString().trim());
  });

  medusaProcess.on('close', (code) => {
    console.log(`[Medusa] Process exited with code ${code}`);
    
    // Restart Medusa if it crashes
    if (code !== 0) {
      console.log('🔄 Restarting Medusa in 5 seconds...');
      setTimeout(() => {
        console.log('🚀 Starting Medusa in background...');
        const newMedusaProcess = spawn('npm', ['run', 'start:medusa'], {
          stdio: 'pipe',
          shell: true,
          env: { ...process.env }
        });

        newMedusaProcess.stdout.on('data', (data) => {
          console.log('[Medusa]', data.toString().trim());
        });

        newMedusaProcess.stderr.on('data', (data) => {
          console.error('[Medusa Error]', data.toString().trim());
        });

        newMedusaProcess.on('close', (code) => {
          console.log(`[Medusa] Process exited with code ${code}`);
        });
      }, 5000);
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Health server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Health server closed');
    process.exit(0);
  });
});