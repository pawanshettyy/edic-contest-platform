import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      );
    }
    
    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret-for-development'
    ) as {
      userId: string;
      teamId: string;
      email: string;
      isLeader: boolean;
    };
    
    // TODO: Get user and team from database
    // For now, return mock data based on token
    const mockUser = {
      id: decoded.userId,
      name: 'John Doe',
      email: decoded.email,
      isLeader: decoded.isLeader,
      teamId: decoded.teamId,
    };
    
    const mockTeam = {
      id: decoded.teamId,
      name: 'Team Alpha',
      leader: {
        id: decoded.userId,
        name: 'John Doe',
        email: decoded.email,
      },
      members: [
        { id: decoded.userId, name: 'John Doe', isLeader: true },
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
    
    return NextResponse.json({
      user: mockUser,
      team: mockTeam,
    });
    
  } catch (error) {
    console.error('Auth verification error:', error);
    
    return NextResponse.json(
      { error: 'Invalid authentication token' },
      { status: 401 }
    );
  }
}
