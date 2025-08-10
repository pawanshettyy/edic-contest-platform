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

  // Load auth state from session API on mount
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const response = await fetch('/api/auth/session');
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.data) {
            setAuthState({
              user: result.data.user,
              team: result.data.team,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
        } else {
          // No valid session found
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadAuthState();
  }, []);

  const signUp = async (data: SignUpFormData): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      console.log('🚀 Making signup API call...');
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create team');
      }

      console.log('✅ Team created successfully:', result);

      // Extract user and team data from API response
      const team: Team = {
        id: result.team.id,
        name: result.team.name,
        leader: {
          id: `leader_${result.team.id}`,
          name: result.team.leader.name,
          email: result.team.leader.email,
        },
        members: result.team.members.map((member: { name: string; email?: string; isLeader: boolean }, index: number) => ({
          id: `member_${result.team.id}_${index}`,
          name: member.name,
          email: member.email || '',
        })),
        teamPassword: '', // Don't store password
        createdAt: new Date(result.team.createdAt),
      };

      const user: User = {
        id: `leader_${result.team.id}`,
        name: result.team.leader.name,
        email: result.team.leader.email,
        teamId: result.team.id,
        teamName: result.team.name,
        isLeader: true,
      };

      // Store session is handled by HTTP-only cookies
      // No need for localStorage - session is managed server-side

      setAuthState({
        user,
        team,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      console.error('Signup error:', error);
      throw error;
    }
  };

  const signIn = async (data: SignInFormData): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      console.log('🔐 Making signin API call...');
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamName: data.teamName,
          memberName: data.memberName,
          teamPassword: data.teamPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sign in');
      }

      console.log('✅ Signin successful:', result);

      // Extract user and team data from API response
      const team: Team = {
        id: result.team.id,
        name: result.team.name,
        leader: {
          id: `leader_${result.team.id}`,
          name: result.team.leader.name,
          email: result.team.leader.email,
        },
        members: result.team.members.map((member: { name: string; email?: string; isLeader: boolean }, index: number) => ({
          id: `member_${result.team.id}_${index}`,
          name: member.name,
          email: member.email || '',
        })),
        teamPassword: '', // Don't store password
        createdAt: new Date(result.team.createdAt),
      };

      const user: User = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        teamId: result.user.teamId,
        teamName: result.user.teamName,
        isLeader: result.user.isLeader,
      };

      // Session is managed server-side with HTTP-only cookies
      // No need for localStorage - session is managed server-side

      setAuthState({
        user,
        team,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      console.error('Signin error:', error);
      throw error;
    }
  };

  const signOut = () => {
    // Clear client-side state
    // No localStorage to clear - session managed server-side
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