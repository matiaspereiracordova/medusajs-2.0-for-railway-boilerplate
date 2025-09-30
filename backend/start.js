#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Medusa Backend for Railway...');
console.log('📍 Working directory:', process.cwd());
console.log('🔧 Node version:', process.version);
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
console.log('🔌 Port:', process.env.PORT || '9000');
console.log('🗄️ Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('🔑 JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('🍪 Cookie Secret:', process.env.COOKIE_SECRET ? 'Set' : 'Not set');

// Set environment variables for Railway
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Check required environment variables
const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'COOKIE_SECRET'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please set these variables in your Railway dashboard');
  process.exit(1);
}

// Start Medusa with verbose logging
const medusaProcess = spawn('npx', ['medusa', 'start'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: process.env.PORT || '9000',
    NODE_ENV: 'production'
  }
});

medusaProcess.on('error', (error) => {
  console.error('❌ Failed to start Medusa:', error);
  process.exit(1);
});

medusaProcess.on('exit', (code) => {
  console.log(`🛑 Medusa process exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  medusaProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  medusaProcess.kill('SIGINT');
});
