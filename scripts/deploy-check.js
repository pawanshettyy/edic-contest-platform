#!/usr/bin/env node

/**
 * EDIC Contest Platform - Deployment Verification Script
 * This script performs pre-deployment checks and validates the build
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the project root directory (parent of scripts folder)
const projectRoot = path.join(__dirname, '..');

console.log('🚀 EDIC Contest Platform - Deployment Verification\n');
console.log(`📁 Project root: ${projectRoot}\n`);

// Check if required files exist
const requiredFiles = [
  'package.json',
  'next.config.ts',
  'vercel.json',
  '.env.example',
  'database/optimized-schema.sql',
  'DEPLOYMENT_GUIDE.md'
];

console.log('📋 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please ensure all files are present before deployment.');
  process.exit(1);
}

// Check package.json structure
console.log('\n📦 Validating package.json...');
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const requiredScripts = ['build', 'start', 'dev'];
requiredScripts.forEach(script => {
  if (packageJson.scripts[script]) {
    console.log(`✅ Script: ${script}`);
  } else {
    console.log(`❌ Script: ${script} - MISSING`);
  }
});

// Run build test
console.log('\n🔨 Running production build test...');
const buildCommand = `cd "${projectRoot}" && npm run build`;
exec(buildCommand, (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Build failed:');
    console.log(stderr);
    process.exit(1);
  }
  
  console.log('✅ Build successful!');
  
  // Check for .env.local (development only)
  const envLocalPath = path.join(projectRoot, '.env.local');
  if (fs.existsSync(envLocalPath)) {
    console.log('\n⚠️  WARNING: .env.local found. Make sure sensitive data is not committed to git.');
  }
  
  // Environment variables check
  console.log('\n🔧 Environment Variables Checklist:');
  console.log('Make sure these are set in Vercel:');
  console.log('  ✓ DATABASE_URL');
  console.log('  ✓ JWT_SECRET');
  console.log('  ✓ NEXT_PUBLIC_APP_URL');
  console.log('  ✓ NODE_ENV=production');
  
  console.log('\n🎉 Deployment verification complete!');
  console.log('\nNext steps:');
  console.log('1. Push your code to GitHub');
  console.log('2. Connect repository to Vercel');
  console.log('3. Set environment variables in Vercel dashboard');
  console.log('4. Deploy and test');
  console.log('\nFor detailed instructions, see DEPLOYMENT_GUIDE.md');
});
