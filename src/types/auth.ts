export interface TeamMember {
  id: string;
  name: string;
  email?: string;
}

export interface Team {
  id: string;
  name: string;
  leader: TeamMember;
  members: TeamMember[];
  teamPassword: string;
  createdAt: Date;
}

export interface SignUpFormData {
  leaderName: string;
  email: string;
  teamName: string;
  member1Name: string;
  member2Name: string;
  member3Name: string;
  member4Name: string;
  teamPassword: string;
  confirmTeamPassword: string;
}

export interface SignInFormData {
  teamName: string;
  memberName: string;
  teamPassword: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  teamId: string;
  teamName: string;
  isLeader: boolean;
}

export interface AuthState {
  user: User | null;
  team: Team | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}