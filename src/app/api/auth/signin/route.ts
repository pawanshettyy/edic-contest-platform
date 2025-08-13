import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getSql } from '@/lib/database';

// Validation schema for team signin
const teamSignInSchema = z.object({
  teamName: z.string().min(1, 'Team name is required').max(100, 'Team name too long'),
  memberName: z.string().min(1, 'Member name is required').max(100, 'Member name too long'),
  teamPassword: z.string().min(1, 'Team password is required').max(200, 'Password too long'),
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
  const startTime = Date.now();
  
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
    const sql = getSql();
    const teams = await sql`
      SELECT * FROM teams 
      WHERE team_name = ${validatedData.teamName} AND status = 'active'
    ` as Team[];

    if (!teams || teams.length === 0) {
      console.log(`❌ Team not found: ${validatedData.teamName}`);
      return NextResponse.json(
        { error: 'Invalid team name or password' }, // Generic error message for security
        { status: 401 }
      );
    }

    const team = teams[0];
    console.log('👥 Found team:', {
      id: team.id,
      name: team.team_name,
      code: team.team_code
    });

    // Verify team password with timing attack protection
    const passwordStartTime = Date.now();
    const isPasswordValid = await bcrypt.compare(validatedData.teamPassword, team.password_hash);
    const passwordCheckTime = Date.now() - passwordStartTime;
    
    // Ensure consistent timing (prevent timing attacks)
    if (passwordCheckTime < 100) {
      await new Promise(resolve => setTimeout(resolve, 100 - passwordCheckTime));
    }
    
    console.log('🔐 Password validation result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Invalid team password');
      return NextResponse.json(
        { error: 'Invalid team name or password' }, // Generic error message for security
        { status: 401 }
      );
    }

    // Parse team members and handle both old and new formats
    const rawMembers = team.members || [];
    console.log('👤 Raw team members from DB:', rawMembers);
    
    // Convert members to consistent format
    const members: TeamMember[] = rawMembers.map((member: string | TeamMember, index: number) => {
      if (typeof member === 'string') {
        // Old format: just strings, assume first member is leader
        return {
          id: `member_${team.id}_${index}`,
          name: member,
          email: member === team.leader_name ? team.leader_email : '',
          isLeader: member === team.leader_name
        };
      } else if (typeof member === 'object' && member.name) {
        // New format: objects with isLeader property
        return {
          id: member.id || `member_${team.id}_${index}`,
          name: member.name,
          email: member.email || '',
          isLeader: member.isLeader || false
        };
      } else {
        // Fallback
        return {
          id: `member_${team.id}_${index}`,
          name: 'Unknown Member',
          email: '',
          isLeader: false
        };
      }
    });
    
    console.log('👤 Processed team members:', members.map(m => ({ name: m.name, isLeader: m.isLeader })));

    // Find the member in the team
    const member = members.find(m => 
      m.name.toLowerCase().trim() === validatedData.memberName.toLowerCase().trim()
    );

    if (!member) {
      console.log('❌ Member not found in team:', validatedData.memberName);
      console.log('Available members:', members.map(m => m.name));
      return NextResponse.json(
        { error: 'Member not found in this team' },
        { status: 404 }
      );
    }

    console.log('✅ Member found:', {
      name: member.name,
      isLeader: member.isLeader,
      hasIsLeaderProperty: 'isLeader' in member
    });

    // Update last activity
    await sql`
      UPDATE teams SET last_activity = NOW() WHERE id = ${team.id}
    `;

    // Create session token with enhanced security
    const sessionData = {
      teamId: team.id,
      teamName: team.team_name,
      memberId: member.id || `member_${Date.now()}`,
      memberName: member.name,
      isLeader: member.isLeader || false,
      sessionType: 'team',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };

    const sessionToken = jwt.sign(
      sessionData,
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

    // Set HTTP-only cookie for team member with security flags
    response.cookies.set('team-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });

    // Add security headers
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);

    console.log('✅ Team signin successful');
    return response;

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Team signin error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input: ' + error.issues[0].message },
        { 
          status: 400,
          headers: { 'X-Response-Time': `${processingTime}ms` }
        }
      );
    }

    return NextResponse.json(
      { error: 'Authentication service temporarily unavailable' },
      { 
        status: 500,
        headers: { 'X-Response-Time': `${processingTime}ms` }
      }
    );
  }
}
