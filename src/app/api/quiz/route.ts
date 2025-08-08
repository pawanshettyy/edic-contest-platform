import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Sample quiz questions with different scoring patterns
// Each question has 4 options representing different business approaches:
// Option A: Capital-related approach
// Option B: Marketing-related approach  
// Option C: Strategy-related approach
// Option D: Team building-related approach
const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    roundId: 'round2',
    question: 'Your startup is facing slow growth. What should be your primary focus?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q1_a', text: 'Secure additional funding to accelerate operations', points: 3, category: 'capital' },
      { id: 'q1_b', text: 'Launch an aggressive marketing campaign to increase visibility', points: 2, category: 'marketing' },
      { id: 'q1_c', text: 'Pivot your business model or refine your strategy', points: 4, category: 'strategy' },
      { id: 'q1_d', text: 'Hire more skilled team members to boost productivity', points: 1, category: 'team' }
    ],
    explanation: 'Strategic refinement often addresses root causes of slow growth most effectively.',
    timeLimit: 45,
    difficulty: 'medium' as const,
    tags: ['growth', 'business'],
    orderIndex: 1,
    createdAt: new Date()
  },
  {
    id: 'q2',
    roundId: 'round2',
    question: 'You have a great product but limited customers. What\'s your next move?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q2_a', text: 'Reduce prices to make the product more affordable', points: 1, category: 'capital' },
      { id: 'q2_b', text: 'Invest heavily in digital marketing and advertising', points: 4, category: 'marketing' },
      { id: 'q2_c', text: 'Analyze market positioning and refine target audience', points: 3, category: 'strategy' },
      { id: 'q2_d', text: 'Build a dedicated sales team to drive customer acquisition', points: 2, category: 'team' }
    ],
    explanation: 'When you have a great product, marketing is crucial to reach the right customers.',
    timeLimit: 45,
    difficulty: 'medium' as const,
    tags: ['marketing', 'customer-acquisition'],
    orderIndex: 2,
    createdAt: new Date()
  },
  {
    id: 'q3',
    roundId: 'round2',
    question: 'Your competitor just launched a similar product. How do you respond?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q3_a', text: 'Lower your prices to stay competitive', points: 2, category: 'capital' },
      { id: 'q3_b', text: 'Increase marketing spend to outvoice the competition', points: 1, category: 'marketing' },
      { id: 'q3_c', text: 'Differentiate your offering with unique value propositions', points: 4, category: 'strategy' },
      { id: 'q3_d', text: 'Expand your team to accelerate product development', points: 3, category: 'team' }
    ],
    explanation: 'Strategic differentiation creates sustainable competitive advantage.',
    timeLimit: 45,
    difficulty: 'hard' as const,
    tags: ['competition', 'strategy'],
    orderIndex: 3,
    createdAt: new Date()
  },
  {
    id: 'q4',
    roundId: 'round2',
    question: 'Your team is struggling with productivity and motivation. What\'s your priority?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q4_a', text: 'Offer performance bonuses and salary increases', points: 2, category: 'capital' },
      { id: 'q4_b', text: 'Create internal marketing campaigns to boost morale', points: 1, category: 'marketing' },
      { id: 'q4_c', text: 'Restructure workflows and clarify company objectives', points: 3, category: 'strategy' },
      { id: 'q4_d', text: 'Invest in team building activities and leadership training', points: 4, category: 'team' }
    ],
    explanation: 'Team building and leadership development address productivity issues at their core.',
    timeLimit: 45,
    difficulty: 'easy' as const,
    tags: ['team', 'productivity'],
    orderIndex: 4,
    createdAt: new Date()
  },
  {
    id: 'q5',
    roundId: 'round2',
    question: 'You need to enter a new market quickly. What\'s your approach?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q5_a', text: 'Secure venture capital for rapid market entry', points: 2, category: 'capital' },
      { id: 'q5_b', text: 'Launch targeted advertising campaigns in the new market', points: 3, category: 'marketing' },
      { id: 'q5_c', text: 'Partner with local companies or acquire market knowledge', points: 4, category: 'strategy' },
      { id: 'q5_d', text: 'Hire local talent who understand the market dynamics', points: 1, category: 'team' }
    ],
    explanation: 'Strategic partnerships provide market knowledge and reduce entry risks.',
    timeLimit: 45,
    difficulty: 'medium' as const,
    tags: ['market-entry', 'expansion'],
    orderIndex: 5,
    createdAt: new Date()
  },
  {
    id: 'q6',
    roundId: 'round2',
    question: 'Customer feedback indicates your product is too complex. How do you address this?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q6_a', text: 'Reduce the product price to compensate for complexity', points: 1, category: 'capital' },
      { id: 'q6_b', text: 'Create better tutorials and marketing materials', points: 2, category: 'marketing' },
      { id: 'q6_c', text: 'Simplify the product design and user experience', points: 4, category: 'strategy' },
      { id: 'q6_d', text: 'Train customer service team to provide better support', points: 3, category: 'team' }
    ],
    explanation: 'Simplifying the product strategically addresses the root cause of complexity.',
    timeLimit: 45,
    difficulty: 'easy' as const,
    tags: ['product', 'user-experience'],
    orderIndex: 6,
    createdAt: new Date()
  },
  {
    id: 'q7',
    roundId: 'round2',
    question: 'Your startup is running low on cash. What\'s your immediate priority?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q7_a', text: 'Cut all non-essential expenses immediately', points: 4, category: 'capital' },
      { id: 'q7_b', text: 'Increase marketing to boost revenue quickly', points: 1, category: 'marketing' },
      { id: 'q7_c', text: 'Pivot to a more profitable business model', points: 3, category: 'strategy' },
      { id: 'q7_d', text: 'Reduce team size to lower operational costs', points: 2, category: 'team' }
    ],
    explanation: 'Cash management is critical - cutting expenses extends runway immediately.',
    timeLimit: 45,
    difficulty: 'medium' as const,
    tags: ['finance', 'cash-flow'],
    orderIndex: 7,
    createdAt: new Date()
  },
  {
    id: 'q8',
    roundId: 'round2',
    question: 'You want to scale your business operations. What\'s your first step?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q8_a', text: 'Raise Series A funding to fuel growth', points: 3, category: 'capital' },
      { id: 'q8_b', text: 'Scale marketing efforts across multiple channels', points: 2, category: 'marketing' },
      { id: 'q8_c', text: 'Standardize processes and create scalable systems', points: 4, category: 'strategy' },
      { id: 'q8_d', text: 'Hire managers and build organizational structure', points: 1, category: 'team' }
    ],
    explanation: 'Scalable systems and processes are the foundation for sustainable growth.',
    timeLimit: 45,
    difficulty: 'hard' as const,
    tags: ['scaling', 'operations'],
    orderIndex: 8,
    createdAt: new Date()
  },
  {
    id: 'q9',
    roundId: 'round2',
    question: 'Your key team member wants to leave the company. How do you handle this?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q9_a', text: 'Offer a significant salary increase and equity', points: 2, category: 'capital' },
      { id: 'q9_b', text: 'Promote their achievements and create retention campaigns', points: 1, category: 'marketing' },
      { id: 'q9_c', text: 'Restructure their role to match their career goals', points: 3, category: 'strategy' },
      { id: 'q9_d', text: 'Have open conversations about their concerns and growth', points: 4, category: 'team' }
    ],
    explanation: 'Open communication and addressing team member concerns builds stronger retention.',
    timeLimit: 45,
    difficulty: 'easy' as const,
    tags: ['retention', 'team-management'],
    orderIndex: 9,
    createdAt: new Date()
  },
  {
    id: 'q10',
    roundId: 'round2',
    question: 'You need to validate a new product idea quickly. What\'s your approach?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q10_a', text: 'Build a minimal prototype with limited budget', points: 3, category: 'capital' },
      { id: 'q10_b', text: 'Run targeted ads to gauge market interest', points: 2, category: 'marketing' },
      { id: 'q10_c', text: 'Create landing pages and measure conversion rates', points: 4, category: 'strategy' },
      { id: 'q10_d', text: 'Form focus groups with potential customers', points: 1, category: 'team' }
    ],
    explanation: 'Landing pages provide quick, data-driven validation with minimal resources.',
    timeLimit: 45,
    difficulty: 'medium' as const,
    tags: ['validation', 'mvp'],
    orderIndex: 10,
    createdAt: new Date()
  },
  {
    id: 'q11',
    roundId: 'round2',
    question: 'Your product has technical issues affecting user experience. What\'s your priority?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q11_a', text: 'Invest more in development infrastructure', points: 2, category: 'capital' },
      { id: 'q11_b', text: 'Communicate transparently with users about fixes', points: 3, category: 'marketing' },
      { id: 'q11_c', text: 'Prioritize fixing critical bugs over new features', points: 4, category: 'strategy' },
      { id: 'q11_d', text: 'Hire additional developers and QA specialists', points: 1, category: 'team' }
    ],
    explanation: 'Strategic prioritization of fixes over features maintains user trust and satisfaction.',
    timeLimit: 45,
    difficulty: 'easy' as const,
    tags: ['product', 'technical'],
    orderIndex: 11,
    createdAt: new Date()
  },
  {
    id: 'q12',
    roundId: 'round2',
    question: 'You want to build strong customer relationships. What\'s most effective?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q12_a', text: 'Offer loyalty programs and financial incentives', points: 1, category: 'capital' },
      { id: 'q12_b', text: 'Create engaging content and community platforms', points: 4, category: 'marketing' },
      { id: 'q12_c', text: 'Develop personalized customer journey strategies', points: 3, category: 'strategy' },
      { id: 'q12_d', text: 'Train staff to provide exceptional customer service', points: 2, category: 'team' }
    ],
    explanation: 'Engaging content and community building create lasting emotional connections with customers.',
    timeLimit: 45,
    difficulty: 'medium' as const,
    tags: ['customer-relationship', 'engagement'],
    orderIndex: 12,
    createdAt: new Date()
  },
  {
    id: 'q13',
    roundId: 'round2',
    question: 'Your industry is facing economic uncertainty. How do you prepare?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q13_a', text: 'Build larger cash reserves and reduce spending', points: 4, category: 'capital' },
      { id: 'q13_b', text: 'Shift marketing focus to value-based messaging', points: 2, category: 'marketing' },
      { id: 'q13_c', text: 'Diversify revenue streams and business models', points: 3, category: 'strategy' },
      { id: 'q13_d', text: 'Cross-train team members for operational flexibility', points: 1, category: 'team' }
    ],
    explanation: 'Strong cash reserves provide the most immediate protection during economic uncertainty.',
    timeLimit: 45,
    difficulty: 'hard' as const,
    tags: ['risk-management', 'economics'],
    orderIndex: 13,
    createdAt: new Date()
  },
  {
    id: 'q14',
    roundId: 'round2',
    question: 'You need to make your company more innovative. What\'s your focus?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q14_a', text: 'Allocate budget for R&D and innovation projects', points: 2, category: 'capital' },
      { id: 'q14_b', text: 'Promote innovation achievements and success stories', points: 1, category: 'marketing' },
      { id: 'q14_c', text: 'Implement structured innovation processes and frameworks', points: 3, category: 'strategy' },
      { id: 'q14_d', text: 'Foster creative culture and encourage experimentation', points: 4, category: 'team' }
    ],
    explanation: 'A creative team culture is the foundation of sustainable innovation.',
    timeLimit: 45,
    difficulty: 'medium' as const,
    tags: ['innovation', 'culture'],
    orderIndex: 14,
    createdAt: new Date()
  },
  {
    id: 'q15',
    roundId: 'round2',
    question: 'Your startup needs to establish credibility in the market. What\'s your approach?',
    type: 'multiple_choice' as const,
    options: [
      { id: 'q15_a', text: 'Secure high-profile investors and funding announcements', points: 3, category: 'capital' },
      { id: 'q15_b', text: 'Build thought leadership through content and PR', points: 4, category: 'marketing' },
      { id: 'q15_c', text: 'Partner with established companies and get certifications', points: 2, category: 'strategy' },
      { id: 'q15_d', text: 'Hire industry veterans and advisory board members', points: 1, category: 'team' }
    ],
    explanation: 'Thought leadership and content marketing build authentic credibility over time.',
    timeLimit: 45,
    difficulty: 'medium' as const,
    tags: ['credibility', 'thought-leadership'],
    orderIndex: 15,
    createdAt: new Date()
  }
];

const quizSubmissionSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    selectedOptionId: z.string(),
    timeSpent: z.number()
  })),
  memberName: z.string(),
  teamName: z.string()
});

// Store quiz submissions in memory (in production, use database)
interface QuizAnswer {
  questionId: string;
  selectedOptionId: string;
  points: number;
  category: string;
  timeSpent: number;
  answeredAt: Date;
}

interface ApproachScores {
  capital: number;
  marketing: number;
  strategy: number;
  team: number;
}

const quizSubmissions = new Map<string, {
  teamName: string;
  memberName: string;
  answers: QuizAnswer[];
  score: number;
  approachScores: ApproachScores;
  submittedAt: Date;
}>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberName = searchParams.get('memberName');
    const teamName = searchParams.get('teamName');
    
    // Check if this member has already submitted
    let hasSubmitted = false;
    let existingSubmission = null;
    
    if (memberName && teamName) {
      const submissionKey = `${teamName}_${memberName}`;
      existingSubmission = quizSubmissions.get(submissionKey);
      hasSubmitted = !!existingSubmission;
    }
    
    // Return quiz questions for the team member
    return NextResponse.json({
      success: true,
      hasSubmitted,
      existingSubmission: hasSubmitted && existingSubmission ? {
        score: existingSubmission.score,
        submittedAt: existingSubmission.submittedAt,
        approachScores: existingSubmission.approachScores
      } : null,
      questions: QUIZ_QUESTIONS.map(q => ({
        id: q.id,
        question: q.question,
        type: q.type,
        options: q.options.map(opt => ({
          id: opt.id,
          text: opt.text,
          category: opt.category
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
    const { answers, memberName, teamName } = quizSubmissionSchema.parse(body);
    
    // Check if this member has already submitted
    const submissionKey = `${teamName}_${memberName}`;
    if (quizSubmissions.has(submissionKey)) {
      return NextResponse.json(
        { success: false, error: 'Quiz already submitted for this member' },
        { status: 400 }
      );
    }
    
    // Calculate score based on selected options
    let memberScore = 0;
    const memberApproachScores: ApproachScores = {
      capital: 0,
      marketing: 0,
      strategy: 0,
      team: 0
    };
    
    const detailedAnswers = answers.map(answer => {
      const question = QUIZ_QUESTIONS.find(q => q.id === answer.questionId);
      if (!question) {
        throw new Error(`Question ${answer.questionId} not found`);
      }
      
      const selectedOption = question.options.find(opt => opt.id === answer.selectedOptionId);
      if (!selectedOption) {
        throw new Error(`Option ${answer.selectedOptionId} not found`);
      }
      
      memberScore += selectedOption.points;
      
      // Add to approach-specific score
      const category = selectedOption.category as keyof ApproachScores;
      if (category && memberApproachScores[category] !== undefined) {
        memberApproachScores[category] += selectedOption.points;
      }
      
      return {
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId,
        points: selectedOption.points,
        category: selectedOption.category || 'unknown',
        timeSpent: answer.timeSpent,
        answeredAt: new Date()
      };
    });
    
    // Store member's submission
    quizSubmissions.set(submissionKey, {
      teamName,
      memberName,
      answers: detailedAnswers,
      score: memberScore,
      approachScores: memberApproachScores,
      submittedAt: new Date()
    });
    
    // Calculate team's accumulated score
    const teamSubmissions = Array.from(quizSubmissions.values())
      .filter(submission => submission.teamName === teamName);
    
    const teamTotalScore = teamSubmissions.reduce((total, submission) => total + submission.score, 0);
    const membersCompleted = teamSubmissions.length;
    
    // Calculate team approach scores
    const teamApproachScores: ApproachScores = {
      capital: 0,
      marketing: 0,
      strategy: 0,
      team: 0
    };
    
    teamSubmissions.forEach(submission => {
      teamApproachScores.capital += submission.approachScores.capital;
      teamApproachScores.marketing += submission.approachScores.marketing;
      teamApproachScores.strategy += submission.approachScores.strategy;
      teamApproachScores.team += submission.approachScores.team;
    });
    
    return NextResponse.json({
      success: true,
      memberScore,
      teamTotalScore,
      membersCompleted,
      maxPossibleScore: QUIZ_QUESTIONS.reduce((max, q) => 
        max + Math.max(...q.options.map(opt => opt.points)), 0
      ),
      questionsAnswered: answers.length,
      memberApproachScores,
      teamApproachScores,
      message: `Quiz submitted successfully! Your score: ${memberScore}. Team total: ${teamTotalScore} (${membersCompleted} members completed)`
    });
  } catch (error) {
    console.error('Quiz submission error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid submission data' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to submit quiz answers' },
      { status: 500 }
    );
  }
}
