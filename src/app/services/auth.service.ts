import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  type?: 'user' | 'business';
  vlcoinBalance?: number;
}

export interface BusinessProfile {
  id: string;
  businessName: string;
  taxId: string;
  address: string;
  phone: string;
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
      const user = session.user;
      const { data: profile } = await this.supabaseService.getClient()
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      this.user.next({
        id: user.id,
        email: user.email!,
        fullName: profile?.full_name,
        type: profile?.type,
        vlcoinBalance: profile?.vlcoin_balance
      });
    }

    this.supabaseService.getClient().auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await this.supabaseService.getClient()
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        this.user.next({
          id: session.user.id,
          email: session.user.email!,
          fullName: profile?.full_name,
          type: profile?.type,
          vlcoinBalance: profile?.vlcoin_balance
        });
      } else {
        this.user.next(null);
      }
    });
  }

  async register(fullName: string, email: string, password: string, type: 'user' | 'business', businessData?: BusinessProfile): Promise<boolean> {
    try {
      console.log('Iniciando registro con:', { fullName, email, type });

      // Paso 1: Registrar al usuario pero NO crear perfiles
      const { data: authData, error: authError } = await this.supabaseService.getClient().auth.signUp({
        email,
        password,
        options: {
          data: { 
            full_name: fullName,
            user_type: type 
          }
        }
      });

      if (authError) {
        console.error('Error en auth.signUp:', authError);
        throw authError;
      }

      console.log('Usuario registrado exitosamente:', authData);
      
      if (!authData.user) {
        console.error('No se pudo obtener el ID del usuario después del registro');
        return false;
      }

      // En este punto, el usuario está registrado pero no creamos perfiles
      // Informamos al usuario que debe verificar su correo
      return true;
    } catch (error) {
      console.error('Error detallado en el registro:', error);
      throw error;
    }
  }

  async getBusinessProfile(userId: string): Promise<BusinessProfile | null> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('business_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting business profile:', error);
      return null;
    }
  }

  async updateVLCoinBalance(userId: string, amount: number): Promise<boolean> {
    try {
      const { error } = await this.supabaseService.getClient()
        .from('profiles')
        .update({ vlcoin_balance: amount })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating VLCoin balance:', error);
      return false;
    }
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
