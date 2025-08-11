import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSql } from '@/lib/database';

// Type-safe database result wrapper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DatabaseResult = Record<string, any>[];

interface ApproachScores {
  capital: number;
  marketing: number;
  strategy: number;
  team: number;
}

interface DatabaseQuestion {
  id: string;
  question: string;
  category: string;
  time_limit: number;
  is_active: boolean;
  options: Record<string, unknown>[];
}

interface TeamRecord {
  id: string;
}

const answerSchema = z.object({
  questionId: z.string(),
  selectedOptionId: z.string(),
  timeSpent: z.number()
});

const submissionSchema = z.object({
  answers: z.array(answerSchema),
  memberName: z.string(),
  teamName: z.string()
});

// Check if user has already submitted quiz
async function checkExistingSubmission(teamName: string, memberName: string): Promise<boolean> {
  try {
    const sql = getSql();
    const existingSubmission = await sql`
      SELECT qr.id FROM quiz_responses qr
      JOIN teams t ON t.team_name = ${teamName}
      WHERE qr.team_id = t.id AND qr.member_name = ${memberName}
      LIMIT 1
    ` as DatabaseResult;
    
    return existingSubmission.length > 0;
  } catch (error) {
    console.error('Error checking existing submission:', error);
    return false;
  }
}

// GET - Fetch quiz questions or check submission status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamName = searchParams.get('teamName');
    const memberName = searchParams.get('memberName');
    
    // Check if user already submitted
    if (teamName && memberName) {
      const hasSubmitted = await checkExistingSubmission(teamName, memberName);
      if (hasSubmitted) {
        return NextResponse.json({
          success: false,
          error: 'Quiz already completed',
          alreadySubmitted: true
        });
      }
    }
    
    // Fetch active quiz questions with options
    const sql = getSql();
    const questionsData = await sql`
      SELECT 
        q.id,
        q.question,
        q.category,
        q.time_limit,
        q.is_active,
        json_agg(
          json_build_object(
            'id', o.id,
            'text', o.option_text,
            'points', o.points,
            'is_correct', o.is_correct,
            'category', CASE 
              WHEN o.option_order = 1 THEN 'capital'
              WHEN o.option_order = 2 THEN 'marketing'
              WHEN o.option_order = 3 THEN 'strategy'
              WHEN o.option_order = 4 THEN 'team'
              ELSE 'general'
            END
          ) ORDER BY o.option_order
        ) as options
      FROM quiz_questions q
      LEFT JOIN quiz_options o ON q.id = o.question_id
      WHERE q.is_active = true
      GROUP BY q.id, q.question, q.category, q.time_limit, q.is_active
      ORDER BY RANDOM()
      LIMIT 15
    ` as DatabaseResult;

    const questions = questionsData.map((q: unknown) => {
      const question = q as DatabaseQuestion;
      return {
        id: question.id,
        question: question.question,
        type: 'multiple_choice', // All questions are MCQ now
        category: question.category,
        timeLimit: question.time_limit,
        options: question.options || [],
        orderIndex: Math.floor(Math.random() * 1000)
      };
    });

    return NextResponse.json({
      success: true,
      questions,
      message: 'Quiz questions loaded successfully'
    });

  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load quiz questions' },
      { status: 500 }
    );
  }
}

// POST - Submit quiz answers or check quiz attempt status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle quiz attempt check
    if (body.action === 'check_attempt' && body.teamId) {
      try {
        const sql = getSql();
        const attempts = await sql`
          SELECT COUNT(*) as count FROM quiz_responses WHERE team_id = ${body.teamId}
        ` as DatabaseResult;
        
        const hasAttempted = parseInt((attempts[0] as { count: string }).count) > 0;
        
        return NextResponse.json({
          success: true,
          hasAttempted
        });
      } catch (error) {
        console.error('Error checking quiz attempt:', error);
        return NextResponse.json({
          success: true,
          hasAttempted: false // Default to false on error
        });
      }
    }

    // Handle quiz submission
    const { answers, memberName, teamName } = submissionSchema.parse(body);

    // Check if already submitted
    const hasSubmitted = await checkExistingSubmission(teamName, memberName);
    if (hasSubmitted) {
      return NextResponse.json({
        success: false,
        error: 'Quiz already completed by this member'
      }, { status: 409 });
    }

    // Find or create team
    const sql = getSql();
    const teamResult = await sql`
      SELECT id FROM teams WHERE team_name = ${teamName}
    ` as DatabaseResult;

    let teamId: string;
    if (teamResult.length === 0) {
      // Create team if it doesn't exist
      const newTeamResult = await sql`
        INSERT INTO teams (team_name, team_code, password_hash, status)
        VALUES (${teamName}, ${teamName.toLowerCase().replace(/\s+/g, '')}, 'temp_hash', 'active')
        RETURNING id
      ` as DatabaseResult;
      teamId = (newTeamResult[0] as TeamRecord).id;
    } else {
      teamId = (teamResult[0] as TeamRecord).id;
    }

    // Process answers (converted from transaction for Neon serverless)
    try {
      let memberScore = 0;
      const memberApproachScores: ApproachScores = {
        capital: 0,
        marketing: 0,
        strategy: 0,
        team: 0
      };

      // Process each answer
      for (const answer of answers) {
        // Get option details
        const optionResult = await sql`
          SELECT o.points, o.is_correct,
                 CASE 
                   WHEN o.option_order = 1 THEN 'capital'
                   WHEN o.option_order = 2 THEN 'marketing'
                   WHEN o.option_order = 3 THEN 'strategy'
                   WHEN o.option_order = 4 THEN 'team'
                   ELSE 'general'
                 END as category
          FROM quiz_options o
          WHERE o.id = ${answer.selectedOptionId}
        ` as DatabaseResult;

        if (optionResult.length === 0) {
          continue; // Skip invalid options
        }

        const option = optionResult[0] as { points: number; is_correct: boolean; category: string };
        memberScore += option.points;

        // Add to approach scores
        const category = option.category as keyof ApproachScores;
        if (memberApproachScores[category] !== undefined) {
          memberApproachScores[category] += option.points;
        }

        // Record the response
        await sql`
          INSERT INTO quiz_responses (team_id, question_id, option_ids, points_earned, is_correct, member_name)
          VALUES (${teamId}, ${answer.questionId}, ${[answer.selectedOptionId]}, ${option.points}, ${option.is_correct}, ${memberName})
        `;
      }

      // Update team quiz score
      await sql`
        UPDATE teams 
        SET quiz_score = COALESCE(quiz_score, 0) + ${memberScore},
            total_score = COALESCE(total_score, 0) + ${memberScore},
            last_activity = NOW(),
            updated_at = NOW()
        WHERE id = ${teamId}
      `;

      // For now, return simplified stats - full stats calculation can be added later
      const teamApproachScores: ApproachScores = {
        capital: memberApproachScores.capital,
        marketing: memberApproachScores.marketing,
        strategy: memberApproachScores.strategy,
        team: memberApproachScores.team
      };

      return NextResponse.json({
        success: true,
        memberScore: memberScore,
        teamTotalScore: memberScore,
        membersCompleted: 1,
        maxPossibleScore: 100,
        questionsAnswered: answers.length,
        memberApproachScores: memberApproachScores,
        teamApproachScores,
        message: `Quiz submitted successfully! Your score: ${memberScore}`
      });

    } catch (error) {
      console.error('Quiz submission error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to submit quiz' },
        { status: 500 }
      );
    }

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
