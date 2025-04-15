import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface User {
  id: string;
  email: string;
  fullName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private user = new BehaviorSubject<User | null>(null);
  public user$ = this.user.asObservable();

  constructor(private supabaseService: SupabaseService) {
    this.initializeUser();
  }

  private async initializeUser() {
    const { data: { session } } = await this.supabaseService.getClient().auth.getSession();
    if (session) {
      this.user.next(session.user as unknown as User);
    }

    this.supabaseService.getClient().auth.onAuthStateChange((_event, session) => {
      this.user.next(session?.user as unknown as User || null);
    });
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.getClient().auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return !!data.user;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }
  async register(fullName: string, email: string, password: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.getClient().auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) throw error;
      return !!data.user;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    await this.supabaseService.getClient().auth.signOut();
    this.user.next(null);
  }

  async loginWithGoogle(): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.getClient().auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Google login error:', error);
      return false;
    }
  }

  async loginWithApple(): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.getClient().auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Apple login error:', error);
      return false;
    }
  }

  isAuthenticated(): boolean {
    return this.user.value !== null;
  }
}
