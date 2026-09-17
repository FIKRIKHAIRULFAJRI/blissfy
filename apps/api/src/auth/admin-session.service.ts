import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

export interface AdminUser {
  id: string;
  email: string;
}

@Injectable()
export class AdminSessionService {
  private supabase: any;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>(
      'SUPABASE_SERVICE_KEY',
    );

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Supabase credentials not configured for admin session');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  async verifyToken(token: string): Promise<AdminUser | null> {
    if (!this.supabase) {
      console.warn('Supabase not configured');
      return null;
    }

    try {
      // Verify JWT token with Supabase
      const { data, error } = await this.supabase.auth.getUser(token);

      if (error || !data.user) {
        return null;
      }

      // Check if user is admin (can be extended with role checking)
      return {
        id: data.user.id,
        email: data.user.email || '',
      };
    } catch (err) {
      console.error('Token verification error:', err);
      return null;
    }
  }
}
