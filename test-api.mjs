// Test quiz API endpoint
async function testQuizAPI() {
  try {
    console.log('Testing quiz API...');
    
    const response = await fetch('http://localhost:3000/api/quiz?memberName=testuser&teamName=testteam');
    
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers]);
    
    const data = await response.text();
    console.log('Response body:', data);
    
    // Try to parse as JSON
    try {
      const jsonData = JSON.parse(data);
      console.log('Parsed JSON:', JSON.stringify(jsonData, null, 2));
    } catch (parseError) {
      console.log('Could not parse as JSON:', parseError.message);
    }
    
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testQuizAPI();
