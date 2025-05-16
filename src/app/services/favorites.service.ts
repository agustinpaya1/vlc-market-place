import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private favorites = new BehaviorSubject<string[]>([]);
  private isAuthenticated = false;
  private LOCAL_STORAGE_KEY = 'vlc_marketplace_favorites';

  constructor(
    private authService: AuthService,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService
  ) {
    console.log('[Favoritos] Inicializando servicio');
    
    // Cargar favoritos cuando cambia el estado de autenticación
    this.authService.user$.subscribe(user => {
      const wasAuthenticated = this.isAuthenticated;
      this.isAuthenticated = !!user;
      
      console.log('[Favoritos] Estado de autenticación cambiado:', 
        wasAuthenticated, '->', this.isAuthenticated, 
        user ? `(usuario: ${user.id})` : '(sin usuario)');
      
      if (this.isAuthenticated) {
        // Si el usuario inicia sesión, cargar desde la base de datos
        this.loadFavoritesFromDatabase();
      } else if (wasAuthenticated && !this.isAuthenticated) {
        // Si el usuario cierra sesión, limpiar favoritos
        console.log('[Favoritos] Usuario cerró sesión, limpiando favoritos');
        this.favorites.next([]);
        this.saveFavorites([]);
      }
    });

    // Verificar autenticación inicial y cargar favoritos
    this.initializeWithAuth();
  }

  // Método para inicializar con verificación de autenticación
  private async initializeWithAuth(): Promise<void> {
    try {
      const user = await this.authService.getCurrentUser();
      this.isAuthenticated = !!user;
      
      console.log('[Favoritos] Autenticación inicial:', 
        this.isAuthenticated ? `Autenticado (${user?.id})` : 'No autenticado');
      
      // Primero cargar favoritos normalmente
      this.loadFavorites();
      
      // Si el usuario está autenticado, forzar sincronización completa después de cargar
      if (this.isAuthenticated && user?.id) {
        // Esperamos un momento para que la carga inicial se complete
        setTimeout(() => {
          this.forceFullSync();
        }, 2000);
      }
    } catch (error) {
      console.error('[Favoritos] Error al inicializar autenticación:', error);
      this.isAuthenticated = false;
      this.loadFavorites();
    }
  }

  // Obtener lista observable de favoritos
  getFavorites(): Observable<string[]> {
    return this.favorites.asObservable();
  }

  // Verificar si una tienda está en favoritos
  isFavorite(storeId: string): boolean {
    if (!storeId) {
      console.warn('[Favoritos] Se intentó verificar un storeId nulo');
      return false;
    }
    const result = this.favorites.value.includes(storeId);
    console.log(`[Favoritos] Verificando si ${storeId} es favorito: ${result}`);
    return result;
  }

  // Alternar estado de favorito
  toggleFavorite(storeId: string): boolean {
    console.log(`[Favoritos] Alternando favorito para tienda ${storeId}`);
    
    if (!storeId) {
      console.error('[Favoritos] ID de tienda inválido');
      this.notificationService.show({
        message: 'Error al procesar favorito: ID de tienda inválido',
        type: 'error',
        duration: 3000
      });
      return false;
    }
    
    if (!this.isAuthenticated) {
      console.log('[Favoritos] Usuario no autenticado, mostrando mensaje');
      this.notificationService.show({
        message: 'Inicia sesión para guardar tus tiendas favoritas',
        type: 'warning',
        duration: 3000,
        action: {
          text: 'Iniciar sesión',
          handler: () => {
            window.location.href = '/login';
          }
        }
      });
      return false;
    }

    const currentFavorites = [...this.favorites.value];
    const isCurrentlyFavorite = currentFavorites.includes(storeId);
    
    console.log(`[Favoritos] Estado actual para ${storeId}: ${isCurrentlyFavorite ? 'Es favorito' : 'No es favorito'}`);
    
    if (isCurrentlyFavorite) {
      // Eliminar de favoritos
      const updatedFavorites = currentFavorites.filter(id => id !== storeId);
      this.favorites.next(updatedFavorites);
      this.saveFavorites(updatedFavorites);
      this.syncWithDatabase(storeId, false);
      return false;
    } else {
      // Añadir a favoritos
      const updatedFavorites = [...currentFavorites, storeId];
      this.favorites.next(updatedFavorites);
      this.saveFavorites(updatedFavorites);
      this.syncWithDatabase(storeId, true);
      return true;
    }
  }

  // Guardar favoritos en localStorage
  private saveFavorites(favorites: string[]): void {
    localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(favorites));
  }

  // Cargar favoritos desde localStorage o la base de datos
  private loadFavorites(): void {
    if (this.isAuthenticated) {
      // Si está autenticado, intentar cargar desde la base de datos
      this.loadFavoritesFromDatabase();
    } else {
      // Si no está autenticado, cargar desde localStorage
      const storedFavorites = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (storedFavorites) {
        try {
          const parsedFavorites = JSON.parse(storedFavorites);
          this.favorites.next(Array.isArray(parsedFavorites) ? parsedFavorites : []);
        } catch (error) {
          console.error('Error parsing favorites from localStorage:', error);
          this.favorites.next([]);
        }
      } else {
        this.favorites.next([]);
      }
    }
  }

  // Cargar favoritos desde la base de datos
  private async loadFavoritesFromDatabase(): Promise<void> {
    try {
      // Obtener el usuario actual de forma asíncrona
      const user = await this.authService.getCurrentUser();
      
      if (!user || !user.id) {
        console.error('loadFavoritesFromDatabase: Usuario no disponible');
        this.favorites.next([]);
        return;
      }

      console.log('loadFavoritesFromDatabase: Cargando favoritos para usuario', user.id);

      const { data, error } = await this.supabaseService.getClient()
        .from('favorites')
        .select('store_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading favorites from database:', error);
        // Falló la carga desde la base de datos, intentar desde localStorage
        const storedFavorites = localStorage.getItem(this.LOCAL_STORAGE_KEY);
        if (storedFavorites) {
          try {
            const parsedFavorites = JSON.parse(storedFavorites);
            this.favorites.next(Array.isArray(parsedFavorites) ? parsedFavorites : []);
            console.log('loadFavoritesFromDatabase: Cargados desde localStorage por error:', parsedFavorites);
          } catch (e) {
            console.error('Error parsing favorites from localStorage:', e);
            this.favorites.next([]);
          }
        }
        return;
      }

      if (!data) {
        console.error('loadFavoritesFromDatabase: No se recibieron datos de la consulta');
        this.favorites.next([]);
        return;
      }

      const favoriteIds = data.map(item => item.store_id);
      console.log('loadFavoritesFromDatabase: Favoritos cargados desde Supabase:', favoriteIds);
      
      this.favorites.next(favoriteIds);
      
      // Actualizar localStorage
      this.saveFavorites(favoriteIds);
    } catch (error) {
      console.error('Error getting favorites:', error);
      this.favorites.next([]);
    }
  }

  // Sincronizar cambios con la base de datos
  private async syncWithDatabase(storeId: string, isAdd: boolean, retryCount = 0): Promise<void> {
    // Implementación compatible con RLS de Supabase
    try {
      // Obtener el usuario actual de forma asíncrona
      const user = await this.authService.getCurrentUser();
      if (!user || !user.id) {
        console.error('[Favoritos] Error: Usuario no autenticado');
        this.notificationService.show({
          message: 'Debes iniciar sesión para sincronizar favoritos',
          type: 'warning',
          duration: 3000
        });
        return;
      }

      console.log(`[Favoritos] Sincronizando: ${isAdd ? 'añadir' : 'eliminar'} tienda ${storeId} para usuario ${user.id}`);

      // Obtener cliente directamente
      const supabase = this.supabaseService.getClient();
      
      // Verificar si el usuario existe en la tabla de profiles
      const { data: profileExists, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
        
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('[Favoritos] Error al verificar el perfil del usuario:', profileError);
        this.notificationService.show({
          message: 'Error al verificar tu perfil de usuario',
          type: 'error',
          duration: 3000
        });
        return;
      }
      
      // Si el perfil no existe, intentar crearlo primero
      if (!profileExists) {
        console.log('[Favoritos] Perfil de usuario no encontrado, creando uno nuevo');
        try {
          // Simplificar los datos para el perfil, incluyendo solo los campos requeridos
          const { error: insertProfileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              full_name: user.fullName || '',
              updated_at: new Date().toISOString()
            });
            
          if (insertProfileError) {
            console.error('[Favoritos] Error al crear perfil de usuario:', insertProfileError);
            
            // Si el error es porque el perfil ya existe (clave primaria duplicada), podemos continuar
            if (insertProfileError.code === '23505') {
              console.log('[Favoritos] El perfil ya existe, continuando con la operación');
            } else {
              this.notificationService.show({
                message: `Error al crear tu perfil de usuario: ${insertProfileError.message}`,
                type: 'error',
                duration: 3000
              });
              return;
            }
          }
        } catch (e) {
          console.error('[Favoritos] Error al crear perfil:', e);
          return;
        }
      }
      
      if (isAdd) {
        // Intento simple y directo de inserción - importante usar user_id exactamente como se especifica en RLS
        const { error } = await supabase
          .from('favorites')
          .insert({
            // Importante: La política RLS comprueba auth.uid() = user_id, así que user_id debe ser el ID de auth
            user_id: user.id, // ID del usuario autenticado actual
            store_id: storeId,
            created_at: new Date().toISOString()
          });

        if (error) {
          // Mostrar detalles completos del error para depuración
          console.error('[Favoritos] Error detallado al añadir favorito:', {
            code: error.code,
            details: error.details,
            hint: error.hint,
            message: error.message
          });
          
          // Gestionar errores específicos
          if (error.code === '23505') { // Código de violación de restricción única
            console.log('[Favoritos] Este favorito ya existe en la BD. Ignorando error.');
            // No es un error real, ya existe
          } else if (error.code === '42501') { // Error de permiso denegado
            console.error('[Favoritos] Error de permisos RLS. Verificar políticas RLS.');
            this.notificationService.show({
              message: 'Error de permisos: No tienes permisos para añadir favoritos',
              type: 'error',
              duration: 5000
            });
          } else {
            this.notificationService.show({
              message: `Error al guardar favorito: ${error.message}`,
              type: 'error',
              duration: 3000
            });
            
            // Reintentar
            if (retryCount < 2) {
              setTimeout(() => {
                this.syncWithDatabase(storeId, isAdd, retryCount + 1);
              }, 1000);
            }
          }
        } else {
          console.log('[Favoritos] Favorito añadido correctamente');
        }
      } else {
        // Eliminación siguiendo RLS - importante especificar user_id para que RLS permita la operación
        const { error } = await supabase
          .from('favorites')
          .delete()
          .match({ 
            user_id: user.id, // Esto es crítico para que RLS permita la eliminación
            store_id: storeId 
          });

        if (error) {
          console.error('[Favoritos] Error detallado al eliminar favorito:', {
            code: error.code,
            details: error.details,
            hint: error.hint,
            message: error.message
          });
          
          if (error.code === '42501') { // Error de permiso denegado
            this.notificationService.show({
              message: 'Error de permisos: No tienes permisos para eliminar favoritos',
              type: 'error',
              duration: 5000
            });
          } else {
            this.notificationService.show({
              message: `Error al eliminar favorito: ${error.message}`,
              type: 'error',
              duration: 3000
            });
            
            // Reintentar
            if (retryCount < 2) {
              setTimeout(() => {
                this.syncWithDatabase(storeId, isAdd, retryCount + 1);
              }, 1000);
            }
          }
        } else {
          console.log('[Favoritos] Favorito eliminado correctamente');
        }
      }
    } catch (error: any) {
      console.error('[Favoritos] Error general:', error);
      this.notificationService.show({
        message: 'Error de conexión con el servidor',
        type: 'error',
        duration: 3000
      });
      
      // Reintentar por última vez
      if (retryCount < 2) {
        setTimeout(() => {
          this.syncWithDatabase(storeId, isAdd, retryCount + 1);
        }, 1000);
      }
    }
  }

  // Método para refrescar la lista de favoritos desde la base de datos
  public async refreshFavorites(): Promise<void> {
    console.log('[Favoritos] Refrescando favoritos');
    if (this.isAuthenticated) {
      // Primero cargar desde la base de datos
      await this.loadFavoritesFromDatabase();
      
      // Luego hacer una sincronización completa para asegurar consistencia
      await this.forceFullSync();
    } else {
      console.warn('[Favoritos] No se pueden refrescar favoritos: usuario no autenticado');
    }
  }

  // Método para forzar la sincronización completa en ambas direcciones
  public async forceFullSync(): Promise<void> {
    console.log('[Favoritos] Intentando sincronización completa');
    
    if (!this.isAuthenticated) {
      console.warn('[Favoritos] No se puede sincronizar: usuario no autenticado');
      return;
    }
    
    try {
      const user = await this.authService.getCurrentUser();
      if (!user || !user.id) {
        console.error('[Favoritos] No se pudo obtener el usuario para la sincronización');
        return;
      }
      
      // Obtener favoritos actuales de la base de datos
      const { data, error } = await this.supabaseService.getClient()
        .from('favorites')
        .select('store_id')
        .eq('user_id', user.id);
        
      if (error) {
        console.error('[Favoritos] Error al obtener favoritos:', error);
        this.notificationService.show({
          message: 'Error al sincronizar favoritos: ' + error.message,
          type: 'error',
          duration: 3000
        });
        return;
      }
      
      if (!data) {
        console.log('[Favoritos] No se encontraron datos');
        return;
      }
      
      // Convertir a array de ids
      const dbFavoriteIds = data.map(item => item.store_id);
      console.log('[Favoritos] Favoritos en base de datos:', dbFavoriteIds);
      
      // Actualizar el estado local con los datos de la base de datos
      this.favorites.next(dbFavoriteIds);
      this.saveFavorites(dbFavoriteIds);
      
      console.log('[Favoritos] Sincronización completa finalizada - Favoritos actualizados');
    } catch (error) {
      console.error('[Favoritos] Error en la sincronización completa:', error);
      this.notificationService.show({
        message: 'Error al sincronizar favoritos',
        type: 'error',
        duration: 3000
      });
    }
  }

  // Método para diagnosticar problemas de conexión y permisos
  public async diagnosticTest(): Promise<void> {
    console.log('[Favoritos] Iniciando diagnóstico de conexión');
    
    try {
      // 1. Verificar si tenemos cliente de Supabase
      const supabase = this.supabaseService.getClient();
      console.log('[Diagnóstico] Cliente Supabase obtenido:', !!supabase);
      
      // 2. Verificar autenticación
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('[Diagnóstico] Sesión:', sessionData?.session ? 'Activa' : 'No activa');
      if (sessionError) {
        console.error('[Diagnóstico] Error de sesión:', sessionError);
      }
      
      const user = sessionData?.session?.user;
      console.log('[Diagnóstico] Usuario:', user ? `ID: ${user.id}` : 'No autenticado');
      
      if (!user) {
        this.notificationService.show({
          message: 'Diagnóstico: No hay sesión activa. Inicia sesión primero.',
          type: 'warning',
          duration: 5000
        });
        return;
      }
      
      // Verificar roles y permisos del usuario
      console.log('[Diagnóstico] Verificando permisos del usuario...');
      console.log('[Diagnóstico] Roles del usuario:', user.app_metadata?.['role'] || 'No especificado');
      
      // Verificar que el usuario existe en la tabla profiles
      console.log('[Diagnóstico] Verificando existencia del usuario en tabla profiles...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profileError) {
        console.error('[Diagnóstico] Error al verificar perfil:', profileError);
        if (profileError.code === 'PGRST116') {
          console.error('[Diagnóstico] El usuario no existe en la tabla profiles. Este es probablemente el origen del error de foreign key.');
          
          // Intentar crear el perfil
          this.notificationService.show({
            message: 'El usuario no existe en la tabla profiles. Intentando crear...',
            type: 'warning',
            duration: 3000
          });
          
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              full_name: user.user_metadata?.['full_name'] || '',
              updated_at: new Date().toISOString()
            });
            
          if (createError) {
            console.error('[Diagnóstico] Error al crear perfil:', createError);
            
            // Si el error es porque el perfil ya existe (clave primaria duplicada), es un éxito
            if (createError.code === '23505') {
              console.log('[Diagnóstico] El perfil ya existe, verificación completada');
              this.notificationService.show({
                message: 'El perfil ya existe, verificación completada',
                type: 'success',
                duration: 3000
              });
            } else {
              this.notificationService.show({
                message: `Error al crear perfil: ${createError.message}`,
                type: 'error',
                duration: 5000
              });
              
              // Intentar usar una versión más simple sin campos opcionales
              console.log('[Diagnóstico] Intentando con esquema mínimo...');
              const { error: minimalError } = await supabase
                .from('profiles')
                .insert({
                  id: user.id
                });
                
              if (minimalError) {
                console.error('[Diagnóstico] Error con esquema mínimo:', minimalError);
              } else {
                console.log('[Diagnóstico] Perfil creado con esquema mínimo');
                this.notificationService.show({
                  message: 'Perfil creado con esquema mínimo',
                  type: 'success',
                  duration: 3000
                });
              }
            }
          } else {
            console.log('[Diagnóstico] Perfil creado exitosamente');
            this.notificationService.show({
              message: 'Perfil creado exitosamente',
              type: 'success',
              duration: 3000
            });
          }
        }
      } else {
        console.log('[Diagnóstico] Usuario encontrado en tabla profiles:', profileData);
      }
      
      // Verificar tabla de favoritos y su estructura
      console.log('[Diagnóstico] Verificando tabla favorites...');
      const { data: favoritesInfo, error: favoritesError } = await supabase
        .from('favorites')
        .select('*')
        .limit(1);
        
      if (favoritesError) {
        console.error('[Diagnóstico] Error al acceder a la tabla favorites:', favoritesError);
        
        if (favoritesError.code === '42501') {
          console.error('[Diagnóstico] Error de permisos RLS. Verifica que existan estas políticas en Supabase:');
          console.error('1. Política para SELECT: (auth.uid() = user_id)');
          console.error('2. Política para INSERT: (auth.uid() = user_id)');
          console.error('3. Política para DELETE: (auth.uid() = user_id)');
        }
      } else {
        console.log('[Diagnóstico] Estructura de tabla favorites accesible');
      }
      
      // 3. Intentar una lectura simple de la tabla 'favorites' - verifica permisos SELECT
      console.log('[Diagnóstico] Probando permisos SELECT en tabla de favoritos...');
      const { data: selectData, error: selectError } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);
      
      if (selectError) {
        console.error('[Diagnóstico] Error en SELECT:', selectError);
        this.notificationService.show({
          message: `Error de permisos SELECT: ${selectError.message}`,
          type: 'error',
          duration: 5000
        });
        if (selectError.code === '42501') {
          console.error('[Diagnóstico] Error de permisos RLS en SELECT. Verifica la política "Users can view their own favorites"');
        }
      } else {
        console.log('[Diagnóstico] Permisos SELECT correctos. Datos:', selectData);
      }
      
      // 4. Intentar inserción y eliminación de prueba
      try {
        const testId = 'test-' + new Date().getTime();
        console.log('[Diagnóstico] Probando permisos INSERT con ID:', testId);
        
        // Insertar registro de prueba - verifica permisos INSERT
        const { data: insertData, error: insertError } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            store_id: testId,
            created_at: new Date().toISOString()
          })
          .select();
        
        if (insertError) {
          console.error('[Diagnóstico] Error en INSERT:', insertError);
          this.notificationService.show({
            message: `Error de permisos INSERT: ${insertError.message}`,
            type: 'error',
            duration: 5000
          });
          if (insertError.code === '42501') {
            console.error('[Diagnóstico] Error de permisos RLS en INSERT. Verifica la política "Users can insert their own favorites"');
          }
        } else {
          console.log('[Diagnóstico] Permisos INSERT correctos. Datos insertados:', insertData);
          
          // Intentar actualizar el registro - verifica permisos UPDATE
          const { error: updateError } = await supabase
            .from('favorites')
            .update({ created_at: new Date().toISOString() })
            .match({ user_id: user.id, store_id: testId });
          
          if (updateError) {
            console.error('[Diagnóstico] Error en UPDATE:', updateError);
            if (updateError.code === '42501') {
              console.error('[Diagnóstico] Error de permisos RLS en UPDATE. Verifica la política "Users can update their own favorites"');
            }
          } else {
            console.log('[Diagnóstico] Permisos UPDATE correctos');
          }
          
          // Eliminar el registro de prueba - verifica permisos DELETE
          const { error: deleteError } = await supabase
            .from('favorites')
            .delete()
            .match({ user_id: user.id, store_id: testId });
          
          if (deleteError) {
            console.error('[Diagnóstico] Error en DELETE:', deleteError);
            this.notificationService.show({
              message: `Error de permisos DELETE: ${deleteError.message}`,
              type: 'error',
              duration: 5000
            });
            if (deleteError.code === '42501') {
              console.error('[Diagnóstico] Error de permisos RLS en DELETE. Verifica la política "Users can delete their own favorites"');
            }
          } else {
            console.log('[Diagnóstico] Permisos DELETE correctos');
            this.notificationService.show({
              message: 'Todos los permisos RLS están correctos',
              type: 'success',
              duration: 3000
            });
          }
        }
      } catch (testError) {
        console.error('[Diagnóstico] Error en prueba:', testError);
      }
      
    } catch (error: any) {
      console.error('[Diagnóstico] Error general:', error);
      this.notificationService.show({
        message: `Error de diagnóstico: ${error?.message || 'Desconocido'}`,
        type: 'error',
        duration: 5000
      });
    }
  }
} 