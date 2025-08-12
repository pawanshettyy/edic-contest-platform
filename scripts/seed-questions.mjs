// Production Quiz Questions Seeder
// Run this script to populate production database with sample questions

const sampleQuestions = [
  {
    question: "Your startup needs $500K funding. What's your primary approach?",
    options: [
      { text: "Secure traditional bank loans with business collateral", category: "Capital", points: 3 },
      { text: "Launch targeted social media campaigns to attract investors", category: "Marketing", points: 2 },
      { text: "Develop comprehensive business plan with market analysis", category: "Strategy", points: 4 },
      { text: "Leverage personal network and team expertise", category: "Team Building", points: 3 }
    ]
  },
  {
    question: "A competitor launches a similar product. How do you respond?",
    options: [
      { text: "Increase marketing budget to outspend competitor", category: "Capital", points: 2 },
      { text: "Differentiate through unique brand positioning", category: "Marketing", points: 4 },
      { text: "Analyze competitor weaknesses and pivot strategy", category: "Strategy", points: 3 },
      { text: "Rally team to accelerate product development", category: "Team Building", points: 3 }
    ]
  },
  {
    question: "Your product launch is behind schedule. What's your priority?",
    options: [
      { text: "Hire additional developers with immediate funding", category: "Capital", points: 3 },
      { text: "Manage customer expectations through communication", category: "Marketing", points: 3 },
      { text: "Reassess timeline and adjust scope strategically", category: "Strategy", points: 4 },
      { text: "Reorganize team roles and improve coordination", category: "Team Building", points: 4 }
    ]
  },
  {
    question: "Customer acquisition cost is too high. What's your solution?",
    options: [
      { text: "Invest more capital in proven acquisition channels", category: "Capital", points: 2 },
      { text: "Optimize marketing campaigns and test new channels", category: "Marketing", points: 4 },
      { text: "Analyze customer data to improve targeting strategy", category: "Strategy", points: 3 },
      { text: "Train sales team on conversion optimization", category: "Team Building", points: 3 }
    ]
  },
  {
    question: "Your co-founder wants to leave the company. How do you handle this?",
    options: [
      { text: "Negotiate buyout terms and equity restructuring", category: "Capital", points: 3 },
      { text: "Prepare public relations strategy for transition", category: "Marketing", points: 2 },
      { text: "Develop succession plan and knowledge transfer", category: "Strategy", points: 3 },
      { text: "Focus on team morale and leadership transition", category: "Team Building", points: 4 }
    ]
  },
  {
    question: "Market conditions change unexpectedly. What's your first move?",
    options: [
      { text: "Secure emergency funding to weather the storm", category: "Capital", points: 3 },
      { text: "Adjust marketing messaging to current market", category: "Marketing", points: 3 },
      { text: "Conduct thorough market analysis and pivot plan", category: "Strategy", points: 4 },
      { text: "Communicate transparently with team about changes", category: "Team Building", points: 3 }
    ]
  },
  {
    question: "You need to scale operations quickly. What's most important?",
    options: [
      { text: "Raise Series A funding for infrastructure", category: "Capital", points: 4 },
      { text: "Build brand awareness for market expansion", category: "Marketing", points: 3 },
      { text: "Create scalable systems and processes", category: "Strategy", points: 3 },
      { text: "Recruit key talent and build management layers", category: "Team Building", points: 4 }
    ]
  },
  {
    question: "Customer complaints are increasing. How do you address this?",
    options: [
      { text: "Invest in customer service infrastructure", category: "Capital", points: 3 },
      { text: "Launch customer feedback and communication campaign", category: "Marketing", points: 3 },
      { text: "Analyze feedback patterns and improve product", category: "Strategy", points: 4 },
      { text: "Train team on customer experience excellence", category: "Team Building", points: 3 }
    ]
  },
  {
    question: "Your main revenue stream is declining. What's your approach?",
    options: [
      { text: "Secure bridge funding while exploring options", category: "Capital", points: 3 },
      { text: "Intensify marketing efforts for existing products", category: "Marketing", points: 2 },
      { text: "Diversify revenue streams strategically", category: "Strategy", points: 4 },
      { text: "Assemble cross-functional team for innovation", category: "Team Building", points: 3 }
    ]
  },
  {
    question: "A key employee is underperforming. What do you do?",
    options: [
      { text: "Offer performance bonus or equity incentive", category: "Capital", points: 2 },
      { text: "Improve internal communication and expectations", category: "Marketing", points: 2 },
      { text: "Develop performance improvement plan", category: "Strategy", points: 3 },
      { text: "Provide mentoring and skills development", category: "Team Building", points: 4 }
    ]
  },
  {
    question: "You're entering a new market segment. What's your priority?",
    options: [
      { text: "Allocate budget for market entry costs", category: "Capital", points: 3 },
      { text: "Research and develop targeted marketing strategy", category: "Marketing", points: 4 },
      { text: "Analyze market dynamics and competitive landscape", category: "Strategy", points: 3 },
      { text: "Build team expertise in new market area", category: "Team Building", points: 3 }
    ]
  },
  {
    question: "Your startup needs to reduce costs significantly. What's your focus?",
    options: [
      { text: "Negotiate with investors for additional runway", category: "Capital", points: 3 },
      { text: "Reduce marketing spend and focus on organic growth", category: "Marketing", points: 2 },
      { text: "Strategically eliminate non-essential operations", category: "Strategy", points: 4 },
      { text: "Restructure team roles to improve efficiency", category: "Team Building", points: 3 }
    ]
  },
  {
    question: "Technology disruption threatens your business model. How do you respond?",
    options: [
      { text: "Invest heavily in R&D and new technology", category: "Capital", points: 3 },
      { text: "Reposition brand as innovation leader", category: "Marketing", points: 3 },
      { text: "Develop digital transformation strategy", category: "Strategy", points: 4 },
      { text: "Upskill team and hire tech talent", category: "Team Building", points: 4 }
    ]
  },
  {
    question: "Your biggest client is considering ending their contract. What's your move?",
    options: [
      { text: "Offer financial incentives or discounts", category: "Capital", points: 2 },
      { text: "Launch customer retention campaign", category: "Marketing", points: 3 },
      { text: "Analyze relationship and develop retention strategy", category: "Strategy", points: 4 },
      { text: "Assign dedicated team for relationship management", category: "Team Building", points: 3 }
    ]
  },
  {
    question: "You have an opportunity to acquire a smaller competitor. What's your approach?",
    options: [
      { text: "Secure acquisition financing and due diligence", category: "Capital", points: 4 },
      { text: "Plan integration marketing and brand strategy", category: "Marketing", points: 3 },
      { text: "Evaluate strategic fit and synergy potential", category: "Strategy", points: 3 },
      { text: "Plan cultural integration and team consolidation", category: "Team Building", points: 3 }
    ]
  }
];

async function seedQuestions(baseUrl) {
  console.log(`Seeding questions to ${baseUrl}...`);
  
  for (let i = 0; i < sampleQuestions.length; i++) {
    const questionData = sampleQuestions[i];
    
    try {
      const response = await fetch(`${baseUrl}/api/admin/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // You'll need to provide admin auth token in production
          'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
        },
        body: JSON.stringify({
          question: questionData.question,
          options: questionData.options,
          is_active: true
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✓ Question ${i + 1} added successfully`);
      } else {
        console.log(`✗ Failed to add question ${i + 1}: ${result.error}`);
      }
    } catch (error) {
      console.log(`✗ Error adding question ${i + 1}: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('Question seeding completed!');
}

// Usage examples:
// For production: seedQuestions('https://your-app.vercel.app');
// For local testing: seedQuestions('http://localhost:3000');

if (typeof window === 'undefined') {
  // Node.js environment
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  seedQuestions(baseUrl);
}

export { seedQuestions, sampleQuestions };
