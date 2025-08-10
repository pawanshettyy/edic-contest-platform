import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/database';

interface ApproachScores {
  capital: number;
  marketing: number;
  strategy: number;
  team: number;
}

interface DatabaseQuestion {
  id: string;
  question: string;
  type: string;
  difficulty: string;
  category: string;
  time_limit: number;
  explanation: string;
  is_active: boolean;
  options: Record<string, unknown>[];
}

interface TeamStats {
  members_completed: number;
  team_total_score: number;
  capital_total: number;
  marketing_total: number;
  strategy_total: number;
  team_total: number;
}

interface MaxScoreResult {
  max_score: number;
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
    const existingSubmission = await query(
      `SELECT id FROM quiz_responses qr
       JOIN teams t ON t.team_name = $1
       WHERE qr.team_id = t.id AND qr.member_name = $2
       LIMIT 1`,
      [teamName, memberName]
    );
    
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
    const questionsData = await query(`
      SELECT 
        q.id,
        q.question,
        q.question_type as type,
        q.difficulty,
        q.category,
        q.time_limit,
        q.explanation,
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
      GROUP BY q.id, q.question, q.question_type, q.difficulty, 
               q.category, q.time_limit, q.explanation, q.is_active
      ORDER BY RANDOM()
      LIMIT 15
    `);

    const questions = questionsData.map((q: unknown) => {
      const question = q as DatabaseQuestion;
      return {
        id: question.id,
        question: question.question,
        type: question.type,
        difficulty: question.difficulty,
        category: question.category,
        timeLimit: question.time_limit,
        explanation: question.explanation,
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

// POST - Submit quiz answers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
    const teamResult = await query(
      'SELECT id FROM teams WHERE team_name = $1',
      [teamName]
    );

    let teamId: string;
    if (teamResult.length === 0) {
      // Create team if it doesn't exist
      const newTeamResult = await query(
        `INSERT INTO teams (team_name, team_code, password_hash, status)
         VALUES ($1, $2, $3, 'active')
         RETURNING id`,
        [teamName, teamName.toLowerCase().replace(/\s+/g, ''), 'temp_hash']
      );
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
        const optionResult = await query(
          `SELECT o.points, o.is_correct,
                  CASE 
                    WHEN o.option_order = 1 THEN 'capital'
                    WHEN o.option_order = 2 THEN 'marketing'
                    WHEN o.option_order = 3 THEN 'strategy'
                    WHEN o.option_order = 4 THEN 'team'
                    ELSE 'general'
                  END as category
           FROM quiz_options o
           WHERE o.id = $1`,
          [answer.selectedOptionId]
        );

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
        await query(
          `INSERT INTO quiz_responses (team_id, question_id, option_ids, points_earned, is_correct, member_name)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            teamId,
            answer.questionId,
            [answer.selectedOptionId],
            option.points,
            option.is_correct,
            memberName
          ]
        );
      }

      // Update team quiz score
      await query(
        `UPDATE teams 
         SET quiz_score = COALESCE(quiz_score, 0) + $1,
             total_score = COALESCE(total_score, 0) + $1,
             last_activity = NOW(),
             updated_at = NOW()
         WHERE id = $2`,
        [memberScore, teamId]
      );

      // Calculate team statistics
      const teamStats = await query(
        `SELECT 
           COUNT(DISTINCT member_name) as members_completed,
           SUM(points_earned) as team_total_score,
           SUM(CASE WHEN option_ids::text LIKE '%capital%' THEN points_earned ELSE 0 END) as capital_total,
           SUM(CASE WHEN option_ids::text LIKE '%marketing%' THEN points_earned ELSE 0 END) as marketing_total,
           SUM(CASE WHEN option_ids::text LIKE '%strategy%' THEN points_earned ELSE 0 END) as strategy_total,
           SUM(CASE WHEN option_ids::text LIKE '%team%' THEN points_earned ELSE 0 END) as team_total
         FROM quiz_responses qr
         JOIN quiz_options o ON o.id = ANY(qr.option_ids)
         WHERE qr.team_id = $1`,
      [teamId]
    );

    const stats = teamStats[0] || {
      members_completed: 1,
      team_total_score: memberScore,
      capital_total: memberApproachScores.capital,
      marketing_total: memberApproachScores.marketing,
      strategy_total: memberApproachScores.strategy,
      team_total: memberApproachScores.team
    };

    // Calculate max possible score
    const maxScoreResult = await query(
      `SELECT SUM(GREATEST(o1.points, o2.points, o3.points, o4.points)) as max_score
       FROM quiz_questions q
       LEFT JOIN quiz_options o1 ON q.id = o1.question_id AND o1.option_order = 1
       LEFT JOIN quiz_options o2 ON q.id = o2.question_id AND o2.option_order = 2
       LEFT JOIN quiz_options o3 ON q.id = o3.question_id AND o3.option_order = 3
       LEFT JOIN quiz_options o4 ON q.id = o4.question_id AND o4.option_order = 4
       WHERE q.is_active = true`
    );

    const maxPossibleScore = (maxScoreResult[0] as MaxScoreResult)?.max_score || 100;

    const teamApproachScores: ApproachScores = {
      capital: Number((stats as TeamStats).capital_total) || 0,
      marketing: Number((stats as TeamStats).marketing_total) || 0,
      strategy: Number((stats as TeamStats).strategy_total) || 0,
      team: Number((stats as TeamStats).team_total) || 0
    };

    return NextResponse.json({
      success: true,
      memberScore: memberScore,
      teamTotalScore: Number((stats as TeamStats).team_total_score) || memberScore,
      membersCompleted: Number((stats as TeamStats).members_completed) || 1,
      maxPossibleScore: Number(maxPossibleScore),
      questionsAnswered: answers.length,
      memberApproachScores: memberApproachScores,
      teamApproachScores,
      message: `Quiz submitted successfully! Your score: ${memberScore}. Team total: ${(stats as TeamStats).team_total_score || memberScore} (${(stats as TeamStats).members_completed || 1} members completed)`
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
