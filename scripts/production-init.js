#!/usr/bin/env node

/**
 * Quick Production Setup Script
 * 
 * One-command production setup for EDIC Contest Platform
 * Runs all necessary setup steps in sequence
 * 
 * Usage: npm run production:init
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

console.log('🚀 EDIC Contest Platform - Quick Production Setup');
console.log('================================================');
console.log('');

async function runCommand(command, description, optional = false) {
  try {
    console.log(`📋 ${description}...`);
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !optional) {
      console.log(`⚠️  Warning: ${stderr.trim()}`);
    }
    
    if (stdout) {
      console.log(stdout.trim());
    }
    
    console.log(`✅ ${description} completed`);
    console.log('');
    return true;
  } catch (error) {
    if (optional) {
      console.log(`⚠️  ${description} skipped: ${error.message}`);
      console.log('');
      return false;
    } else {
      console.error(`❌ ${description} failed: ${error.message}`);
      console.log('');
      throw error;
    }
  }
}

async function quickSetup() {
  try {
    console.log('🔧 Starting automated production setup...');
    console.log('');

    // Step 1: Environment setup
    await runCommand(
      'node scripts/setup-env.js',
      'Step 1: Environment Configuration'
    );

    // Step 2: Type checking
    await runCommand(
      'npm run type-check',
      'Step 2: TypeScript Validation'
    );

    // Step 3: Build verification
    await runCommand(
      'npm run build',
      'Step 3: Build Verification'
    );

    // Step 4: Database migrations
    await runCommand(
      'node scripts/migrate-database.js',
      'Step 4: Database Migration Generation'
    );

    console.log('🎉 Quick setup completed successfully!');
    console.log('');
    console.log('📋 Manual steps remaining:');
    console.log('=========================');
    console.log('1. Apply database migrations to your PostgreSQL database');
    console.log('2. Set environment variables in your hosting platform');
    console.log('3. Deploy: npm run deploy');
    console.log('4. Initialize production: npm run setup:production');
    console.log('5. Verify deployment: npm run verify:deployment');
    console.log('');
    console.log('📖 For detailed instructions, see: PRODUCTION-DEPLOYMENT.md');
    
    return true;
    
  } catch (error) {
    console.error('❌ Quick setup failed:', error.message);
    console.error('');
    console.log('🔧 Manual setup required:');
    console.log('=========================');
    console.log('1. Review the error above');
    console.log('2. Fix any issues');
    console.log('3. Follow PRODUCTION-DEPLOYMENT.md for manual setup');
    
    return false;
  }
}

// Run quick setup
if (require.main === module) {
  quickSetup().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { quickSetup };
