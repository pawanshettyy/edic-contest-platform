import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getSql } from '@/lib/database';

// Validation schema for team signup
const teamSignUpSchema = z.object({
  leaderName: z.string().min(1, 'Leader name is required'),
  email: z.string().email('Valid email is required'),
  teamName: z.string().min(1, 'Team name is required'),
  member1Name: z.string().min(1, 'Member 2 name is required'),
  member2Name: z.string().min(1, 'Member 3 name is required'),
  member3Name: z.string().min(1, 'Member 4 name is required'),
  member4Name: z.string().min(1, 'Member 5 name is required'),
  teamPassword: z.string().min(4, 'Team password must be at least 4 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🏅 Team signup attempt:', {
      teamName: body.teamName,
      leaderName: body.leaderName,
      email: body.email
    });

    // Validate request body
    const validatedData = teamSignUpSchema.parse(body);

    // Check if team name already exists
    const sql = getSql();
    const existingTeams = await sql`
      SELECT id FROM teams WHERE team_name = ${validatedData.teamName}
    ` as { id: string }[];

    if (existingTeams && existingTeams.length > 0) {
      return NextResponse.json(
        { error: 'Team name already exists' },
        { status: 409 }
      );
    }

    // Generate team code (unique identifier)
    const teamCode = `TEAM_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Hash the team password
    const hashedTeamPassword = await bcrypt.hash(validatedData.teamPassword, 12);

    // Create team members JSON
    const teamMembers = [
      { name: validatedData.leaderName, email: validatedData.email, isLeader: true },
      { name: validatedData.member1Name, isLeader: false },
      { name: validatedData.member2Name, isLeader: false },
      { name: validatedData.member3Name, isLeader: false },
      { name: validatedData.member4Name, isLeader: false }
    ];

    // Insert team into database
    const insertResult = await sql`
      INSERT INTO teams (
        team_name, 
        team_code, 
        password_hash, 
        leader_name,
        leader_email,
        members,
        current_round,
        total_score,
        quiz_score,
        voting_score,
        offline_score,
        status
      ) VALUES (
        ${validatedData.teamName},
        ${teamCode},
        ${hashedTeamPassword},
        ${validatedData.leaderName},
        ${validatedData.email},
        ${JSON.stringify(teamMembers)},
        1, 0, 0, 0, 0, 'active'
      )
      RETURNING id, team_name, team_code, created_at
    ` as {
      id: string;
      team_name: string;
      team_code: string;
      created_at: string;
    }[];

    if (!insertResult || insertResult.length === 0) {
      throw new Error('Failed to create team');
    }

    const team = insertResult[0];

    console.log('✅ Team created successfully:', {
      id: team.id,
      teamName: team.team_name,
      teamCode: team.team_code
    });

    // Return success response (excluding sensitive data)
    return NextResponse.json({
      success: true,
      message: 'Team created successfully',
      team: {
        id: team.id,
        name: team.team_name,
        code: team.team_code,
        leader: {
          name: validatedData.leaderName,
          email: validatedData.email
        },
        members: teamMembers,
        createdAt: team.created_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Team signup error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Team name or email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
