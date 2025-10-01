#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Copying admin assets to correct location...');

const sourceDir = path.join(process.cwd(), '.medusa', 'server', 'public', 'admin');
const targetDir = path.join(process.cwd(), 'admin', 'dist');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`📁 Created directory: ${targetDir}`);
}

// Copy index.html
const indexSource = path.join(sourceDir, 'index.html');
const indexTarget = path.join(targetDir, 'index.html');

if (fs.existsSync(indexSource)) {
  fs.copyFileSync(indexSource, indexTarget);
  console.log(`✅ Copied index.html`);
} else {
  console.log(`❌ index.html not found at ${indexSource}`);
}

// Copy assets directory
const assetsSource = path.join(sourceDir, 'assets');
const assetsTarget = path.join(targetDir, 'assets');

if (fs.existsSync(assetsSource)) {
  // Remove existing assets directory
  if (fs.existsSync(assetsTarget)) {
    fs.rmSync(assetsTarget, { recursive: true, force: true });
  }
  
  // Copy entire assets directory
  fs.cpSync(assetsSource, assetsTarget, { recursive: true });
  console.log(`✅ Copied assets directory`);
} else {
  console.log(`❌ assets directory not found at ${assetsSource}`);
}

console.log('🎉 Admin assets copied successfully!');
