#!/usr/bin/env node

/**
 * Deployment Verification Script
 * 
 * Verifies that the production deployment is working correctly
 * Tests all critical endpoints and functionality
 * 
 * Usage: npm run verify:deployment
 */

const https = require('https');
const { URL } = require('url');

// Configuration
const PRODUCTION_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_APP_URL 
  ? process.env.NEXT_PUBLIC_APP_URL
  : 'http://localhost:3000';

console.log('🔍 EDIC Contest Platform - Deployment Verification');
console.log('==================================================');
console.log(`Target URL: ${PRODUCTION_URL}`);
console.log('');

async function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EDIC-Verify-Script/1.0',
        ...headers
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const protocol = urlObj.protocol === 'https:' ? https : require('http');
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
            data: parsed,
            headers: res.headers
          });
        } catch (err) {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
            headers: res.headers,
            raw: true
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testEndpoint(name, url, expectedStatus = 200, method = 'GET', data = null) {
  try {
    console.log(`  Testing ${name}...`);
    const start = Date.now();
    const response = await makeRequest(url, method, data);
    const duration = Date.now() - start;
    
    if (response.statusCode === expectedStatus) {
      console.log(`  ✅ ${name} - ${response.statusCode} (${duration}ms)`);
      return { success: true, duration, response };
    } else {
      console.log(`  ❌ ${name} - Expected ${expectedStatus}, got ${response.statusCode} (${duration}ms)`);
      return { success: false, duration, response };
    }
  } catch (error) {
    console.log(`  ❌ ${name} - Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function verifyDeployment() {
  let totalTests = 0;
  let passedTests = 0;
  const results = [];

  console.log('🧪 Running deployment tests...');
  console.log('');

  // Test 1: Health Check
  console.log('📋 Step 1: Core Infrastructure Tests');
  console.log('====================================');
  
  const healthTest = await testEndpoint('Health Check', `${PRODUCTION_URL}/api/health`);
  totalTests++;
  if (healthTest.success) passedTests++;
  results.push({ name: 'Health Check', ...healthTest });

  // Test 2: Database Connection
  const dbTest = await testEndpoint('Database Connection', `${PRODUCTION_URL}/api/health`);
  totalTests++;
  if (dbTest.success) passedTests++;
  results.push({ name: 'Database Connection', ...dbTest });

  console.log('');
  console.log('📋 Step 2: API Endpoint Tests');
  console.log('=============================');

  // Test API endpoints
  const endpoints = [
    { name: 'Admin Config API', url: '/api/admin/config', status: 401 }, // Should require auth
    { name: 'Quiz API', url: '/api/quiz', status: 200 },
    { name: 'Voting API', url: '/api/voting', status: 200 },
    { name: 'Scoreboard API', url: '/api/scoreboard', status: 200 }
  ];

  for (const endpoint of endpoints) {
    const test = await testEndpoint(
      endpoint.name, 
      `${PRODUCTION_URL}${endpoint.url}`, 
      endpoint.status
    );
    totalTests++;
    if (test.success) passedTests++;
    results.push({ name: endpoint.name, ...test });
  }

  console.log('');
  console.log('📋 Step 3: Frontend Route Tests');
  console.log('================================');

  // Test frontend routes
  const routes = [
    { name: 'Home Page', url: '/', status: 200 },
    { name: 'Admin Login', url: '/admin/login', status: 200 },
    { name: 'Dashboard', url: '/dashboard', status: 200 },
    { name: 'Quiz Page', url: '/quiz', status: 200 },
    { name: 'Voting Page', url: '/voting', status: 200 },
    { name: 'Results Page', url: '/results', status: 200 }
  ];

  for (const route of routes) {
    const test = await testEndpoint(
      route.name, 
      `${PRODUCTION_URL}${route.url}`, 
      route.status
    );
    totalTests++;
    if (test.success) passedTests++;
    results.push({ name: route.name, ...test });
  }

  console.log('');
  console.log('📊 Verification Results');
  console.log('=======================');
  
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log(`Tests Passed: ${passedTests}/${totalTests} (${successRate}%)`);
  console.log('');

  // Show detailed results
  console.log('📋 Detailed Results:');
  console.log('===================');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const duration = result.duration ? `(${result.duration}ms)` : '';
    const error = result.error ? ` - ${result.error}` : '';
    console.log(`${status} ${result.name} ${duration}${error}`);
  });

  console.log('');
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Deployment is ready for use.');
    console.log('');
    console.log('📝 Available URLs:');
    console.log('==================');
    console.log(`🏠 Main Site: ${PRODUCTION_URL}`);
    console.log(`🔐 Admin Panel: ${PRODUCTION_URL}/admin/login`);
    console.log(`📊 Dashboard: ${PRODUCTION_URL}/dashboard`);
    console.log(`❓ Quiz: ${PRODUCTION_URL}/quiz`);
    console.log(`🗳️  Voting: ${PRODUCTION_URL}/voting`);
    console.log(`📈 Results: ${PRODUCTION_URL}/results`);
    
    return true;
  } else {
    console.log('⚠️  Some tests failed. Please review the issues above.');
    console.log('');
    console.log('🔧 Common Issues:');
    console.log('=================');
    console.log('1. Database connection problems - Check DATABASE_URL');
    console.log('2. Environment variables missing - Verify .env configuration');
    console.log('3. Build issues - Run npm run build to check for errors');
    console.log('4. Network connectivity - Verify the deployment URL is accessible');
    
    return false;
  }
}

// Run the verification
if (require.main === module) {
  verifyDeployment().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { verifyDeployment };
