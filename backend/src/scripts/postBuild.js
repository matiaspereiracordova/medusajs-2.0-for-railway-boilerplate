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
    stdio: 'inherit',
    timeout: 60000 // 60 second timeout
  });
} catch (error) {
  console.log('npm ci failed, trying npm install...');
  execSync('npm install --omit=dev --legacy-peer-deps', { 
    cwd: MEDUSA_SERVER_PATH,
    stdio: 'inherit',
    timeout: 60000 // 60 second timeout
  });
}

// Run Railway admin fix (simplified)
console.log('Running Railway admin fix...');
try {
  // Check if fix script exists and run it
  const fixScriptPath = path.join(process.cwd(), 'fix-railway-admin.js');
  if (fs.existsSync(fixScriptPath)) {
    execSync('node fix-railway-admin.js', { 
      cwd: process.cwd(),
      stdio: 'inherit',
      timeout: 30000 // 30 second timeout
    });
  } else {
    console.log('Railway admin fix script not found, skipping...');
  }
} catch (error) {
  console.log('Railway admin fix failed:', error.message);
  // Don't fail the build if admin fix fails
}
