#!/usr/bin/env node

/**
 * Production Deployment Verification Script
 * Verifies all requirements are met for Vercel deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 EDIC Contest Platform - Production Deployment Verification\n');

const checks = [];

// 1. Check essential files exist
const requiredFiles = [
  'package.json',
  'next.config.ts',
  'middleware.ts',
  'tsconfig.json',
  'schema.sql',
  'README.md',
  '.env.production.example',
  'vercel.json',
  'scripts/setup-production.js',
  'scripts/setup-development.js'
];

console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  checks.push({ name: `Required file: ${file}`, status: exists });
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// 2. Check package.json scripts
console.log('\n📋 Checking package.json scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['build', 'start', 'vercel-build', 'setup:production', 'setup:development'];

requiredScripts.forEach(script => {
  const exists = packageJson.scripts && packageJson.scripts[script];
  checks.push({ name: `Script: ${script}`, status: !!exists });
  console.log(`${exists ? '✅' : '❌'} ${script}: ${exists || 'Missing'}`);
});

// 3. Check environment examples
console.log('\n🔐 Checking environment configuration...');
const envProdExample = fs.existsSync('.env.production.example');
checks.push({ name: 'Production env example', status: envProdExample });
console.log(`${envProdExample ? '✅' : '❌'} .env.production.example`);

if (envProdExample) {
  const envContent = fs.readFileSync('.env.production.example', 'utf8');
  const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'NEXT_PUBLIC_APP_URL'];
  
  requiredVars.forEach(varName => {
    const exists = envContent.includes(varName);
    checks.push({ name: `Env var: ${varName}`, status: exists });
    console.log(`${exists ? '✅' : '❌'} ${varName}`);
  });
}

// 4. Check schema file
console.log('\n🗃️ Checking database schema...');
if (fs.existsSync('schema.sql')) {
  const schemaContent = fs.readFileSync('schema.sql', 'utf8');
  const requiredTables = ['teams', 'admin_users', 'quiz_questions', 'contest_config'];
  
  requiredTables.forEach(table => {
    const exists = schemaContent.includes(`CREATE TABLE IF NOT EXISTS ${table}`);
    checks.push({ name: `Schema table: ${table}`, status: exists });
    console.log(`${exists ? '✅' : '❌'} Table: ${table}`);
  });
}

// 5. Check TypeScript compilation
console.log('\n🔧 TypeScript compilation check...');
try {
  const { execSync } = require('child_process');
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  checks.push({ name: 'TypeScript compilation', status: true });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  checks.push({ name: 'TypeScript compilation', status: false });
  console.log('❌ TypeScript compilation failed');
  console.log('Error:', error.message);
}

// 6. Check for unnecessary files
console.log('\n🧹 Checking for unnecessary files...');
const unnecessaryPatterns = [
  'database/',
  '*.md',  // Should only have README.md
  'scripts/*test*',
  'scripts/*check*',
  'scripts/*debug*'
];

const cleanupNeeded = [];
unnecessaryPatterns.forEach(pattern => {
  try {
    const { execSync } = require('child_process');
    const files = execSync(`dir /B ${pattern.replace(/\//g, '\\')} 2>nul || echo ""`, { 
      encoding: 'utf8',
      shell: 'cmd.exe'
    }).trim();
    
    if (files && files !== '' && !files.includes('file not found')) {
      if (pattern === '*.md') {
        // Check if it's only README.md
        const mdFiles = files.split('\n').filter(f => f.trim());
        const unwantedMd = mdFiles.filter(f => f.trim() !== 'README.md');
        if (unwantedMd.length > 0) {
          cleanupNeeded.push(`Extra .md files: ${unwantedMd.join(', ')}`);
        }
      } else if (!pattern.includes('database/')) {
        cleanupNeeded.push(`${pattern}: ${files}`);
      }
    }
  } catch (e) {
    // Ignore errors for pattern matching
  }
});

if (cleanupNeeded.length === 0) {
  checks.push({ name: 'Codebase cleanup', status: true });
  console.log('✅ Codebase is clean');
} else {
  checks.push({ name: 'Codebase cleanup', status: false });
  console.log('❌ Cleanup needed:');
  cleanupNeeded.forEach(item => console.log(`   - ${item}`));
}

// 7. Check README completeness
console.log('\n📖 Checking README completeness...');
if (fs.existsSync('README.md')) {
  const readmeContent = fs.readFileSync('README.md', 'utf8');
  const requiredSections = ['Features', 'Quick Start', 'Deployment', 'Environment', 'Database'];
  
  requiredSections.forEach(section => {
    const exists = readmeContent.toLowerCase().includes(section.toLowerCase());
    checks.push({ name: `README section: ${section}`, status: exists });
    console.log(`${exists ? '✅' : '❌'} ${section} section`);
  });
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 DEPLOYMENT READINESS SUMMARY');
console.log('='.repeat(60));

const passed = checks.filter(c => c.status).length;
const total = checks.length;
const percentage = Math.round((passed / total) * 100);

console.log(`Status: ${passed}/${total} checks passed (${percentage}%)`);

if (percentage === 100) {
  console.log('\n🎉 SUCCESS! Your application is ready for production deployment.');
  console.log('\nNext steps:');
  console.log('1. Set up production environment variables in Vercel');
  console.log('2. Run: npm run setup:production (after database setup)');
  console.log('3. Deploy: vercel --prod');
} else {
  console.log('\n⚠️  ATTENTION NEEDED! Please address the failed checks before deployment.');
  console.log('\nFailed checks:');
  checks.filter(c => !c.status).forEach(check => {
    console.log(`❌ ${check.name}`);
  });
}

console.log('\n🔗 Resources:');
console.log('• README.md - Complete setup and deployment guide');
console.log('• schema.sql - Database schema for production setup');
console.log('• scripts/setup-production.js - Production database setup');
console.log('• .env.production.example - Environment variables template');

process.exit(percentage === 100 ? 0 : 1);
