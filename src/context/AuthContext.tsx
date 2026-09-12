'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, getCurrentUser, getCurrentSession, signOut as supabaseSignOut } from '@/lib/supabase-auth';

interface AuthContextType {
  user: any | null;
  session: any | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = async () => {
    try {
      const { user: newUser, error: userError } = await getCurrentUser();
      const { session: newSession } = await getCurrentSession();
      
      if (userError) {
        setError(userError.message);
        return;
      }
      
      setUser(newUser);
      setSession(newSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        setError(signInError.message);
        return { error: signInError.message };
      }
      
      setUser(data.user);
      setSession(data.session);
      return {};
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
      return { error: message };
    }
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    try {
      setError(null);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      
      if (signUpError) {
        setError(signUpError.message);
        return { error: signUpError.message };
      }
      
      setUser(data.user);
      setSession(data.session);
      return {};
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      setError(message);
      return { error: message };
    }
  };

  const signOut = async () => {
    try {
      await supabaseSignOut();
      setUser(null);
      setSession(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, newSession: any) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}