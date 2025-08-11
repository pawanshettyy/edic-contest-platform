import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/database';

interface QuizOption {
  id?: string;
  option_text: string;
  points: number;
  is_correct: boolean;
  option_order: number;
  category: string; // Category for this specific option
}

interface QuizQuestion {
  id?: string;
  question: string;
  question_type: string;
  explanation: string;
  is_active: boolean;
  options: QuizOption[];
}

interface DatabaseQuestion {
  id: string;
  question: string;
  question_type: string;
  explanation: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DatabaseOption {
  id: string;
  question_id: string;
  option_text: string;
  points: number;
  is_correct: boolean;
  option_order: number;
  category: string; // Category for this specific option
}

// GET - Fetch all questions with options
export async function GET(): Promise<NextResponse> {
  try {
    const sql = getSql();
    
    // Fetch all questions
    const questionsResult = await sql`
      SELECT 
        id, question, question_type, difficulty, 
        time_limit, explanation, is_active, created_at, updated_at
      FROM quiz_questions 
      ORDER BY created_at DESC
    `;

    // Fetch all options for all questions
    const optionsResult = await sql`
      SELECT 
        id, question_id, option_text, points, is_correct, option_order, category
      FROM quiz_options 
      ORDER BY question_id, option_order
    `;

    // Group options by question_id
    const optionsByQuestion = (optionsResult as DatabaseOption[]).reduce((acc, option) => {
      if (!acc[option.question_id]) {
        acc[option.question_id] = [];
      }
      acc[option.question_id].push(option);
      return acc;
    }, {} as Record<string, DatabaseOption[]>);

    // Combine questions with their options
    const questions: QuizQuestion[] = (questionsResult as DatabaseQuestion[]).map(question => ({
      ...question,
      options: optionsByQuestion[question.id] || []
    }));

    return NextResponse.json({
      success: true,
      questions,
      totalCount: questions.length,
      activeCount: questions.filter(q => q.is_active).length
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

// POST - Create new question with options
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data: QuizQuestion = await request.json();
    const sql = getSql();

    // Check if maximum questions limit is reached
    const countResult = await sql`SELECT COUNT(*) as count FROM quiz_questions`;
    const questionCount = parseInt(String(((countResult as unknown[])[0] as { count: string }).count));
    
    if (questionCount >= 15) {
      return NextResponse.json(
        { success: false, error: 'Maximum 15 questions allowed' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!data.question?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Question is required' },
        { status: 400 }
      );
    }

    if (!data.options || data.options.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 options are required' },
        { status: 400 }
      );
    }

    const hasCorrectAnswer = data.options.some(opt => opt.is_correct && opt.option_text.trim());
    if (!hasCorrectAnswer) {
      return NextResponse.json(
        { success: false, error: 'At least one option must be marked as correct' },
        { status: 400 }
      );
    }

    // Create question and options (converted from transaction for Neon serverless)
    try {
      // Insert question
      const questionResult = await sql`
        INSERT INTO quiz_questions (
          question, question_type, 
          explanation, is_active
        ) VALUES (${data.question.trim()}, ${data.question_type}, ${data.explanation?.trim() || ''}, ${data.is_active})
        RETURNING id
      `;

      const questionId = ((questionResult as unknown[])[0] as { id: string }).id;

      // Insert options
      for (const option of data.options) {
        if (option.option_text.trim()) {
          await sql`
            INSERT INTO quiz_options (
              question_id, option_text, points, is_correct, option_order, category
            ) VALUES (${questionId}, ${option.option_text.trim()}, ${option.points || 0}, ${option.is_correct}, ${option.option_order}, ${option.category || 'General'})
          `;
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Question created successfully',
        questionId: questionId
      });

    } catch (error) {
      console.error('Error creating question:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create question' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create question' },
      { status: 500 }
    );
  }
}

// PUT - Update existing question with options
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('id');

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'Question ID is required' },
        { status: 400 }
      );
    }

    const data: QuizQuestion = await request.json();

    // Validate required fields
    if (!data.question?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Question is required' },
        { status: 400 }
      );
    }

    if (!data.options || data.options.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 options are required' },
        { status: 400 }
      );
    }

    const hasCorrectAnswer = data.options.some(opt => opt.is_correct && opt.option_text.trim());
    if (!hasCorrectAnswer) {
      return NextResponse.json(
        { success: false, error: 'At least one option must be marked as correct' },
        { status: 400 }
      );
    }

    // Update question and options (converted from transaction for Neon serverless)
    try {
      const sql = getSql();
      
      // Update question
      await sql`
        UPDATE quiz_questions 
        SET question = ${data.question.trim()}, question_type = ${data.question_type}, 
            explanation = ${data.explanation?.trim() || ''}, 
            is_active = ${data.is_active}, updated_at = NOW()
        WHERE id = ${questionId}
      `;

      // Delete existing options
      await sql`DELETE FROM quiz_options WHERE question_id = ${questionId}`;

      // Insert new options
      for (const option of data.options) {
        if (option.option_text.trim()) {
          await sql`
            INSERT INTO quiz_options (
              question_id, option_text, points, is_correct, option_order, category
            ) VALUES (${questionId}, ${option.option_text.trim()}, ${option.points || 0}, ${option.is_correct}, ${option.option_order}, ${option.category || 'General'})
          `;
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Question updated successfully'
      });

    } catch (error) {
      console.error('Error updating question:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update question' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Question updated successfully'
    });

  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

// PATCH - Update question status only
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('id');

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'Question ID is required' },
        { status: 400 }
      );
    }

    const { is_active } = await request.json();
    const sql = getSql();

    await sql`
      UPDATE quiz_questions 
      SET is_active = ${is_active}, updated_at = NOW()
      WHERE id = ${questionId}
    `;

    return NextResponse.json({
      success: true,
      message: `Question ${is_active ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Error updating question status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update question status' },
      { status: 500 }
    );
  }
}

// DELETE - Remove question and its options
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('id');

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'Question ID is required' },
        { status: 400 }
      );
    }

    // Check if question exists and is not used in any submissions
    const sql = getSql();
    const submissionCheck = await sql`
      SELECT COUNT(*) as count 
      FROM quiz_submissions 
      WHERE question_id = ${questionId}
    `;

    const submissionCount = Number(((submissionCheck as unknown[])[0] as { count: string }).count);
    
    if (submissionCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete question that has been answered by teams' },
        { status: 400 }
      );
    }

    // Delete question (options will be deleted due to CASCADE)
    await sql`DELETE FROM quiz_questions WHERE id = ${questionId}`;

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
