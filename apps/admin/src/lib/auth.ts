/**
 * Supabase client for Admin authentication
 */

import { createClient } from '@supabase/supabase-js';

let supabase: any = null;

function getSupabaseClient() {
  if (supabase) return supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    );
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey);
  return supabase;
}

export interface AuthSession {
  accessToken: string;
  user: {
    id: string;
    email: string;
  };
}

export class AuthService {
  async signIn(email: string, password: string): Promise<AuthSession> {
    const client = getSupabaseClient();

    const { data, error } = await client.auth.signInWithPassword({
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
    try {
      const client = getSupabaseClient();
      const { error } = await client.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      // Ignore errors during signout if not configured
      console.error('Signout error:', err);
    }
  }

  async getSession(): Promise<AuthSession | null> {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.getSession();

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
    } catch (err) {
      console.error('Get session error:', err);
      return null;
    }
  }

  onAuthStateChange(callback: (session: AuthSession | null) => void) {
    try {
      const client = getSupabaseClient();
      return client.auth.onAuthStateChange((event: any, session: any) => {
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
    } catch (err) {
      callback(null);
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  }
}

export const authService = new AuthService();
