// User and Team data access objects
import { query, transaction } from './database';
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
    const users = await query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return users[0] || null;
  }

  static async findById(id: string): Promise<User | null> {
    const users = await query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return users[0] || null;
  }

  static async create(userData: {
    name: string;
    email: string;
    password: string;
    isLeader: boolean;
    teamId: string;
  }): Promise<User> {
    const passwordHash = await bcrypt.hash(userData.password, 12);
    
    const users = await query<User>(
      `INSERT INTO users (name, email, password_hash, is_leader, team_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userData.name, userData.email, passwordHash, userData.isLeader, userData.teamId]
    );
    
    return users[0];
  }

  static async updateTeam(userId: string, teamId: string): Promise<void> {
    await query(
      'UPDATE users SET team_id = $1, updated_at = NOW() WHERE id = $2',
      [teamId, userId]
    );
  }
}

// Team DAO
export class TeamDAO {
  static async findByName(name: string): Promise<Team | null> {
    const teams = await query<Team>(
      'SELECT * FROM teams WHERE name = $1',
      [name]
    );
    return teams[0] || null;
  }

  static async findById(id: string): Promise<Team | null> {
    const teams = await query<Team>(
      'SELECT * FROM teams WHERE id = $1',
      [id]
    );
    return teams[0] || null;
  }

  static async create(teamData: {
    name: string;
    password: string;
    leaderId: string;
  }): Promise<Team> {
    const passwordHash = await bcrypt.hash(teamData.password, 12);
    
    const teams = await query<Team>(
      `INSERT INTO teams (name, password_hash, leader_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [teamData.name, passwordHash, teamData.leaderId]
    );
    
    return teams[0];
  }

  static async getMembers(teamId: string): Promise<TeamMember[]> {
    return await query<TeamMember>(
      `SELECT tm.*, u.name 
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = $1
       ORDER BY tm.is_leader DESC, tm.joined_at ASC`,
      [teamId]
    );
  }

  static async addMember(teamId: string, memberData: {
    name: string;
    isLeader: boolean;
  }): Promise<TeamMember> {
    const members = await query<TeamMember>(
      `INSERT INTO team_members (team_id, name, is_leader)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [teamId, memberData.name, memberData.isLeader]
    );
    
    return members[0];
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
    return await query<TeamProgress>(
      `SELECT tp.*, cr.round_number, cr.name as round_name
       FROM team_progress tp
       JOIN contest_rounds cr ON tp.round_id = cr.id
       WHERE tp.team_id = $1
       ORDER BY cr.round_number`,
      [teamId]
    );
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
    const setClause: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (data.completed !== undefined) {
      setClause.push(`completed = $${paramCount++}`);
      values.push(data.completed);
    }
    if (data.qualified !== undefined) {
      setClause.push(`qualified = $${paramCount++}`);
      values.push(data.qualified);
    }
    if (data.score !== undefined) {
      setClause.push(`score = $${paramCount++}`);
      values.push(data.score);
    }
    if (data.submissionData !== undefined) {
      setClause.push(`submission_data = $${paramCount++}`);
      values.push(JSON.stringify(data.submissionData));
    }
    
    if (data.completed) {
      setClause.push(`completed_at = NOW()`);
    }

    values.push(teamId, roundId);

    await query(
      `INSERT INTO team_progress (team_id, round_id, ${setClause.join(', ')})
       VALUES ($${paramCount++}, $${paramCount++}${setClause.length > 0 ? ', ' + setClause.map((_, i) => `$${i + 1}`).join(', ') : ''})
       ON CONFLICT (team_id, round_id)
       DO UPDATE SET ${setClause.join(', ')}`,
      values
    );
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
  return await transaction(async (client) => {
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
    await query(
      'UPDATE teams SET leader_id = $1 WHERE id = $2',
      [leader.id, team.id]
    );

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
  });
}
