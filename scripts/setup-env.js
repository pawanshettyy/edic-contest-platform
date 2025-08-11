#!/usr/bin/env node

/**
 * Environment Setup Script
 * 
 * Helps set up environment variables for production deployment
 * Validates required environment variables and provides setup guidance
 * 
 * Usage: npm run setup:env
 */

const fs = require('fs');
const path = require('path');

console.log('⚙️  EDIC Contest Platform - Environment Setup');
console.log('=============================================');
console.log('');

// Required environment variables for production
const REQUIRED_VARS = [
  {
    name: 'DATABASE_URL',
    description: 'Neon PostgreSQL connection string',
    example: 'postgresql://user:password@host/dbname?sslmode=require',
    required: true
  },
  {
    name: 'JWT_SECRET',
    description: 'Secret key for JWT token signing (min 32 characters)',
    example: 'your-super-secret-jwt-key-at-least-32-chars',
    required: true
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    description: 'Public URL of your deployed application',
    example: 'https://your-app.vercel.app',
    required: false
  },
  {
    name: 'NODE_ENV',
    description: 'Environment mode',
    example: 'production',
    required: false
  }
];

// Optional but recommended variables
const OPTIONAL_VARS = [
  {
    name: 'VERCEL_URL',
    description: 'Automatically set by Vercel (for deployments)',
    example: 'your-app-abc123.vercel.app',
    required: false
  },
  {
    name: 'ADMIN_EMAIL',
    description: 'Default admin email for setup',
    example: 'admin@yourdomain.com',
    required: false
  },
  {
    name: 'ADMIN_PASSWORD',
    description: 'Default admin password for setup',
    example: 'secure-admin-password',
    required: false
  }
];

function generateJWTSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...');
  console.log('');

  const missing = [];
  const present = [];

  // Check required variables
  REQUIRED_VARS.forEach(envVar => {
    const value = process.env[envVar.name];
    if (!value && envVar.required) {
      missing.push(envVar);
    } else if (value) {
      present.push(envVar);
    }
  });

  // Show results
  if (present.length > 0) {
    console.log('✅ Found environment variables:');
    present.forEach(envVar => {
      const value = process.env[envVar.name];
      const masked = envVar.name.includes('SECRET') || envVar.name.includes('PASSWORD') 
        ? '*'.repeat(Math.min(value.length, 20))
        : value.length > 50 
        ? value.substring(0, 30) + '...'
        : value;
      console.log(`   ${envVar.name}: ${masked}`);
    });
    console.log('');
  }

  if (missing.length > 0) {
    console.log('❌ Missing required environment variables:');
    missing.forEach(envVar => {
      console.log(`   ${envVar.name}: ${envVar.description}`);
    });
    console.log('');
    return false;
  }

  console.log('✅ All required environment variables are present!');
  console.log('');
  return true;
}

function createEnvTemplate() {
  console.log('📝 Creating .env.example template...');
  
  const envContent = [
    '# EDIC Contest Platform - Environment Variables',
    '# ============================================',
    '',
    '# Required Variables',
    '# -----------------',
    ''
  ];

  REQUIRED_VARS.forEach(envVar => {
    envContent.push(`# ${envVar.description}`);
    if (envVar.name === 'JWT_SECRET') {
      envContent.push(`${envVar.name}=${generateJWTSecret()}`);
    } else {
      envContent.push(`${envVar.name}=${envVar.example}`);
    }
    envContent.push('');
  });

  envContent.push('# Optional Variables');
  envContent.push('# ------------------');
  envContent.push('');

  OPTIONAL_VARS.forEach(envVar => {
    envContent.push(`# ${envVar.description}`);
    envContent.push(`# ${envVar.name}=${envVar.example}`);
    envContent.push('');
  });

  const envPath = path.join(process.cwd(), '.env.example');
  fs.writeFileSync(envPath, envContent.join('\n'));
  
  console.log(`✅ Created .env.example at: ${envPath}`);
  console.log('');
}

function validateEnvironment() {
  const issues = [];

  // Check JWT secret length
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    issues.push('JWT_SECRET should be at least 32 characters long for security');
  }

  // Check DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.includes('postgresql://')) {
    issues.push('DATABASE_URL should be a PostgreSQL connection string');
  }

  // Check NODE_ENV
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv && !['development', 'production', 'test'].includes(nodeEnv)) {
    issues.push('NODE_ENV should be one of: development, production, test');
  }

  if (issues.length > 0) {
    console.log('⚠️  Environment validation warnings:');
    issues.forEach(issue => {
      console.log(`   • ${issue}`);
    });
    console.log('');
  } else {
    console.log('✅ Environment validation passed!');
    console.log('');
  }

  return issues.length === 0;
}

function showDeploymentGuide() {
  console.log('🚀 Production Deployment Guide');
  console.log('==============================');
  console.log('');
  console.log('1. Set up your environment variables:');
  console.log('   • Copy .env.example to .env.local for local development');
  console.log('   • Set environment variables in your hosting platform');
  console.log('');
  console.log('2. For Vercel deployment:');
  console.log('   • Run: vercel env add DATABASE_URL');
  console.log('   • Run: vercel env add JWT_SECRET');
  console.log('   • Deploy: npm run deploy');
  console.log('');
  console.log('3. After deployment:');
  console.log('   • Run: npm run setup:production');
  console.log('   • Run: npm run verify:deployment');
  console.log('');
  console.log('4. Configure your contest:');
  console.log('   • Access admin panel at /admin/login');
  console.log('   • Set up contest details at /admin/config');
  console.log('   • Add questions at /admin/questions');
  console.log('');
}

async function setupEnvironment() {
  try {
    console.log('Starting environment setup...');
    console.log('');

    // Create template
    createEnvTemplate();

    // Check current environment
    const hasRequired = checkEnvironmentVariables();

    // Validate environment
    validateEnvironment();

    if (hasRequired) {
      console.log('🎉 Environment setup complete!');
      console.log('');
      console.log('✅ Next steps:');
      console.log('  1. Deploy your application');
      console.log('  2. Run: npm run setup:production');
      console.log('  3. Run: npm run verify:deployment');
    } else {
      console.log('📋 Setup required environment variables:');
      console.log('======================================');
      console.log('');
      
      REQUIRED_VARS.filter(v => v.required).forEach(envVar => {
        console.log(`${envVar.name}:`);
        console.log(`  Description: ${envVar.description}`);
        console.log(`  Example: ${envVar.example}`);
        console.log('');
      });

      showDeploymentGuide();
    }

    return hasRequired;
    
  } catch (error) {
    console.error('❌ Environment setup failed:', error.message);
    return false;
  }
}

// Run the setup
if (require.main === module) {
  setupEnvironment().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { setupEnvironment, checkEnvironmentVariables, generateJWTSecret };
