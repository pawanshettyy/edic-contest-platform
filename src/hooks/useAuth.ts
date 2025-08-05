"use client";

import { useAuth as useAuthContext } from '@/context/AuthContext';

// Re-export the auth hook with additional utilities
export function useAuth() {
  const authContext = useAuthContext();

  return {
    ...authContext,
    // Additional derived state
    isTeamLeader: authContext.user?.isLeader ?? false,
    teamName: authContext.team?.name ?? '',
    memberCount: authContext.team?.members.length ?? 0,
    
    // Helper functions
    hasPermission: (permission: string) => {
      // Implement permission checking logic here
      if (permission === 'manage_team') {
        return authContext.user?.isLeader ?? false;
      }
      return true;
    },
    
    isTeamMember: (memberId: string) => {
      return authContext.team?.members.some(member => member.id === memberId) ?? false;
    },
    
    getTeamMember: (memberId: string) => {
      return authContext.team?.members.find(member => member.id === memberId);
    },
  };
}

export default useAuth;
