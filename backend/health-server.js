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
    proxyToMedusa(req, res);
  }
});

// Start the health server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Health server listening on port ${PORT}`);
  console.log(`🔍 Health check available at http://0.0.0.0:${PORT}/health`);
  
  // Start Medusa in the background
  console.log('🚀 Starting Medusa in background...');
  startMedusa();
});

// Proxy function to forward requests to Medusa
function proxyToMedusa(req, res) {
  console.log(`🔄 Proxying ${req.method} ${req.url} to Medusa on port ${MEDUSA_PORT}`);
  
  const options = {
    hostname: 'localhost',
    port: MEDUSA_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      'host': `localhost:${MEDUSA_PORT}`
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    console.log(`✅ Medusa responded with ${proxyRes.statusCode} for ${req.method} ${req.url}`);
    
    // Copy response headers
    Object.keys(proxyRes.headers).forEach(key => {
      res.setHeader(key, proxyRes.headers[key]);
    });
    
    res.writeHead(proxyRes.statusCode);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (error) => {
    console.error(`❌ Proxy error for ${req.method} ${req.url}:`, error.message);
    res.writeHead(503, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      error: 'Medusa service unavailable',
      status: 'error',
      message: error.message
    }));
  });

  // Handle request timeout
  proxyReq.setTimeout(10000, () => {
    console.error(`⏰ Proxy timeout for ${req.method} ${req.url}`);
    proxyReq.destroy();
    res.writeHead(504, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      error: 'Request timeout',
      status: 'error'
    }));
  });

  req.pipe(proxyReq);
}

// Start Medusa process
function startMedusa() {
  console.log('🚀 Starting Medusa in background...');
  
  const medusaProcess = spawn('npx', ['medusa', 'start', '--config', 'medusa-config-railway.js'], {
    stdio: 'inherit', // Show Medusa output in logs
    env: {
      ...process.env,
      PORT: MEDUSA_PORT,
      MEDUSA_DISABLE_ADMIN: 'true',
      // Ensure CORS is properly configured
      ADMIN_CORS: '*',
      AUTH_CORS: '*',
      STORE_CORS: '*'
    }
  });

  medusaProcess.on('error', (error) => {
    console.error('❌ Failed to start Medusa:', error);
  });

  medusaProcess.on('exit', (code) => {
    console.log(`🛑 Medusa process exited with code ${code}`);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    medusaProcess.kill('SIGTERM');
    server.close(() => {
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    medusaProcess.kill('SIGINT');
    server.close(() => {
      process.exit(0);
    });
  });
}

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});
