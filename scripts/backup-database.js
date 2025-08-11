#!/usr/bin/env node

/**
 * Database Backup Script
 * 
 * Creates a backup of the production database data
 * Exports data to JSON format for easy restoration
 * 
 * Usage: npm run backup:database
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

// Configuration
const PRODUCTION_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_APP_URL 
  ? process.env.NEXT_PUBLIC_APP_URL
  : 'http://localhost:3000';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const BACKUP_FILE = path.join(BACKUP_DIR, `edic-backup-${TIMESTAMP}.json`);

console.log('💾 EDIC Contest Platform - Database Backup');
console.log('==========================================');
console.log(`Source: ${PRODUCTION_URL}`);
console.log(`Backup file: ${BACKUP_FILE}`);
console.log('');

async function makeRequest(url, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EDIC-Backup-Script/1.0',
        ...headers
      }
    };

    const protocol = urlObj.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsed
          });
        } catch (err) {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
            raw: true
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });
    
    req.end();
  });
}

async function backupDatabase() {
  try {
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      console.log(`📁 Created backup directory: ${BACKUP_DIR}`);
    }

    const backup = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      source: PRODUCTION_URL,
      data: {}
    };

    console.log('📋 Step 1: Backing up admin data...');
    
    // Note: We'll need to create backup endpoints in the API
    // For now, this is a template structure
    
    const endpoints = [
      { name: 'teams', endpoint: '/api/admin/teams' },
      { name: 'questions', endpoint: '/api/admin/questions' },
      { name: 'config', endpoint: '/api/admin/config' },
      { name: 'logs', endpoint: '/api/admin/logs?limit=1000' }
    ];

    for (const { name, endpoint } of endpoints) {
      try {
        console.log(`  📊 Backing up ${name}...`);
        const response = await makeRequest(`${PRODUCTION_URL}${endpoint}`);
        
        if (response.statusCode === 200) {
          backup.data[name] = response.data;
          console.log(`  ✅ ${name} backed up successfully`);
        } else {
          console.log(`  ⚠️ ${name} backup failed (${response.statusCode})`);
          backup.data[name] = { error: `HTTP ${response.statusCode}`, message: response.data };
        }
      } catch (error) {
        console.log(`  ❌ ${name} backup error: ${error.message}`);
        backup.data[name] = { error: error.message };
      }
    }

    console.log('');
    console.log('📋 Step 2: Saving backup file...');
    
    // Write backup to file
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2));
    
    const fileSize = fs.statSync(BACKUP_FILE).size;
    const fileSizeKB = (fileSize / 1024).toFixed(2);
    
    console.log('✅ Backup completed successfully!');
    console.log('');
    console.log('📊 Backup Summary:');
    console.log('==================');
    console.log(`File: ${BACKUP_FILE}`);
    console.log(`Size: ${fileSizeKB} KB`);
    console.log(`Timestamp: ${backup.timestamp}`);
    console.log('');
    console.log('📁 Backed up data:');
    Object.keys(backup.data).forEach(key => {
      const data = backup.data[key];
      if (data.error) {
        console.log(`  ❌ ${key}: ${data.error}`);
      } else {
        const count = Array.isArray(data) ? data.length : 
                     data.teams ? data.teams.length :
                     data.questions ? data.questions.length :
                     'Present';
        console.log(`  ✅ ${key}: ${count} records`);
      }
    });
    
    console.log('');
    console.log('💡 Note: This backup contains application data only.');
    console.log('   For complete database backups, use your hosting provider\'s backup tools.');
    
    return true;
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    console.error('');
    console.log('🔧 Troubleshooting:');
    console.log('===================');
    console.log('1. Verify the application is accessible');
    console.log('2. Check API endpoints are responding');
    console.log('3. Ensure proper authentication if required');
    console.log('4. Verify write permissions to backup directory');
    
    return false;
  }
}

// Run the backup
if (import.meta.url === `file://${__filename}`) {
  backupDatabase().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { backupDatabase };
