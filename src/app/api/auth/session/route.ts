import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getSql } from '@/lib/database';

interface TeamMember {
  name: string;
  email?: string;
  isLeader: boolean;
}

interface Team {
  id: string;
  team_name: string;
  team_code: string;
  leader_name: string;
  leader_email: string;
  members: TeamMember[];
  status: string;
  created_at: string;
}

interface SessionToken {
  teamId: string;
  memberId: string;
  memberName: string;
  isLeader: boolean;
  sessionType: string;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('team-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No session token found' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-for-development') as SessionToken;
    
    if (!decoded.teamId || !decoded.memberId) {
      return NextResponse.json(
        { error: 'Invalid session token' },
        { status: 401 }
      );
    }

    const sql = getSql();
    
    // Get team data from database
    const teams = await sql`
      SELECT id, team_name, team_code, leader_name, leader_email, members, status, created_at
      FROM teams 
      WHERE id = ${decoded.teamId} AND status = 'active'
    ` as Team[];

    if (!teams || teams.length === 0) {
      return NextResponse.json(
        { error: 'Team not found or inactive' },
        { status: 404 }
      );
    }

    const team = teams[0];
    const members = team.members || [];
    
    // Find the current member
    const currentMember = members.find((m: TeamMember) => 
      m.name.toLowerCase().trim() === decoded.memberName.toLowerCase().trim()
    );

    if (!currentMember) {
      return NextResponse.json(
        { error: 'Member not found in team' },
        { status: 404 }
      );
    }

    // Return session data
    const sessionData = {
      user: {
        id: decoded.memberId,
        name: decoded.memberName,
        email: currentMember.email || '',
        teamId: team.id,
        teamName: team.team_name,
        isLeader: currentMember.isLeader || false // Use current member data from database, not JWT
      },
      team: {
        id: team.id,
        name: team.team_name,
        code: team.team_code,
        leader: {
          name: team.leader_name,
          email: team.leader_email
        },
        members: members,
        createdAt: team.created_at
      }
    };

    return NextResponse.json({
      success: true,
      data: sessionData
    });

  } catch (error) {
    console.error('Session verification error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid session token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
