import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Validation schema
const signInSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
  teamPassword: z.string().min(1, 'Team password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = signInSchema.parse(body);
    
    // TODO: Find user in database by email
    // For now, we'll simulate this with mock data
    const mockUser = {
      id: 'user_1234567890',
      name: 'John Doe',
      email: validatedData.email,
      password: await bcrypt.hash('password123', 12), // Mock hashed password
      isLeader: true,
      teamId: 'team_1234567890',
      createdAt: '2025-08-05T00:00:00.000Z',
    };
    
    const mockTeam = {
      id: 'team_1234567890',
      name: 'Team Alpha',
      password: await bcrypt.hash('team123', 12), // Mock hashed team password
      leader: {
        id: 'user_1234567890',
        name: 'John Doe',
        email: validatedData.email,
      },
      members: [
        { id: 'user_1234567890', name: 'John Doe', isLeader: true },
        { id: 'member_1', name: 'Jane Smith', isLeader: false },
        { id: 'member_2', name: 'Bob Johnson', isLeader: false },
        { id: 'member_3', name: 'Alice Brown', isLeader: false },
      ],
      createdAt: '2025-08-05T00:00:00.000Z',
      contestStatus: {
        currentRound: 1,
        round1Completed: true,
        round1Qualified: true,
        round2Completed: false,
        round2Qualified: false,
        finalRank: null,
        finalScore: null,
      }
    };
    
    // TODO: Replace with actual database query
    // const user = await db.users.findByEmail(validatedData.email);
    const user = validatedData.email === 'demo@example.com' ? mockUser : null;
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // TODO: Get team from database
    // const team = await db.teams.findById(user.teamId);
    const team = mockTeam;
    
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }
    
    // Verify team password
    const isTeamPasswordValid = await bcrypt.compare(validatedData.teamPassword, team.password);
    
    if (!isTeamPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid team password' },
        { status: 401 }
      );
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        teamId: team.id, 
        email: user.email,
        isLeader: user.isLeader 
      },
      process.env.JWT_SECRET || 'fallback-secret-for-development',
      { expiresIn: '7d' }
    );
    
    // Return success response (excluding sensitive data)
    const responseUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      isLeader: user.isLeader,
      teamId: user.teamId,
    };
    
    const responseTeam = {
      id: team.id,
      name: team.name,
      leader: team.leader,
      members: team.members,
      createdAt: team.createdAt,
      contestStatus: team.contestStatus,
    };
    
    const response = NextResponse.json({
      message: 'Signed in successfully',
      user: responseUser,
      team: responseTeam,
    });
    
    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return response;
    
  } catch (error) {
    console.error('Signin error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
