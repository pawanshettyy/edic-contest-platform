import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSql } from '@/lib/database';

// Sample teams data with proper structure
const sampleTeams = [
  {
    name: 'Alpha Innovators',
    code: 'ALPHA001',
    password: 'alpha123',
    leader: {
      name: 'Alice Johnson',
      email: 'alice@alpha.com'
    },
    members: [
      { name: 'Alice Johnson', email: 'alice@alpha.com', isLeader: true },
      { name: 'Bob Wilson', email: 'bob@alpha.com', isLeader: false },
      { name: 'Charlie Brown', email: 'charlie@alpha.com', isLeader: false }
    ]
  },
  {
    name: 'Beta Solutions',
    code: 'BETA002',
    password: 'beta456',
    leader: {
      name: 'Diana Prince',
      email: 'diana@beta.com'
    },
    members: [
      { name: 'Diana Prince', email: 'diana@beta.com', isLeader: true },
      { name: 'Edward Green', email: 'edward@beta.com', isLeader: false },
      { name: 'Fiona White', email: 'fiona@beta.com', isLeader: false },
      { name: 'George Black', email: 'george@beta.com', isLeader: false }
    ]
  },
  {
    name: 'Gamma Tech',
    code: 'GAMMA003',
    password: 'gamma789',
    leader: {
      name: 'Henry Adams',
      email: 'henry@gamma.com'
    },
    members: [
      { name: 'Henry Adams', email: 'henry@gamma.com', isLeader: true },
      { name: 'Ivy Chen', email: 'ivy@gamma.com', isLeader: false }
    ]
  }
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { recreate = false, debug = false } = body;

    console.log('🚀 Setting up teams with sample data...');
    
    const sql = getSql();

    // First, ensure the teams table has the correct schema
    console.log('📋 Ensuring teams table schema...');
    
    // Create or update the teams table with all required columns
    await sql`
      CREATE TABLE IF NOT EXISTS teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_name VARCHAR(255) NOT NULL UNIQUE,
        team_code VARCHAR(50) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        leader_name VARCHAR(255) NOT NULL,
        leader_email VARCHAR(255) NOT NULL,
        members JSONB NOT NULL DEFAULT '[]'::jsonb,
        member_count INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Add missing columns if they don't exist (for existing tables)
    try {
      await sql`ALTER TABLE teams ADD COLUMN IF NOT EXISTS member_count INTEGER NOT NULL DEFAULT 0`;
      await sql`ALTER TABLE teams ADD COLUMN IF NOT EXISTS leader_name VARCHAR(255)`;
      await sql`ALTER TABLE teams ADD COLUMN IF NOT EXISTS leader_email VARCHAR(255)`;
      await sql`ALTER TABLE teams ADD COLUMN IF NOT EXISTS members JSONB NOT NULL DEFAULT '[]'::jsonb`;
      await sql`ALTER TABLE teams ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()`;
    } catch (alterError: unknown) {
      console.log('⚠️ Some columns already exist (this is normal):', alterError instanceof Error ? alterError.message : String(alterError));
    }

    // Check if teams already exist
    const existingTeams = await sql`SELECT COUNT(*) as count FROM teams` as Array<{count: string}>;
    const teamCount = parseInt(existingTeams[0]?.count || '0');

    if (teamCount > 0 && !recreate) {
      console.log(`✅ Teams already exist (${teamCount} teams found). Use recreate=true to reset.`);
      
      if (debug) {
        const teams = await sql`SELECT team_name, team_code, leader_name, member_count, status FROM teams ORDER BY created_at`;
        return NextResponse.json({
          message: 'Teams already exist',
          existingTeams: teams,
          count: teamCount
        });
      }
      
      return NextResponse.json({
        message: 'Teams already exist',
        count: teamCount,
        note: 'Use recreate=true to reset teams'
      });
    }

    // Clear existing teams if recreating
    if (recreate) {
      console.log('🗑️ Clearing existing teams...');
      await sql`DELETE FROM teams`;
    }

    // Create sample teams with proper password hashing
    console.log('👥 Creating sample teams...');
    const createdTeams = [];

    for (const team of sampleTeams) {
      console.log(`🔐 Creating team: ${team.name}`);
      
      // Hash the password properly using bcrypt
      const passwordHash = await bcrypt.hash(team.password, 12);
      console.log(`🔒 Hashed password for ${team.name}`);

      const result = await sql`
        INSERT INTO teams (
          team_name, 
          team_code, 
          password_hash, 
          leader_name, 
          leader_email, 
          members, 
          member_count,
          status
        )
        VALUES (
          ${team.name},
          ${team.code},
          ${passwordHash},
          ${team.leader.name},
          ${team.leader.email},
          ${JSON.stringify(team.members)},
          ${team.members.length},
          'active'
        )
        RETURNING id, team_name, team_code, leader_name, member_count
      ` as Array<{
        id: string;
        team_name: string;
        team_code: string;
        leader_name: string;
        member_count: number;
      }>;

      const createdTeam = result[0];
      createdTeams.push({
        ...createdTeam,
        password: team.password, // Include original password for reference
        members: team.members
      });

      console.log(`✅ Created team: ${createdTeam.team_name} (${createdTeam.team_code})`);
    }

    console.log('✅ All sample teams created successfully!');

    return NextResponse.json({
      message: 'Sample teams created successfully',
      teams: createdTeams,
      count: createdTeams.length,
      note: 'Passwords are properly hashed with bcrypt',
      credentials: createdTeams.map(team => ({
        teamName: team.team_name,
        password: team.password,
        members: team.members.map(m => m.name)
      }))
    });

  } catch (error) {
    console.error('❌ Error setting up teams:', error);
    return NextResponse.json(
      { 
        error: 'Failed to setup teams', 
        details: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    const sql = getSql();
    
    // Get all teams with basic info
    const teams = await sql`
      SELECT 
        id,
        team_name,
        team_code,
        leader_name,
        leader_email,
        member_count,
        status,
        created_at
      FROM teams 
      ORDER BY created_at
    ` as Array<{
      id: string;
      team_name: string;
      team_code: string;
      leader_name: string;
      leader_email: string;
      member_count: number;
      status: string;
      created_at: string;
    }>;

    return NextResponse.json({
      message: 'Teams retrieved successfully',
      teams,
      count: teams.length
    });

  } catch (error) {
    console.error('❌ Error retrieving teams:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve teams', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
