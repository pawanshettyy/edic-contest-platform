"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Team, AuthState, SignUpFormData, SignInFormData } from '@/types/auth';

interface AuthContextType extends AuthState {
  signUp: (data: SignUpFormData) => Promise<void>;
  signIn: (data: SignInFormData) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    team: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const storedUser = localStorage.getItem('axios_user');
        const storedTeam = localStorage.getItem('axios_team');
        
        if (storedUser && storedTeam && storedUser.trim() !== '' && storedTeam.trim() !== '') {
          const parsedUser = JSON.parse(storedUser);
          const parsedTeam = JSON.parse(storedTeam);
          
          if (parsedUser && parsedTeam) {
            setAuthState({
              user: parsedUser,
              team: parsedTeam,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        // Clear potentially corrupted localStorage data
        localStorage.removeItem('axios_user');
        localStorage.removeItem('axios_team');
        localStorage.removeItem('axios_teams');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadAuthState();
  }, []);

  const signUp = async (data: SignUpFormData): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create team and user objects
      const teamId = `team_${Date.now()}`;
      const leaderId = `user_${Date.now()}`;
      
      const team: Team = {
        id: teamId,
        name: data.teamName,
        leader: {
          id: leaderId,
          name: data.leaderName,
          email: data.email,
        },
        members: [
          { id: leaderId, name: data.leaderName, email: data.email },
          { id: `user_${Date.now() + 1}`, name: data.member1Name },
          { id: `user_${Date.now() + 2}`, name: data.member2Name },
          { id: `user_${Date.now() + 3}`, name: data.member3Name },
        ],
        teamPassword: data.teamPassword,
        createdAt: new Date(),
      };

      const user: User = {
        id: leaderId,
        name: data.leaderName,
        email: data.email,
        teamId: teamId,
        teamName: data.teamName,
        isLeader: true,
      };

      // Store in localStorage (in real app, this would be an API call)
      localStorage.setItem('axios_teams', JSON.stringify([team]));
      localStorage.setItem('axios_user', JSON.stringify(user));
      localStorage.setItem('axios_team', JSON.stringify(team));

      setAuthState({
        user,
        team,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signIn = async (data: SignInFormData): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get teams from localStorage
      const teamsData = localStorage.getItem('axios_teams');
      const teams: Team[] = teamsData && teamsData.trim() !== '' ? JSON.parse(teamsData) : [];
      
      // Find the team
      const team = teams.find(t => t.name.toLowerCase() === data.teamName.toLowerCase());
      if (!team) {
        throw new Error('Team not found');
      }
      
      // Verify team password
      if (team.teamPassword !== data.teamPassword) {
        throw new Error('Invalid team password');
      }
      
      // Find the member
      const member = team.members.find(m => m.name.toLowerCase() === data.memberName.toLowerCase());
      if (!member) {
        throw new Error('Member not found in this team');
      }
      
      const user: User = {
        id: member.id,
        name: member.name,
        email: member.email,
        teamId: team.id,
        teamName: team.name,
        isLeader: team.leader.id === member.id,
      };

      // Store in localStorage
      localStorage.setItem('axios_user', JSON.stringify(user));
      localStorage.setItem('axios_team', JSON.stringify(team));

      setAuthState({
        user,
        team,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signOut = () => {
    localStorage.removeItem('axios_user');
    localStorage.removeItem('axios_team');
    setAuthState({
      user: null,
      team: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};