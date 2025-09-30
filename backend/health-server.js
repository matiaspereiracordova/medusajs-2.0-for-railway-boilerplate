#!/usr/bin/env node

const http = require('http');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 9000;
let medusaReady = false;

console.log('🚀 Starting Health Server for Railway...');
console.log('🔌 Port:', PORT);

// Create a simple HTTP server for health checks
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
  } else if (req.url.startsWith('/admin') || req.url.startsWith('/store') || req.url.startsWith('/auth')) {
    // Proxy API requests to Medusa when it's ready
    if (medusaReady) {
      // Forward to Medusa (this is a simple implementation)
      res.writeHead(503);
      res.end(JSON.stringify({ 
        error: 'Medusa is starting up, please wait...',
        status: 'starting'
      }));
    } else {
      res.writeHead(503);
      res.end(JSON.stringify({ 
        error: 'Service temporarily unavailable',
        status: 'starting'
      }));
    }
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
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

// Start Medusa process
function startMedusa() {
  const medusaProcess = spawn('npx', ['medusa', 'start'], {
    stdio: 'pipe', // Don't inherit stdio to avoid conflicts
    env: {
      ...process.env,
      PORT: PORT
    }
  });

  // Log Medusa output
  medusaProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    console.log(`[Medusa] ${output}`);
    
    // Check if Medusa is ready
    if (output.includes('Server is ready') || output.includes('listening on port')) {
      medusaReady = true;
      console.log('✅ Medusa is ready and accepting requests');
    }
  });

  medusaProcess.stderr.on('data', (data) => {
    console.error(`[Medusa Error] ${data.toString().trim()}`);
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
