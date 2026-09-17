/**
 * Supabase client for Admin authentication
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AuthSession {
  accessToken: string;
  user: {
    id: string;
    email: string;
  };
}

export class AuthService {
  async signIn(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.session || !data.user) {
      throw new Error('Login failed: No session returned');
    }

    return {
      accessToken: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email || '',
      },
    };
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  async getSession(): Promise<AuthSession | null> {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      return null;
    }

    return {
      accessToken: data.session.access_token,
      user: {
        id: data.session.user.id,
        email: data.session.user.email || '',
      },
    };
  }

  onAuthStateChange(callback: (session: AuthSession | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        callback({
          accessToken: session.access_token,
          user: {
            id: session.user.id,
            email: session.user.email || '',
          },
        });
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();
