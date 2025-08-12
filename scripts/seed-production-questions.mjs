// Local Quiz Question Seeder for Production Database
// This script adds 15 sample quiz questions directly to the production database via API

const PRODUCTION_URL = 'https://your-app.vercel.app'; // Replace with your actual Vercel URL
const LOCAL_URL = 'http://localhost:3000'; // For testing locally

const sampleQuestions = [
  {
    question: "Your startup needs $500K funding. What's your primary approach?",
    options: [
      { option_text: "Secure traditional bank loans with business collateral", category: "Capital", points: 3, is_correct: false, option_order: 1 },
      { option_text: "Launch targeted social media campaigns to attract investors", category: "Marketing", points: 2, is_correct: false, option_order: 2 },
      { option_text: "Develop comprehensive business plan with market analysis", category: "Strategy", points: 4, is_correct: true, option_order: 3 },
      { option_text: "Leverage personal network and team expertise", category: "Team Building", points: 3, is_correct: false, option_order: 4 }
    ]
  },
  {
    question: "A competitor launches a similar product. How do you respond?",
    options: [
      { option_text: "Increase marketing budget to outspend competitor", category: "Capital", points: 2, is_correct: false, option_order: 1 },
      { option_text: "Differentiate through unique brand positioning", category: "Marketing", points: 4, is_correct: true, option_order: 2 },
      { option_text: "Analyze competitor weaknesses and pivot strategy", category: "Strategy", points: 3, is_correct: false, option_order: 3 },
      { option_text: "Rally team to accelerate product development", category: "Team Building", points: 3, is_correct: false, option_order: 4 }
    ]
  },
  {
    question: "Your product launch is behind schedule. What's your priority?",
    options: [
      { option_text: "Hire additional developers with immediate funding", category: "Capital", points: 3, is_correct: false, option_order: 1 },
      { option_text: "Manage customer expectations through communication", category: "Marketing", points: 3, is_correct: false, option_order: 2 },
      { option_text: "Reassess timeline and adjust scope strategically", category: "Strategy", points: 4, is_correct: false, option_order: 3 },
      { option_text: "Reorganize team roles and improve coordination", category: "Team Building", points: 4, is_correct: true, option_order: 4 }
    ]
  },
  {
    question: "Customer acquisition cost is too high. What's your solution?",
    options: [
      { option_text: "Invest more capital in proven acquisition channels", category: "Capital", points: 2, is_correct: false, option_order: 1 },
      { option_text: "Optimize marketing campaigns and test new channels", category: "Marketing", points: 4, is_correct: true, option_order: 2 },
      { option_text: "Analyze customer data to improve targeting strategy", category: "Strategy", points: 3, is_correct: false, option_order: 3 },
      { option_text: "Train sales team on conversion optimization", category: "Team Building", points: 3, is_correct: false, option_order: 4 }
    ]
  },
  {
    question: "Your co-founder wants to leave the company. How do you handle this?",
    options: [
      { option_text: "Negotiate buyout terms and equity restructuring", category: "Capital", points: 3, is_correct: false, option_order: 1 },
      { option_text: "Prepare public relations strategy for transition", category: "Marketing", points: 2, is_correct: false, option_order: 2 },
      { option_text: "Develop succession plan and knowledge transfer", category: "Strategy", points: 3, is_correct: false, option_order: 3 },
      { option_text: "Focus on team morale and leadership transition", category: "Team Building", points: 4, is_correct: true, option_order: 4 }
    ]
  },
  {
    question: "Market conditions change unexpectedly. What's your first move?",
    options: [
      { option_text: "Secure emergency funding to weather the storm", category: "Capital", points: 3, is_correct: false, option_order: 1 },
      { option_text: "Adjust marketing messaging to current market", category: "Marketing", points: 3, is_correct: false, option_order: 2 },
      { option_text: "Conduct thorough market analysis and pivot plan", category: "Strategy", points: 4, is_correct: true, option_order: 3 },
      { option_text: "Communicate transparently with team about changes", category: "Team Building", points: 3, is_correct: false, option_order: 4 }
    ]
  },
  {
    question: "You need to scale operations quickly. What's most important?",
    options: [
      { option_text: "Raise Series A funding for infrastructure", category: "Capital", points: 4, is_correct: true, option_order: 1 },
      { option_text: "Build brand awareness for market expansion", category: "Marketing", points: 3, is_correct: false, option_order: 2 },
      { option_text: "Create scalable systems and processes", category: "Strategy", points: 3, is_correct: false, option_order: 3 },
      { option_text: "Recruit key talent and build management layers", category: "Team Building", points: 4, is_correct: false, option_order: 4 }
    ]
  },
  {
    question: "Customer complaints are increasing. How do you address this?",
    options: [
      { option_text: "Invest in customer service infrastructure", category: "Capital", points: 3, is_correct: false, option_order: 1 },
      { option_text: "Launch customer feedback and communication campaign", category: "Marketing", points: 3, is_correct: false, option_order: 2 },
      { option_text: "Analyze feedback patterns and improve product", category: "Strategy", points: 4, is_correct: true, option_order: 3 },
      { option_text: "Train team on customer experience excellence", category: "Team Building", points: 3, is_correct: false, option_order: 4 }
    ]
  },
  {
    question: "Your main revenue stream is declining. What's your approach?",
    options: [
      { option_text: "Secure bridge funding while exploring options", category: "Capital", points: 3, is_correct: false, option_order: 1 },
      { option_text: "Intensify marketing efforts for existing products", category: "Marketing", points: 2, is_correct: false, option_order: 2 },
      { option_text: "Diversify revenue streams strategically", category: "Strategy", points: 4, is_correct: true, option_order: 3 },
      { option_text: "Assemble cross-functional team for innovation", category: "Team Building", points: 3, is_correct: false, option_order: 4 }
    ]
  },
  {
    question: "A key employee is underperforming. What do you do?",
    options: [
      { option_text: "Offer performance bonus or equity incentive", category: "Capital", points: 2, is_correct: false, option_order: 1 },
      { option_text: "Improve internal communication and expectations", category: "Marketing", points: 2, is_correct: false, option_order: 2 },
      { option_text: "Develop performance improvement plan", category: "Strategy", points: 3, is_correct: false, option_order: 3 },
      { option_text: "Provide mentoring and skills development", category: "Team Building", points: 4, is_correct: true, option_order: 4 }
    ]
  },
  {
    question: "You're entering a new market segment. What's your priority?",
    options: [
      { option_text: "Allocate budget for market entry costs", category: "Capital", points: 3, is_correct: false, option_order: 1 },
      { option_text: "Research and develop targeted marketing strategy", category: "Marketing", points: 4, is_correct: true, option_order: 2 },
      { option_text: "Analyze market dynamics and competitive landscape", category: "Strategy", points: 3, is_correct: false, option_order: 3 },
      { option_text: "Build team expertise in new market area", category: "Team Building", points: 3, is_correct: false, option_order: 4 }
    ]
  },
  {
    question: "Your startup needs to reduce costs significantly. What's your focus?",
    options: [
      { option_text: "Negotiate with investors for additional runway", category: "Capital", points: 3, is_correct: false, option_order: 1 },
      { option_text: "Reduce marketing spend and focus on organic growth", category: "Marketing", points: 2, is_correct: false, option_order: 2 },
      { option_text: "Strategically eliminate non-essential operations", category: "Strategy", points: 4, is_correct: true, option_order: 3 },
      { option_text: "Restructure team roles to improve efficiency", category: "Team Building", points: 3, is_correct: false, option_order: 4 }
    ]
  },
  {
    question: "Technology disruption threatens your business model. How do you respond?",
    options: [
      { option_text: "Invest heavily in R&D and new technology", category: "Capital", points: 3, is_correct: false, option_order: 1 },
      { option_text: "Reposition brand as innovation leader", category: "Marketing", points: 3, is_correct: false, option_order: 2 },
      { option_text: "Develop digital transformation strategy", category: "Strategy", points: 4, is_correct: true, option_order: 3 },
      { option_text: "Upskill team and hire tech talent", category: "Team Building", points: 4, is_correct: false, option_order: 4 }
    ]
  },
  {
    question: "Your biggest client is considering ending their contract. What's your move?",
    options: [
      { option_text: "Offer financial incentives or discounts", category: "Capital", points: 2, is_correct: false, option_order: 1 },
      { option_text: "Launch customer retention campaign", category: "Marketing", points: 3, is_correct: false, option_order: 2 },
      { option_text: "Analyze relationship and develop retention strategy", category: "Strategy", points: 4, is_correct: true, option_order: 3 },
      { option_text: "Assign dedicated team for relationship management", category: "Team Building", points: 3, is_correct: false, option_order: 4 }
    ]
  },
  {
    question: "You have an opportunity to acquire a smaller competitor. What's your approach?",
    options: [
      { option_text: "Secure acquisition financing and due diligence", category: "Capital", points: 4, is_correct: true, option_order: 1 },
      { option_text: "Plan integration marketing and brand strategy", category: "Marketing", points: 3, is_correct: false, option_order: 2 },
      { option_text: "Evaluate strategic fit and synergy potential", category: "Strategy", points: 3, is_correct: false, option_order: 3 },
      { option_text: "Plan cultural integration and team consolidation", category: "Team Building", points: 3, is_correct: false, option_order: 4 }
    ]
  }
];

// Get admin authentication token
async function getAdminToken(baseUrl) {
  console.log('🔐 Getting admin authentication...');
  
  const response = await fetch(`${baseUrl}/api/admin/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'superadmin',  // Use username field as expected by API
      password: 'SuperAdmin2025' // Default password from migration
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('✅ Admin authentication successful');
    return data.token;
  } else {
    console.log('❌ Admin authentication failed:', data.error);
    return null;
  }
}

// Add a single question
async function addQuestion(baseUrl, token, questionData, index) {
  try {
    const response = await fetch(`${baseUrl}/api/admin/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        question: questionData.question,
        options: questionData.options,
        is_active: true
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Question ${index + 1} added: "${questionData.question.substring(0, 50)}..."`);
      return true;
    } else {
      console.log(`❌ Failed to add question ${index + 1}: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error adding question ${index + 1}: ${error.message}`);
    return false;
  }
}

// Main seeding function
async function seedQuestions(baseUrl = LOCAL_URL) {
  console.log(`🚀 Starting quiz question seeding to ${baseUrl}...`);
  console.log(`📝 Will add ${sampleQuestions.length} questions\n`);
  
  // Get admin token
  const token = await getAdminToken(baseUrl);
  if (!token) {
    console.log('❌ Cannot proceed without admin authentication');
    return;
  }
  
  let successCount = 0;
  let failCount = 0;
  
  // Add questions one by one
  for (let i = 0; i < sampleQuestions.length; i++) {
    const success = await addQuestion(baseUrl, token, sampleQuestions[i], i);
    
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n🎉 Seeding completed!`);
  console.log(`✅ Successfully added: ${successCount} questions`);
  console.log(`❌ Failed to add: ${failCount} questions`);
  
  if (successCount > 0) {
    console.log(`\n📊 You can now use the quiz with ${successCount} questions!`);
    console.log(`🔗 Admin panel: ${baseUrl}/admin/config`);
  }
}

// Run the script
if (typeof window === 'undefined') {
  // Node.js environment - check command line arguments
  const args = process.argv.slice(2);
  const baseUrl = args[0] || LOCAL_URL;
  
  console.log('📋 EDIC Contest Platform - Quiz Question Seeder');
  console.log('=' .repeat(50));
  
  seedQuestions(baseUrl);
}

// Export for use in other scripts
export { seedQuestions, sampleQuestions };
