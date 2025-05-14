import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NotificationService } from './notification.service';
import { SupabaseService } from './supabase.service';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  photoUrl?: string;
  type?: string;
  vlcoinBalance?: number;
  phone?: string;
  address?: string;
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

  constructor(private supabaseService: SupabaseService, private notificationService: NotificationService) {
    this.initializeUser();
  }

  private async initializeUser() {
    try {
      // Check if we already have a valid session
      const { data: { session } } = await this.supabaseService.getClient().auth.getSession();
      
      if (session?.user) {
        console.log('AuthService - Sesión existente recuperada');
        
        try {
          // Fetch user profile data
          const { data: userData, error } = await this.supabaseService.getClient()
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (error) {
            throw error;
          }
          
          this.user.next({
            id: session.user.id,
            email: session.user.email || '',
            fullName: userData?.['full_name'] || session.user.user_metadata?.['full_name'] || '',
            photoUrl: userData?.['photo_url'],
            type: userData?.['type'] || 'user',
            vlcoinBalance: userData?.['vlcoin_balance'] || 0,
            phone: userData?.['phone'],
            address: userData?.['address']
          });
          
          console.log('AuthService - Usuario inicializado desde sesión existente');
        } catch (profileError) {
          console.error('AuthService - Error al cargar perfil de usuario:', profileError);
          // If we can't load the profile, still set the basic user data
          this.user.next({
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.['full_name'] || ''
          });
        }
      } else {
        console.log('AuthService - No hay sesión activa');
        this.user.next(null);
      }
    } catch (error) {
      console.error('AuthService - Error al inicializar usuario:', error);
      this.user.next(null);
    }

    // Configurar el listener para cambios en el estado de autenticación
    const { data: { subscription } } = this.supabaseService.getClient().auth.onAuthStateChange(async (_event, session) => {
      console.log('AuthService - Cambio en el estado de autenticación:', _event);
      
      if (session?.user) {
        console.log('AuthService - Usuario autenticado:', session.user);
        
        // Buscar el perfil del usuario
        const { data: profile } = await this.supabaseService.getClient()
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (!profile) {
          console.log('AuthService - Perfil no encontrado después de autenticación, creando uno nuevo');
          
          // Crear un perfil para el usuario
          try {
            const userData = {
              id: session.user.id,
              email: session.user.email!,
              full_name: session.user.user_metadata?.['full_name'] || session.user.user_metadata?.['name'] || '',
              type: session.user.user_metadata?.['user_type'] || 'user',
              vlcoin_balance: 0
            };
            
            await this.supabaseService.getClient()
              .from('profiles')
              .upsert(userData);
              
            console.log('AuthService - Perfil creado después de autenticación');
          } catch (error) {
            console.error('AuthService - Error al crear perfil después de autenticación:', error);
          }
        }
        
        try {
          // Fetch user profile data again to get the latest
          const { data: userData } = await this.supabaseService.getClient()
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          this.user.next({
            id: session.user.id,
            email: session.user.email || '',
            fullName: userData?.['full_name'] || session.user.user_metadata?.['full_name'] || '',
            photoUrl: userData?.['photo_url'],
            type: userData?.['type'] || 'user',
            vlcoinBalance: userData?.['vlcoin_balance'] || 0,
            phone: userData?.['phone'],
            address: userData?.['address']
          });
        } catch (profileError) {
          console.error('AuthService - Error al cargar perfil actualizado:', profileError);
          this.user.next({
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.['full_name'] || ''
          });
        }
      } else {
        console.log('AuthService - Usuario desconectado');
        this.user.next(null);
      }
    });
    
    // Cleanup subscription when the service is destroyed
    window.addEventListener('beforeunload', () => {
      subscription.unsubscribe();
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
    await this.notificationService.showSuccess('Sesión cerrada correctamente');
  }

  async loginWithGoogle(): Promise<boolean> {
    try {
      console.log('AuthService - Iniciando login con Google');
      
      // Obtener la URL completa para la redirección
      const redirectTo = `${window.location.origin}/tabs/profile`;
      console.log('AuthService - URL de redirección:', redirectTo);
      
      const { data, error } = await this.supabaseService.getClient().auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('AuthService - Error en login con Google:', error);
        throw error;
      }
      
      console.log('AuthService - Login con Google iniciado correctamente');
      return true;
    } catch (error) {
      console.error('AuthService - Error en login con Google:', error);
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

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.supabaseService.getClient().auth.getUser();
    
    if (!user) {
      return null;
    }

    // Fetch additional user details from the profiles table
    const { data: userData, error } = await this.supabaseService.getClient()
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user details:', error);
      return {
        id: user.id,
        email: user.email || '',
        fullName: user.user_metadata?.['full_name']
      };
    }

    return {
      id: user.id,
      email: user.email || '',
      fullName: userData?.['full_name'] || user.user_metadata?.['full_name'],
      photoUrl: userData?.['photo_url'],
      type: userData?.['type'] || 'user',
      vlcoinBalance: userData?.['vlcoin_balance'] || 0,
      phone: userData?.['phone'],
      address: userData?.['address']
    };
  }

  async updateUserPhotoUrl(userId: string, photoUrl: string): Promise<void> {
    try {
      // Actualizar la URL de la foto en el perfil
      const { error } = await this.supabaseService.getClient()
        .from('profiles')
        .update({ 
          photo_url: photoUrl,
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating photo URL:', error);
        throw error;
      }

      // Actualizar el BehaviorSubject para reflejar el cambio
      const currentUser = this.user.getValue();
      if (currentUser && currentUser.id === userId) {
        this.user.next({
          ...currentUser,
          photoUrl: photoUrl
        });
      }
    } catch (error) {
      console.error('Comprehensive error in updateUserPhotoUrl:', error);
      throw error;
    }
  }

  async updateUserProfile(updates: Partial<User>): Promise<void> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) throw new Error('No hay usuario autenticado');

      const profileData: any = {
        full_name: updates.fullName,
        phone: updates.phone,
        address: updates.address
      };

      // Eliminar campos undefined
      Object.keys(profileData).forEach(key => 
        profileData[key] === undefined && delete profileData[key]
      );

      await this.supabaseService.getClient()
        .from('profiles')
        .update(profileData)
        .eq('id', currentUser.id);

      // Actualizar el estado local
      const updatedUser = { ...currentUser, ...updates };
      this.user.next(updatedUser);

    } catch (error) {
      console.error('Error actualizando perfil:', error);
      throw error;
    }
  }
}
