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
  const options = {
    hostname: 'localhost',
    port: MEDUSA_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (error) => {
    console.error('Proxy error:', error);
    res.writeHead(503);
    res.end(JSON.stringify({ 
      error: 'Medusa service unavailable',
      status: 'error'
    }));
  });

  req.pipe(proxyReq);
}

// Start Medusa process
function startMedusa() {
  console.log('🚀 Starting Medusa in background...');
  
  const medusaProcess = spawn('npx', ['medusa', 'start'], {
    stdio: 'inherit', // Show Medusa output in logs
    env: {
      ...process.env,
      PORT: MEDUSA_PORT,
      MEDUSA_DISABLE_ADMIN: 'true'
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
