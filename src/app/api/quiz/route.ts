import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Sample quiz questions with different scoring patterns
const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    roundId: 'round2',
    question: 'Which technology trend is most likely to revolutionize business operations in the next 5 years?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q1_a', text: 'Artificial Intelligence and Machine Learning', points: 4 },
      { id: 'q1_b', text: 'Blockchain Technology', points: 2 },
      { id: 'q1_c', text: 'Virtual Reality', points: 1 },
      { id: 'q1_d', text: 'Quantum Computing', points: -1 }
    ],
    explanation: 'AI/ML has the most immediate and widespread impact on business operations.',
    timeLimit: 45,
    difficulty: 'medium' as const,
    tags: ['technology', 'business'],
    orderIndex: 1,
    createdAt: new Date()
  },
  {
    id: 'q2',
    roundId: 'round2',
    question: 'What is the most critical factor for startup success?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q2_a', text: 'Product-Market Fit', points: 4 },
      { id: 'q2_b', text: 'Funding Amount', points: -2 },
      { id: 'q2_c', text: 'Team Experience', points: 3 },
      { id: 'q2_d', text: 'Marketing Strategy', points: 1 }
    ],
    explanation: 'Product-market fit is the foundation of sustainable business growth.',
    timeLimit: 45,
    difficulty: 'medium' as const,
    tags: ['startup', 'business'],
    orderIndex: 2,
    createdAt: new Date()
  },
  {
    id: 'q3',
    roundId: 'round2',
    question: 'Which business model is most sustainable for a tech startup?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q3_a', text: 'Subscription (SaaS)', points: 3 },
      { id: 'q3_b', text: 'One-time Purchase', points: 1 },
      { id: 'q3_c', text: 'Freemium', points: 2 },
      { id: 'q3_d', text: 'Advertisement-based', points: -1 }
    ],
    explanation: 'Subscription models provide predictable recurring revenue.',
    timeLimit: 45,
    difficulty: 'easy' as const,
    tags: ['business-model', 'revenue'],
    orderIndex: 3,
    createdAt: new Date()
  },
  {
    id: 'q4',
    roundId: 'round2',
    question: 'What is the primary purpose of a Minimum Viable Product (MVP)?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q4_a', text: 'Test market demand with minimal resources', points: 4 },
      { id: 'q4_b', text: 'Build a fully featured product quickly', points: -2 },
      { id: 'q4_c', text: 'Impress investors', points: 0 },
      { id: 'q4_d', text: 'Save development costs', points: 1 }
    ],
    explanation: 'MVP helps validate assumptions and gather user feedback early.',
    timeLimit: 45,
    difficulty: 'easy' as const,
    tags: ['mvp', 'product'],
    orderIndex: 4,
    createdAt: new Date()
  },
  {
    id: 'q5',
    roundId: 'round2',
    question: 'Which metric is most important for measuring customer satisfaction?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q5_a', text: 'Net Promoter Score (NPS)', points: 3 },
      { id: 'q5_b', text: 'Customer Acquisition Cost', points: 1 },
      { id: 'q5_c', text: 'Monthly Revenue', points: -1 },
      { id: 'q5_d', text: 'Customer Lifetime Value', points: 2 }
    ],
    explanation: 'NPS directly measures customer satisfaction and loyalty.',
    timeLimit: 45,
    difficulty: 'medium' as const,
    tags: ['metrics', 'customer'],
    orderIndex: 5,
    createdAt: new Date()
  },
  {
    id: 'q6',
    roundId: 'round2',
    question: 'What is the best approach for market research?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q6_a', text: 'Direct customer interviews', points: 4 },
      { id: 'q6_b', text: 'Online surveys only', points: 1 },
      { id: 'q6_c', text: 'Competitor analysis only', points: 0 },
      { id: 'q6_d', text: 'Assumptions based on personal experience', points: -3 }
    ],
    explanation: 'Direct customer interviews provide the most valuable insights.',
    timeLimit: 45,
    difficulty: 'easy' as const,
    tags: ['market-research', 'customer'],
    orderIndex: 6,
    createdAt: new Date()
  },
  {
    id: 'q7',
    roundId: 'round2',
    question: 'Which funding stage typically requires a working prototype?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q7_a', text: 'Seed Round', points: 3 },
      { id: 'q7_b', text: 'Pre-seed', points: 1 },
      { id: 'q7_c', text: 'Series A', points: 2 },
      { id: 'q7_d', text: 'Bootstrap', points: -1 }
    ],
    explanation: 'Seed rounds typically expect a working prototype to demonstrate viability.',
    timeLimit: 45,
    difficulty: 'medium' as const,
    tags: ['funding', 'investment'],
    orderIndex: 7,
    createdAt: new Date()
  },
  {
    id: 'q8',
    roundId: 'round2',
    question: 'What is the most effective way to validate a business idea?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q8_a', text: 'Get paying customers', points: 4 },
      { id: 'q8_b', text: 'Create a detailed business plan', points: 0 },
      { id: 'q8_c', text: 'Survey potential customers', points: 2 },
      { id: 'q8_d', text: 'Ask friends and family', points: -2 }
    ],
    explanation: 'Paying customers are the strongest validation of business viability.',
    timeLimit: 45,
    difficulty: 'medium' as const,
    tags: ['validation', 'business'],
    orderIndex: 8,
    createdAt: new Date()
  },
  {
    id: 'q9',
    roundId: 'round2',
    question: 'Which is the most important quality for an entrepreneur?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q9_a', text: 'Resilience and persistence', points: 3 },
      { id: 'q9_b', text: 'Technical expertise', points: 1 },
      { id: 'q9_c', text: 'Access to capital', points: 0 },
      { id: 'q9_d', text: 'Perfect business plan', points: -1 }
    ],
    explanation: 'Resilience helps entrepreneurs overcome inevitable challenges.',
    timeLimit: 45,
    difficulty: 'easy' as const,
    tags: ['entrepreneur', 'qualities'],
    orderIndex: 9,
    createdAt: new Date()
  },
  {
    id: 'q10',
    roundId: 'round2',
    question: 'What is the primary goal of a pitch deck?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q10_a', text: 'Get a follow-up meeting', points: 4 },
      { id: 'q10_b', text: 'Explain every detail of the business', points: -2 },
      { id: 'q10_c', text: 'Impress with design', points: 0 },
      { id: 'q10_d', text: 'Get immediate funding decision', points: -1 }
    ],
    explanation: 'Pitch decks should generate interest for deeper conversations.',
    timeLimit: 45,
    difficulty: 'easy' as const,
    tags: ['pitch', 'presentation'],
    orderIndex: 10,
    createdAt: new Date()
  },
  {
    id: 'q11',
    roundId: 'round2',
    question: 'Which factor is most critical for scaling a business?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q11_a', text: 'Proven business model', points: 4 },
      { id: 'q11_b', text: 'Large team', points: -1 },
      { id: 'q11_c', text: 'Advanced technology', points: 1 },
      { id: 'q11_d', text: 'Perfect product', points: 0 }
    ],
    explanation: 'A proven business model ensures sustainable growth during scaling.',
    timeLimit: 45,
    difficulty: 'hard' as const,
    tags: ['scaling', 'growth'],
    orderIndex: 11,
    createdAt: new Date()
  },
  {
    id: 'q12',
    roundId: 'round2',
    question: 'What is the most common reason for startup failure?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q12_a', text: 'No market need', points: 4 },
      { id: 'q12_b', text: 'Ran out of cash', points: 2 },
      { id: 'q12_c', text: 'Wrong team', points: 1 },
      { id: 'q12_d', text: 'Competition', points: 0 }
    ],
    explanation: 'Building something people don\'t want is the #1 startup killer.',
    timeLimit: 45,
    difficulty: 'medium' as const,
    tags: ['failure', 'market'],
    orderIndex: 12,
    createdAt: new Date()
  },
  {
    id: 'q13',
    roundId: 'round2',
    question: 'Which is the best strategy for customer acquisition?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q13_a', text: 'Focus on one channel that works', points: 3 },
      { id: 'q13_b', text: 'Try all channels simultaneously', points: -2 },
      { id: 'q13_c', text: 'Only use paid advertising', points: 0 },
      { id: 'q13_d', text: 'Rely on word of mouth only', points: 1 }
    ],
    explanation: 'Focusing on one effective channel leads to better ROI and learning.',
    timeLimit: 45,
    difficulty: 'medium' as const,
    tags: ['marketing', 'acquisition'],
    orderIndex: 13,
    createdAt: new Date()
  },
  {
    id: 'q14',
    roundId: 'round2',
    question: 'What is the most important aspect of company culture?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q14_a', text: 'Clear values and mission', points: 3 },
      { id: 'q14_b', text: 'Fun office environment', points: 1 },
      { id: 'q14_c', text: 'High salaries', points: 0 },
      { id: 'q14_d', text: 'Flexible work hours', points: 2 }
    ],
    explanation: 'Clear values guide decision-making and attract right talent.',
    timeLimit: 45,
    difficulty: 'easy' as const,
    tags: ['culture', 'values'],
    orderIndex: 14,
    createdAt: new Date()
  },
  {
    id: 'q15',
    roundId: 'round2',
    question: 'Which metric best indicates product-market fit?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q15_a', text: 'High user retention rates', points: 4 },
      { id: 'q15_b', text: 'Large number of signups', points: 1 },
      { id: 'q15_c', text: 'Media coverage', points: -1 },
      { id: 'q15_d', text: 'Investor interest', points: 0 }
    ],
    explanation: 'High retention indicates users find real value in the product.',
    timeLimit: 45,
    difficulty: 'hard' as const,
    tags: ['product-market-fit', 'metrics'],
    orderIndex: 15,
    createdAt: new Date()
  }
];

const quizSubmissionSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    selectedOptionId: z.string(),
    timeSpent: z.number()
  }))
});

export async function GET() {
  try {
    // Return quiz questions for the team
    return NextResponse.json({
      success: true,
      questions: QUIZ_QUESTIONS.map(q => ({
        id: q.id,
        question: q.question,
        type: q.type,
        options: q.options.map(opt => ({
          id: opt.id,
          text: opt.text
          // Don't send points to frontend for security
        })),
        timeLimit: q.timeLimit,
        difficulty: q.difficulty,
        orderIndex: q.orderIndex
      })),
      totalQuestions: QUIZ_QUESTIONS.length,
      totalTimeLimit: QUIZ_QUESTIONS.length * 45 // 45 seconds per question
    });
  } catch (error) {
    console.error('Quiz fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quiz questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers } = quizSubmissionSchema.parse(body);
    
    // Calculate score based on selected options
    let totalScore = 0;
    const detailedAnswers = answers.map(answer => {
      const question = QUIZ_QUESTIONS.find(q => q.id === answer.questionId);
      if (!question) {
        throw new Error(`Question ${answer.questionId} not found`);
      }
      
      const selectedOption = question.options.find(opt => opt.id === answer.selectedOptionId);
      if (!selectedOption) {
        throw new Error(`Option ${answer.selectedOptionId} not found`);
      }
      
      totalScore += selectedOption.points;
      
      return {
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId,
        points: selectedOption.points,
        timeSpent: answer.timeSpent,
        answeredAt: new Date()
      };
    });
    
    // In a real app, save to database
    const submission = {
      id: `quiz_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      teamId: 'team_placeholder', // Get from auth
      teamName: 'Team Placeholder',
      answers: detailedAnswers,
      totalScore,
      totalTimeSpent: answers.reduce((total, answer) => total + answer.timeSpent, 0),
      submittedAt: new Date(),
      status: 'completed' as const
    };
    
    return NextResponse.json({
      success: true,
      submission,
      totalScore,
      maxPossibleScore: QUIZ_QUESTIONS.reduce((max, q) => 
        max + Math.max(...q.options.map(opt => opt.points)), 0
      ),
      questionsAnswered: answers.length
    });
  } catch (error) {
    console.error('Quiz submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit quiz answers' },
      { status: 500 }
    );
  }
}
