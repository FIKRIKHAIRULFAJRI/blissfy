import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface AuthSession {
  accessToken: string;
  user: {
    id: string;
    email: string;
  };
}

export class AuthService {
  async signIn(email: string, password: string): Promise<AuthSession> {
    // Gunakan Supabase Auth standar agar mendapatkan JWT yang valid untuk Backend
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

    const session: AuthSession = {
      accessToken: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email || '',
      },
    };

    // Simpan di localStorage agar terbaca oleh ApiClient
    localStorage.setItem('admin_session', JSON.stringify(session));
    return session;
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    localStorage.removeItem('admin_session');
  }

  async getSession(): Promise<AuthSession | null> {
    const session = localStorage.getItem('admin_session');
    if (!session) return null;
    
    try {
      return JSON.parse(session);
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
