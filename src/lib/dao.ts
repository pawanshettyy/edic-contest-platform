// User and Team data access objects
import { getSql } from './database';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  is_leader: boolean;
  team_id: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  password_hash: string;
  leader_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  name: string;
  is_leader: boolean;
  joined_at: string;
}

export interface TeamProgress {
  id: string;
  team_id: string;
  round_id: string;
  completed: boolean;
  qualified: boolean;
  score: number;
  submission_data: Record<string, unknown>;
  completed_at: string | null;
  created_at: string;
}

// User DAO
export class UserDAO {
  static async findByEmail(email: string): Promise<User | null> {
    const sql = getSql();
    const users = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;
    return (users as User[])[0] || null;
  }

  static async findById(id: string): Promise<User | null> {
    const sql = getSql();
    const users = await sql`
      SELECT * FROM users WHERE id = ${id}
    `;
    return (users as User[])[0] || null;
  }

  static async create(userData: {
    name: string;
    email: string;
    password: string;
    isLeader: boolean;
    teamId: string;
  }): Promise<User> {
    const passwordHash = await bcrypt.hash(userData.password, 12);
    const sql = getSql();
    
    const users = await sql`
      INSERT INTO users (name, email, password_hash, is_leader, team_id)
      VALUES (${userData.name}, ${userData.email}, ${passwordHash}, ${userData.isLeader}, ${userData.teamId})
      RETURNING *
    `;
    
    return (users as User[])[0];
  }

  static async updateTeam(userId: string, teamId: string): Promise<void> {
    const sql = getSql();
    await sql`
      UPDATE users SET team_id = ${teamId}, updated_at = NOW() WHERE id = ${userId}
    `;
  }
}

// Team DAO
export class TeamDAO {
  static async findByName(name: string): Promise<Team | null> {
    const sql = getSql();
    const teams = await sql`
      SELECT * FROM teams WHERE name = ${name}
    `;
    return (teams as Team[])[0] || null;
  }

  static async findById(id: string): Promise<Team | null> {
    const sql = getSql();
    const teams = await sql`
      SELECT * FROM teams WHERE id = ${id}
    `;
    return (teams as Team[])[0] || null;
  }

  static async create(teamData: {
    name: string;
    password: string;
    leaderId: string;
  }): Promise<Team> {
    const passwordHash = await bcrypt.hash(teamData.password, 12);
    const sql = getSql();
    
    const teams = await sql`
      INSERT INTO teams (name, password_hash, leader_id)
      VALUES (${teamData.name}, ${passwordHash}, ${teamData.leaderId})
      RETURNING *
    `;
    
    return (teams as Team[])[0];
  }

  static async getMembers(teamId: string): Promise<TeamMember[]> {
    const sql = getSql();
    return await sql`
      SELECT tm.*, u.name 
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ${teamId}
      ORDER BY tm.is_leader DESC, tm.joined_at ASC
    ` as TeamMember[];
  }

  static async addMember(teamId: string, memberData: {
    name: string;
    isLeader: boolean;
  }): Promise<TeamMember> {
    const sql = getSql();
    const members = await sql`
      INSERT INTO team_members (team_id, name, is_leader)
      VALUES (${teamId}, ${memberData.name}, ${memberData.isLeader})
      RETURNING *
    `;
    
    return (members as TeamMember[])[0];
  }

  static async verifyPassword(teamId: string, password: string): Promise<boolean> {
    const team = await this.findById(teamId);
    if (!team) return false;
    
    return await bcrypt.compare(password, team.password_hash);
  }
}

// Team Progress DAO
export class TeamProgressDAO {
  static async getProgress(teamId: string): Promise<TeamProgress[]> {
    const sql = getSql();
    return await sql`
      SELECT tp.*, cr.round_number, cr.name as round_name
      FROM team_progress tp
      JOIN contest_rounds cr ON tp.round_id = cr.id
      WHERE tp.team_id = ${teamId}
      ORDER BY cr.round_number
    ` as TeamProgress[];
  }

  static async updateProgress(
    teamId: string,
    roundId: string,
    data: {
      completed?: boolean;
      qualified?: boolean;
      score?: number;
      submissionData?: Record<string, unknown>;
    }
  ): Promise<void> {
    const sql = getSql();
    
    // For simplicity with Neon, we'll do separate updates or use a more direct approach
    if (data.completed !== undefined || data.qualified !== undefined || data.score !== undefined || data.submissionData !== undefined) {
      await sql`
        INSERT INTO team_progress (team_id, round_id, completed, qualified, score, submission_data, completed_at)
        VALUES (
          ${teamId}, 
          ${roundId}, 
          ${data.completed || false}, 
          ${data.qualified || false}, 
          ${data.score || 0}, 
          ${data.submissionData ? JSON.stringify(data.submissionData) : null},
          ${data.completed ? new Date() : null}
        )
        ON CONFLICT (team_id, round_id) DO UPDATE SET
          completed = EXCLUDED.completed,
          qualified = EXCLUDED.qualified,
          score = EXCLUDED.score,
          submission_data = EXCLUDED.submission_data,
          completed_at = EXCLUDED.completed_at
      `;
    }
  }
}

// Registration function that creates both user and team
export async function registerTeam(registrationData: {
  leaderName: string;
  email: string;
  password: string;
  teamName: string;
  teamPassword: string;
  memberNames: string[];
}) {
  // Note: Neon handles transactions differently, but this registration
  // process can be done sequentially with error handling
  try {
    // Check if email already exists
    const existingUser = await UserDAO.findByEmail(registrationData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Check if team name already exists
    const existingTeam = await TeamDAO.findByName(registrationData.teamName);
    if (existingTeam) {
      throw new Error('Team name already taken');
    }

    // Create temporary team to get ID
    const team = await TeamDAO.create({
      name: registrationData.teamName,
      password: registrationData.teamPassword,
      leaderId: 'temp', // Will be updated after user creation
    });

    // Create leader user
    const leader = await UserDAO.create({
      name: registrationData.leaderName,
      email: registrationData.email,
      password: registrationData.password,
      isLeader: true,
      teamId: team.id,
    });

    // Update team with correct leader ID
    const sql = getSql();
    await sql`
      UPDATE teams SET leader_id = ${leader.id} WHERE id = ${team.id}
    `;

    // Add leader to team members
    await TeamDAO.addMember(team.id, {
      name: registrationData.leaderName,
      isLeader: true,
    });

    // Add other team members
    for (const memberName of registrationData.memberNames) {
      await TeamDAO.addMember(team.id, {
        name: memberName,
        isLeader: false,
      });
    }

    return { user: leader, team };
  } catch (error) {
    // In a real transaction, we'd rollback here
    // For now, we'll let the error propagate
    throw error;
  }
}
