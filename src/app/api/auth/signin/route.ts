import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '@/lib/database';

// Validation schema for team signin
const teamSignInSchema = z.object({
  teamName: z.string().min(1, 'Team name is required'),
  memberName: z.string().min(1, 'Member name is required'),
  teamPassword: z.string().min(1, 'Team password is required'),
});

interface TeamMember {
  id?: string;
  name: string;
  email?: string;
  isLeader: boolean;
}

interface Team {
  id: string;
  team_name: string;
  team_code: string;
  password_hash: string;
  leader_name: string;
  leader_email: string;
  members: TeamMember[];
  status: string;
  created_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔐 Team signin attempt:', {
      teamName: body.teamName,
      memberName: body.memberName,
      hasPassword: !!body.teamPassword
    });

    // Validate request body
    const validatedData = teamSignInSchema.parse(body);

    // Find team in database
    const teams = await query(
      'SELECT * FROM teams WHERE team_name = $1 AND status = $2',
      [validatedData.teamName, 'active']
    );

    if (!teams || teams.length === 0) {
      console.log('❌ Team not found:', validatedData.teamName);
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const team = teams[0] as Team;
    console.log('👥 Found team:', {
      id: team.id,
      name: team.team_name,
      code: team.team_code
    });

    // Verify team password
    const isPasswordValid = await bcrypt.compare(validatedData.teamPassword, team.password_hash);
    console.log('🔐 Password validation result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Invalid team password');
      return NextResponse.json(
        { error: 'Invalid team password' },
        { status: 401 }
      );
    }

    // Parse team members
    const members = team.members || [];
    console.log('👤 Team members:', members.map(m => m.name));

    // Find the member in the team
    const member = members.find(m => 
      m.name.toLowerCase().trim() === validatedData.memberName.toLowerCase().trim()
    );

    if (!member) {
      console.log('❌ Member not found in team:', validatedData.memberName);
      return NextResponse.json(
        { error: 'Member not found in this team' },
        { status: 404 }
      );
    }

    console.log('✅ Member found:', {
      name: member.name,
      isLeader: member.isLeader
    });

    // Update last activity
    await query(
      'UPDATE teams SET last_activity = NOW() WHERE id = $1',
      [team.id]
    );

    // Create session token
    const sessionToken = jwt.sign(
      {
        teamId: team.id,
        teamName: team.team_name,
        memberId: member.id || `member_${Date.now()}`,
        memberName: member.name,
        isLeader: member.isLeader || false,
        sessionType: 'team'
      },
      process.env.JWT_SECRET || 'fallback-secret-for-development',
      { expiresIn: '24h' }
    );

    // Return success response
    const responseData = {
      message: 'Team member signed in successfully',
      user: {
        id: member.id || `member_${Date.now()}`,
        name: member.name,
        email: member.email || '',
        teamId: team.id,
        teamName: team.team_name,
        isLeader: member.isLeader || false
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

    const response = NextResponse.json(responseData);

    // Set HTTP-only cookie for team member
    response.cookies.set('team-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });

    console.log('✅ Team signin successful');
    return response;

  } catch (error) {
    console.error('Team signin error:', error);

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
