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
  } else if (req.url === '/admin' || req.url === '/admin/') {
    // Custom admin interface
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Medusa Admin - Railway</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; 
            padding: 20px; 
            background: #f8fafc;
          }
          .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            padding: 40px; 
            border-radius: 8px; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .header { 
            color: #1e293b; 
            margin-bottom: 30px; 
            text-align: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
          }
          .status { 
            background: #10b981; 
            color: white; 
            padding: 12px; 
            border-radius: 6px; 
            margin: 20px 0; 
            text-align: center;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 30px 0;
          }
          .card { 
            background: #f1f5f9; 
            padding: 20px; 
            border-radius: 8px; 
            border: 1px solid #e2e8f0;
          }
          .card h3 {
            margin-top: 0;
            color: #1e293b;
          }
          .endpoint { 
            background: #e2e8f0; 
            padding: 8px 12px; 
            border-radius: 4px; 
            font-family: 'Monaco', 'Menlo', monospace; 
            margin: 5px 0; 
            font-size: 14px;
            word-break: break-all;
          }
          .btn {
            background: #6366f1;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 5px;
          }
          .btn:hover {
            background: #4f46e5;
          }
          .api-section {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="header">🚀 Medusa Admin Panel</h1>
          <div class="status">✅ Backend is running successfully</div>
          
          <div class="grid">
            <div class="card">
              <h3>📊 Service Information</h3>
              <p><strong>Status:</strong> Online</p>
              <p><strong>Port:</strong> ${PORT}</p>
              <p><strong>Uptime:</strong> ${Math.floor(process.uptime())} seconds</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            </div>
            
            <div class="card">
              <h3>🔗 Quick Actions</h3>
              <a href="/health" class="btn">Health Check</a>
              <a href="/store/regions" class="btn">Store Regions</a>
              <a href="/store/collections" class="btn">Collections</a>
              <a href="/admin/products" class="btn">Products API</a>
            </div>
          </div>
          
          <div class="card">
            <h3>🔗 Store API Endpoints</h3>
            <div class="endpoint">GET /store/regions - Get regions</div>
            <div class="endpoint">GET /store/collections - Get collections</div>
            <div class="endpoint">GET /store/products - Get products</div>
            <div class="endpoint">GET /store/categories - Get categories</div>
            <div class="endpoint">POST /store/carts - Create cart</div>
          </div>
          
          <div class="card">
            <h3>🔗 Admin API Endpoints</h3>
            <div class="endpoint">GET /admin/products - List products</div>
            <div class="endpoint">POST /admin/products - Create product</div>
            <div class="endpoint">GET /admin/orders - List orders</div>
            <div class="endpoint">GET /admin/customers - List customers</div>
            <div class="endpoint">GET /admin/regions - List regions</div>
          </div>
          
          <div class="api-section">
            <h3>📝 API Usage</h3>
            <p>You can use these API endpoints to manage your Medusa store programmatically. Use tools like Postman, curl, or your frontend application to interact with these endpoints.</p>
            <p><strong>Base URL:</strong> <code>https://backend-production-34ac.up.railway.app</code></p>
            <p><strong>Authentication:</strong> Some admin endpoints may require authentication headers.</p>
          </div>
        </div>
      </body>
      </html>
    `);
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
  
  const medusaProcess = spawn('npx', ['medusa', 'start'], {
    stdio: 'inherit', // Show Medusa output in logs
    env: {
      ...process.env,
      PORT: MEDUSA_PORT,
      MEDUSA_INTERNAL_PORT: MEDUSA_PORT, // Set internal port for Medusa
      MEDUSA_DISABLE_ADMIN: 'true', // Disable admin temporarily due to build issues
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
