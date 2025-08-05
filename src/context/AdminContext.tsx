'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: Record<string, unknown>;
  lastLogin: string | null;
  createdAt: string;
}

interface AdminContextType {
  admin: AdminUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAdmin = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAdmin(data.admin);
      } else {
        setAdmin(null);
      }
    } catch (error) {
      console.error('Error refreshing admin:', error);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    const response = await fetch('/api/admin/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Sign in failed');
    }

    const data = await response.json();
    setAdmin(data.admin);
  };

  const signOut = async () => {
    try {
      await fetch('/api/admin/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Signout error:', error);
    } finally {
      setAdmin(null);
    }
  };

  useEffect(() => {
    refreshAdmin();
  }, []);

  return (
    <AdminContext.Provider value={{ admin, loading, signIn, signOut, refreshAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
