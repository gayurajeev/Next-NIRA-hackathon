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
  signInWithGoogle: (postLoginUrl?: string) => Promise<{ success: boolean; error?: string }>;
  signInAuthority: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GOV_AUTHORITY: AuthUser = {
  id: 'usr-admin-kmc',
  name: 'Executive Engineer (KMC)',
  email: 'admin@nira.in',
  role: 'GOVERNMENT',
  department: 'Keralam Municipal Drainage & Disaster Cell',
  avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load saved real session on mount
  useEffect(() => {
    // 1. Check active Supabase session
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const isGov = session.user.email === 'admin@nira.in';
          const newUser: AuthUser = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Citizen',
            email: session.user.email || '',
            role: isGov ? 'GOVERNMENT' : 'CITIZEN',
            avatar_url: session.user.user_metadata?.avatar_url,
            department: isGov ? 'Keralam Municipal Drainage & Disaster Cell' : undefined,
          };
          setUser(newUser);
          localStorage.setItem('nira_auth_user', JSON.stringify(newUser));
          setIsLoading(false);
          return;
        }
      });
    }

    // 2. Check saved localStorage session
    try {
      const saved = localStorage.getItem('nira_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure we purge any previous fake demo session
        if (parsed?.id === 'usr-citizen-1' || parsed?.email === 'rahul.citizen@gmail.com') {
          localStorage.removeItem('nira_auth_user');
          setUser(null);
        } else {
          setUser(parsed);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }

    // Supabase auth state listener — handles OAuth callback redirect
    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const isGov = session.user.email === 'admin@nira.in';
          const newUser: AuthUser = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Citizen',
            email: session.user.email || '',
            role: isGov ? 'GOVERNMENT' : 'CITIZEN',
            avatar_url: session.user.user_metadata?.avatar_url,
            department: isGov ? 'Keralam Municipal Drainage & Disaster Cell' : undefined,
          };
          setUser(newUser);
          localStorage.setItem('nira_auth_user', JSON.stringify(newUser));

          // After OAuth callback, redirect to the right dashboard
          if (event === 'SIGNED_IN' && typeof window !== 'undefined') {
            const dest = isGov ? '/admin/command-center' : '/user';
            // Only redirect if we're still on the landing/callback page
            const cur = window.location.pathname;
            if (cur === '/' || cur === '/auth/callback') {
              window.location.href = dest;
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('nira_auth_user');
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const signInWithGoogle = async (postLoginUrl = '/user'): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase client is not configured.' };
    }
    try {
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}${postLoginUrl}`
        : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) {
        return { success: false, error: error.message };
      }
      // Browser is now redirecting to Google — code below won't run until return
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to initiate Google sign-in' };
    }
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
            department: 'Keralam Municipal Drainage Cell',
            avatar_url: GOV_AUTHORITY.avatar_url,
          };
          setUser(authUser);
          localStorage.setItem('nira_auth_user', JSON.stringify(authUser));
          return { success: true };
        }
      } catch {
        // Continue
      }
    }

    return {
      success: false,
      error: 'Invalid Authority credentials. Please verify your municipal email and password.',
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signInWithGoogle,
        signInAuthority,
        signOut,
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
