// Quick database setup script
import fetch from 'node-fetch';

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database tables...');
    
    const response = await fetch('http://localhost:3000/api/setup/database', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer dev-setup-key',
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Database setup successful!');
      console.log('Tables created:', result.tablesCreated);
    } else {
      console.error('❌ Database setup failed:', result.error);
      console.error('Details:', result.details);
    }
    
  } catch (error) {
    console.error('❌ Error connecting to setup endpoint:', error.message);
  }
}

setupDatabase();
