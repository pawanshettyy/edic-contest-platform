import { SignUpFormData, SignInFormData, User, Team } from '@/types/auth';

// Auth utility functions
export const AUTH_STORAGE_KEYS = {
  USER: 'axios_user',
  TEAM: 'axios_team',
  TEAMS: 'axios_teams',
} as const;

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
    return storedUser && storedUser.trim() !== '' ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Error getting stored user:', error);
    localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
    return null;
  }
}

export function getStoredTeam(): Team | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const storedTeam = localStorage.getItem(AUTH_STORAGE_KEYS.TEAM);
    return storedTeam && storedTeam.trim() !== '' ? JSON.parse(storedTeam) : null;
  } catch (error) {
    console.error('Error getting stored team:', error);
    localStorage.removeItem(AUTH_STORAGE_KEYS.TEAM);
    return null;
  }
}

export function getStoredTeams(): Team[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const storedTeams = localStorage.getItem(AUTH_STORAGE_KEYS.TEAMS);
    return storedTeams && storedTeams.trim() !== '' ? JSON.parse(storedTeams) : [];
  } catch (error) {
    console.error('Error getting stored teams:', error);
    localStorage.removeItem(AUTH_STORAGE_KEYS.TEAMS);
    return [];
  }
}

export function storeUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
}

export function storeTeam(team: Team): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_STORAGE_KEYS.TEAM, JSON.stringify(team));
}

export function storeTeams(teams: Team[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_STORAGE_KEYS.TEAMS, JSON.stringify(teams));
}

export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
  localStorage.removeItem(AUTH_STORAGE_KEYS.TEAM);
  // Note: We don't clear teams as they persist for other users
}

export function validateSignUpData(data: SignUpFormData): string[] {
  const errors: string[] = [];

  if (!data.leaderName.trim()) {
    errors.push('Leader name is required');
  }

  if (!data.email.trim() || !/\S+@\S+\.\S+/.test(data.email)) {
    errors.push('Valid email is required');
  }

  if (!data.password || data.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (data.password !== data.confirmPassword) {
    errors.push('Passwords do not match');
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
