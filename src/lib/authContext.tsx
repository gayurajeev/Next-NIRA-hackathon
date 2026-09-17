'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

export type UserRole = 'CITIZEN' | 'GOVERNMENT';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  department?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAuthority: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  setDemoCitizen: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_CITIZEN: AuthUser = {
  id: 'usr-citizen-1',
  name: 'Rahul Nair',
  email: 'rahul.citizen@gmail.com',
  role: 'CITIZEN',
  avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
};

const GOV_AUTHORITY: AuthUser = {
  id: 'usr-admin-1',
  name: 'Executive Engineer (KMC)',
  email: 'admin@nira.in',
  role: 'GOVERNMENT',
  department: 'Kochi Municipal Drainage & Disaster Cell',
  avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load saved session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nira_auth_user');
      if (saved) {
        setUser(JSON.parse(saved));
      } else {
        // Default to demo citizen for seamless demo experience
        setUser(DEMO_CITIZEN);
      }
    } catch {
      setUser(DEMO_CITIZEN);
    } finally {
      setIsLoading(false);
    }

    // Supabase auth state listener
    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const isGov = session.user.email === 'admin@nira.in';
          const newUser: AuthUser = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || (isGov ? 'Executive Engineer (KMC)' : 'Verified Citizen'),
            email: session.user.email || '',
            role: isGov ? 'GOVERNMENT' : 'CITIZEN',
            avatar_url: session.user.user_metadata?.avatar_url || (isGov ? GOV_AUTHORITY.avatar_url : DEMO_CITIZEN.avatar_url),
            department: isGov ? 'Kochi Municipal Drainage & Disaster Cell' : undefined,
          };
          setUser(newUser);
          localStorage.setItem('nira_auth_user', JSON.stringify(newUser));
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const signInWithGoogle = async () => {
    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
        });
        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Google OAuth redirected or fallback to citizen profile:', err);
      }
    }
    // Fallback: Set citizen session for instant demo testing
    setUser(DEMO_CITIZEN);
    localStorage.setItem('nira_auth_user', JSON.stringify(DEMO_CITIZEN));
  };

  const signInAuthority = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = pass.trim();

    // Check government credentials
    if (trimmedEmail === 'admin@nira.in' && trimmedPass === 'nira@123') {
      setUser(GOV_AUTHORITY);
      localStorage.setItem('nira_auth_user', JSON.stringify(GOV_AUTHORITY));
      return { success: true };
    }

    // Try live Supabase Auth if configured
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPass,
        });
        if (!error && data.user) {
          const authUser: AuthUser = {
            id: data.user.id,
            name: data.user.email === 'admin@nira.in' ? 'Executive Engineer (KMC)' : 'Authorized Officer',
            email: data.user.email || 'admin@nira.in',
            role: 'GOVERNMENT',
            department: 'Kochi Municipal Drainage Cell',
            avatar_url: GOV_AUTHORITY.avatar_url,
          };
          setUser(authUser);
          localStorage.setItem('nira_auth_user', JSON.stringify(authUser));
          return { success: true };
        }
      } catch {
        // Continue to return error below
      }
    }

    return {
      success: false,
      error: 'Invalid Authority credentials. Use admin@nira.in and password nira@123',
    };
  };

  const signOut = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    setUser(null);
    localStorage.removeItem('nira_auth_user');
  };

  const setDemoCitizen = () => {
    setUser(DEMO_CITIZEN);
    localStorage.setItem('nira_auth_user', JSON.stringify(DEMO_CITIZEN));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signInWithGoogle,
        signInAuthority,
        signOut,
        setDemoCitizen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
