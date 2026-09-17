/**
 * Auth context for admin session management
 */

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, type AuthSession } from './auth';

interface AuthContextValue {
  session: AuthSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check initial session
    authService.getSession().then((session) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data } = authService.onAuthStateChange((session) => {
      setSession(session);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const session = await authService.signIn(email, password);
    setSession(session);
    
    // Store token in localStorage for API client
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', session.accessToken);
    }
    
    router.push('/dashboard');
  };

  const signOut = async () => {
    await authService.signOut();
    setSession(null);
    
    // Clear token from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
    
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
