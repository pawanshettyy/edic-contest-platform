import { SignUpFormData, SignInFormData, User, Team } from '@/types/auth';

// Auth utility functions - now using session-based authentication

// Session management - replaced localStorage with server-side sessions
export async function getSessionUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error('Error getting session user:', error);
    return null;
  }
}

export async function getSessionTeam(): Promise<Team | null> {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.team || null;
  } catch (error) {
    console.error('Error getting session team:', error);
    return null;
  }
}

// Deprecated - kept for backward compatibility but will be removed
export function getStoredUser(): User | null {
  console.warn('getStoredUser is deprecated. Use getSessionUser instead.');
  return null;
}

export function getStoredTeam(): Team | null {
  console.warn('getStoredTeam is deprecated. Use getSessionTeam instead.');
  return null;
}

export function getStoredTeams(): Team[] {
  console.warn('getStoredTeams is deprecated. Teams are now managed server-side.');
  return [];
}

// Deprecated - session management is now server-side
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function storeUser(_user: User): void {
  console.warn('storeUser is deprecated. Sessions are managed server-side.');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function storeTeam(_team: Team): void {
  console.warn('storeTeam is deprecated. Sessions are managed server-side.');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function storeTeams(_teams: Team[]): void {
  console.warn('storeTeams is deprecated. Teams are managed server-side.');
}

export function clearAuthStorage(): void {
  console.warn('clearAuthStorage is deprecated. Use logout API endpoint.');
}

export function validateSignUpData(data: SignUpFormData): string[] {
  const errors: string[] = [];

  if (!data.leaderName.trim()) {
    errors.push('Leader name is required');
  }

  if (!data.email.trim() || !/\S+@\S+\.\S+/.test(data.email)) {
    errors.push('Valid email is required');
  }

  if (!data.teamName.trim()) {
    errors.push('Team name is required');
  }

  if (!data.member1Name.trim() || !data.member2Name.trim() || !data.member3Name.trim()) {
    errors.push('All team member names are required');
  }

  if (!data.teamPassword || data.teamPassword.length < 4) {
    errors.push('Team password must be at least 4 characters');
  }

  if (data.teamPassword !== data.confirmTeamPassword) {
    errors.push('Team passwords do not match');
  }

  return errors;
}

export function validateSignInData(data: SignInFormData): string[] {
  const errors: string[] = [];

  if (!data.teamName.trim()) {
    errors.push('Team name is required');
  }

  if (!data.memberName.trim()) {
    errors.push('Member name is required');
  }

  if (!data.teamPassword.trim()) {
    errors.push('Team password is required');
  }

  return errors;
}

export function findTeamByName(teamName: string): Team | null {
  const teams = getStoredTeams();
  return teams.find(team => team.name.toLowerCase() === teamName.toLowerCase()) || null;
}

export function findMemberInTeam(team: Team, memberName: string): boolean {
  return team.members.some(member => 
    member.name.toLowerCase() === memberName.toLowerCase()
  );
}

export function verifyTeamPassword(team: Team, password: string): boolean {
  return team.teamPassword === password;
}
