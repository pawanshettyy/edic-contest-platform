#!/usr/bin/env node

/**
 * Production Setup Script
 * Sets up the production database with admin users and initial configuration
 * 
 * Usage: node scripts/setup-production.js
 * 
 * This script:
 * 1. Validates environment variables
 * 2. Creates admin users
 * 3. Sets up initial configuration
 * 4. Verifies the setup
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.production if it exists
const envFile = path.join(process.cwd(), '.env.production');
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

// Configuration
const config = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app',
  adminCredentials: [
    {
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      email: process.env.ADMIN_EMAIL || 'admin@example.com'
    }
  ]
};

/**
 * Make HTTP request helper
 */
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    
    req.end();
  });
}

/**
 * Setup admin user
 */
async function setupAdminUser(credentials) {
  console.log(`Setting up admin user: ${credentials.username}`);
  
  try {
    const url = new URL('/api/admin/auth/signin', config.baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Production-Setup-Script/1.0'
      }
    };
    
    const response = await makeRequest(options, {
      username: credentials.username,
      password: credentials.password
    });
    
    if (response.statusCode === 200) {
      console.log(`✅ Admin user ${credentials.username} authenticated successfully`);
      return response.body;
    } else {
      console.log(`❌ Failed to authenticate admin user ${credentials.username}:`, response.body);
      return null;
    }
    
  } catch (error) {
    console.error(`❌ Error setting up admin user ${credentials.username}:`, error.message);
    return null;
  }
}

/**
 * Verify database connection
 */
async function verifyDatabase() {
  console.log('Verifying database connection...');
  
  try {
    const url = new URL('/api/health', config.baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'Production-Setup-Script/1.0'
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200 && response.body?.status === 'ok') {
      console.log('✅ Database connection verified');
      return true;
    } else {
      console.log('❌ Database health check failed:', response.body);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error verifying database:', error.message);
    return false;
  }
}

/**
 * Setup initial configuration
 */
async function setupConfiguration() {
  console.log('Setting up initial configuration...');
  
  try {
    const url = new URL('/api/admin/config', config.baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'Production-Setup-Script/1.0'
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('✅ Configuration endpoint accessible');
      return true;
    } else {
      console.log('❌ Configuration setup failed:', response.body);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error setting up configuration:', error.message);
    return false;
  }
}

/**
 * Main setup function
 */
async function main() {
  console.log('🚀 Starting production setup...');
  console.log(`Target URL: ${config.baseUrl}`);
  console.log('');
  
  // Validate environment
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }
  
  if (!process.env.NEXTAUTH_SECRET) {
    console.error('❌ NEXTAUTH_SECRET environment variable is required');
    process.exit(1);
  }
  
  let success = true;
  
  // Step 1: Verify database
  const dbValid = await verifyDatabase();
  if (!dbValid) {
    success = false;
  }
  
  // Step 2: Setup admin users
  for (const credentials of config.adminCredentials) {
    const adminSetup = await setupAdminUser(credentials);
    if (!adminSetup) {
      success = false;
    }
  }
  
  // Step 3: Setup configuration
  const configSetup = await setupConfiguration();
  if (!configSetup) {
    success = false;
  }
  
  console.log('');
  if (success) {
    console.log('🎉 Production setup completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run database migrations: npm run migrate:database');
    console.log('2. Verify deployment: npm run verify:production');
    console.log('3. Monitor logs: npm run logs:production');
  } else {
    console.log('❌ Production setup completed with errors');
    console.log('Please check the logs above and resolve any issues');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
if (import.meta.url === `file://${__filename}`) {
  main().catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}

export { main, setupAdminUser, verifyDatabase, setupConfiguration };
