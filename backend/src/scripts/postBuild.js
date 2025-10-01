const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const MEDUSA_SERVER_PATH = path.join(process.cwd(), '.medusa', 'server');

// Check if .medusa/server exists - if not, build process failed
if (!fs.existsSync(MEDUSA_SERVER_PATH)) {
  throw new Error('.medusa/server directory not found. This indicates the Medusa build process failed. Please check for build errors.');
}

// Copy package-lock.json if it exists
const packageLockPath = path.join(process.cwd(), 'package-lock.json');
if (fs.existsSync(packageLockPath)) {
  fs.copyFileSync(
    packageLockPath,
    path.join(MEDUSA_SERVER_PATH, 'package-lock.json')
  );
}

// Copy .env if it exists
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  fs.copyFileSync(
    envPath,
    path.join(MEDUSA_SERVER_PATH, '.env')
  );
}

// Install dependencies
console.log('Installing dependencies in .medusa/server...');
try {
  execSync('npm ci --omit=dev --legacy-peer-deps', { 
    cwd: MEDUSA_SERVER_PATH,
    stdio: 'inherit'
  });
} catch (error) {
  console.log('npm ci failed, trying npm install...');
  execSync('npm install --omit=dev --legacy-peer-deps', { 
    cwd: MEDUSA_SERVER_PATH,
    stdio: 'inherit'
  });
}

// Run Railway admin fix
console.log('Running Railway admin fix...');
try {
  execSync('node ../fix-railway-admin.js', { 
    cwd: MEDUSA_SERVER_PATH,
    stdio: 'inherit'
  });
} catch (error) {
  console.log('Railway admin fix failed, trying from root...');
  try {
    execSync('node fix-railway-admin.js', { 
      cwd: process.cwd(),
      stdio: 'inherit'
    });
  } catch (error2) {
    console.error('Railway admin fix failed:', error2.message);
  }
}
