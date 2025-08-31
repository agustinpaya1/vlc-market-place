import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject, from, Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { environment } from '../../environments/environment';

interface MemoryStorage {
  _storage: Map<string, string>;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabaseInstance: SupabaseClient | null = null;
  private initSubject = new BehaviorSubject<boolean>(false);
  private initObservable$ = this.initSubject.asObservable();
  private bucketName = 'profile-photos';
  private memoryStorage: MemoryStorage = {
    _storage: new Map<string, string>(),
    getItem: (key: string) => {
      return this.memoryStorage._storage.get(key) || null;
    },
    setItem: (key: string, value: string) => {
      this.memoryStorage._storage.set(key, value);
    },
    removeItem: (key: string) => {
      this.memoryStorage._storage.delete(key);
    },
    clear: () => {
      this.memoryStorage._storage.clear();
    }
  };

  constructor() {
    this.initializeSupabase();
  }

  private initializeSupabase() {
    // Prevent multiple initializations
    if (this.supabaseInstance) {
      this.initSubject.next(true);
      return;
    }

    try {
      // Restauramos la configuración original para que funcione correctamente la autenticación
      this.supabaseInstance = createClient(
        environment.supabase.url, 
        environment.supabase.key, 
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            storage: localStorage
          },
          global: {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        }
      );

      // Ensure client is ready
      this.initSubject.next(true);
      console.log('Supabase client initialized successfully with localStorage');
    } catch (error) {
      console.error('Error initializing Supabase client:', error);
      this.initSubject.error(error);
    }
  }

  // Ensure client is initialized before use
  private async ensureClient(): Promise<SupabaseClient> {
    if (!this.supabaseInstance) {
      await new Promise<void>((resolve, reject) => {
        const subscription = this.initObservable$.subscribe({
          next: (initialized) => {
            if (initialized) {
              subscription.unsubscribe();
              resolve();
            }
          },
          error: (error) => {
            subscription.unsubscribe();
            reject(error);
          }
        });
      });
    }

    if (!this.supabaseInstance) {
      throw new Error('Supabase client failed to initialize');
    }

    return this.supabaseInstance;
  }

  // Get client with initialization check
  getClient(): SupabaseClient {
    if (!this.supabaseInstance) {
      this.initializeSupabase();
    }
    return this.supabaseInstance!;
  }

  // Envolver operaciones Supabase en Observables para mejor manejo de errores
  wrapSupabaseOperation<T>(operation: Promise<any>): Observable<T> {
    return from(operation).pipe(
      retry(2), // Reintentar la operación hasta 2 veces
      catchError(error => {
        console.error('Supabase operation error:', error);
        return throwError(() => new Error(`Error en operación Supabase: ${error.message || error}`));
      })
    );
  }

  // Ejemplo de método para obtener datos de una tabla
  async getData(table: string) {
    const { data, error } = await this.getClient()
      .from(table)
      .select('*');
    
    if (error) throw error;
    return data;
  }

  // Ejemplo de método para insertar datos
  async insertData(table: string, data: any) {
    const { data: result, error } = await this.getClient()
      .from(table)
      .insert(data)
      .select();
    
    if (error) throw error;
    return result;
  }

  // Método interno: resolver bucket y path a partir de una ruta almacenada
  private resolveBucketAndPath(
    inputPath: string,
    fallbackBucket: string
  ): { bucket: string; path: string } | null {
    if (!inputPath) return null;

    // 1) Rutas absolutas o assets locales: devolver null para que se use tal cual
    if (
      inputPath.startsWith('http://') ||
      inputPath.startsWith('https://') ||
      inputPath.startsWith('assets/') ||
      inputPath.includes('/storage/v1/object/public/')
    ) {
      return null;
    }

    // 2) Si viene como "bucket/relative/path.jpg" -> dividir por primera '/'
    const firstSlash = inputPath.indexOf('/');
    if (firstSlash > 0) {
      const maybeBucket = inputPath.substring(0, firstSlash);
      const restPath = inputPath.substring(firstSlash + 1);
      // buckets conocidos
      const knownBuckets = new Set([
        'profile-photos',
        'productos',
        'fotostiendas',
        'stores',
        'public'
      ]);
      if (knownBuckets.has(maybeBucket)) {
        return { bucket: maybeBucket, path: restPath };
      }
    }

    // 3) Si solo viene un path relativo, usar bucket por defecto del tipo
    return { bucket: fallbackBucket, path: inputPath };
  }

  // Obtener URL pública de imagen según tipo
  private getPublicUrlFor(
    path: string | null,
    type: 'profile' | 'store' | 'product'
  ): string {
    if (!path) {
      return type === 'profile'
        ? this.getDefaultProfileImageUrl()
        : 'assets/store-placeholder.jpg';
    }

    // Si ya es URL absoluta o asset local, devolver tal cual
    if (
      path.startsWith('http://') ||
      path.startsWith('https://') ||
      path.startsWith('assets/') ||
      path.includes('/storage/v1/object/public/')
    ) {
      return path;
    }

    const fallbackBucket =
      type === 'profile' ? 'profile-photos' : type === 'store' ? 'fotostiendas' : 'productos';

    const resolved = this.resolveBucketAndPath(path, fallbackBucket);
    if (!resolved) return path; // ya gestionado arriba

    try {
      const { data } = this.getClient().storage.from(resolved.bucket).getPublicUrl(resolved.path);
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting public URL:', error);
      return type === 'profile' ? this.getDefaultProfileImageUrl() : 'assets/store-placeholder.jpg';
    }
  }

  // Add a method for default profile image
  private getDefaultProfileImageUrl(): string {
    return 'assets/default-profile.svg'; // Use a default SVG profile placeholder
  }

  // Método específico para obtener tiendas
  async getStores() {
    try {
      const { data: stores, error } = await this.getClient()
        .from('stores')
        .select('*');
      
      if (error) throw error;

      console.log('Datos de tiendas recibidos:', stores);
      
      const mappedStores = stores.map(store => {
        const imageUrl = this.getPublicUrlFor(store.image_url, 'store');
        console.log(`Tienda ${store.name}:`, {
          nombre: store.name,
          imagen_original: store.image_url,
          imagen_url: imageUrl
        });
        
        return {
          ...store,
          location: store.location_text || 'Valencia',
          imageUrl
        };
      });

      return mappedStores;
    } catch (error) {
      console.error('Error al obtener tiendas:', error);
      throw error;
    }
  }

  // Método para obtener productos de una tienda específica
  async getStoreProducts(storeId: string) {
    try {
      const { data, error } = await this.getClient()
        .from('products')
        .select('*')
        .eq('store_id', storeId);
      
      if (error) throw error;
      
      return data.map(product => {
        const imageUrl = this.getPublicUrlFor(product.image_url, 'product');
        // Si tiene discount y price, calcular offerPrice
        let offerPrice = product.offerPrice;
        let isOffer = product.isOffer;
        if (product.discount && product.price) {
          offerPrice = +(product.price * (1 - product.discount / 100)).toFixed(2);
          isOffer = true;
        }
        return {
          ...product,
          imageUrl,
          offerPrice,
          isOffer
        };
      });
    } catch (error) {
      console.error('Error al obtener productos:', error);
      throw error;
    }
  }

  // Método para obtener detalles de una tienda específica
  async getStoreById(storeId: string) {
    try {
      const { data, error } = await this.getClient()
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        const imageUrl = this.getPublicUrlFor(data.image_url, 'store');
        console.log(`Tienda ${data.name}:`, {
          nombre: data.name,
          imagen_original: data.image_url,
          imagen_url: imageUrl
        });
        
        return {
          ...data,
          location: data.location_text || 'Valencia',
          imageUrl
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error al obtener tienda:', error);
      throw error;
    }
  }

  // Método público para obtener la URL pública de una imagen
  public getPublicImageUrl(path: string): string {
    if (!path) return '';
    try {
      return this.getClient()
        .storage
        .from(this.bucketName)
        .getPublicUrl(path).data.publicUrl;
    } catch (error) {
      console.error('Error al obtener la URL pública de la imagen:', error);
      return '';
    }
  }

  // ====== Edge Functions wrappers ======
  async signQr(orderId: string): Promise<{ jws: string; payload?: any }> {
    const supabase = this.getClient();
    const { data, error } = await supabase.functions.invoke('sign_qr', {
      body: { order_id: orderId }
    });
    if (error) throw error;
    return data as { jws: string; payload?: any };
  }

  async getStorePublicKeys(storeId: string): Promise<Array<{
    id: string; // kid
    store_id: string;
    public_key: string;
    status: 'active' | 'retired' | 'revoked';
    not_before: string;
    not_after: string | null;
  }>> {
    const supabase = this.getClient();
    const { data, error } = await supabase.functions.invoke('get_store_public_keys', {
      body: { store_id: storeId }
    });
    if (error) throw error;
    return (data?.keys ?? []) as any[];
  }

  async redeemOrder(jws: string): Promise<{ success: boolean; reason?: string }> {
    const { data, error } = await this.getClient().functions.invoke('redeem_order', {
      body: { jws }
    });
    if (error) throw error;
    return data as any;
  }

  async redeemOrderOffline(jws: string, claim: any): Promise<{ success: boolean; reason?: string }> {
    const { data, error } = await this.getClient().functions.invoke('redeem_order_offline', {
      body: { jws, claim }
    });
    if (error) throw error;
    return data as any;
  }

  // Método para subir un archivo al bucket
  async uploadFile(file: File, path: string): Promise<string> {
    try {
      const { data, error } = await this.getClient()
        .storage
        .from(this.bucketName)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Error al subir el archivo:', error);
        throw error;
      }

      // Retornar la URL pública del archivo subido
      return this.getPublicImageUrl(data.path);
    } catch (error) {
      console.error('Error en uploadFile:', error);
      throw error;
    }
  }

  // Método para subir una imagen en formato base64
  async uploadBase64Image(base64String: string, path: string): Promise<string> {
    try {
      // Convertir base64 a blob
      const base64Response = await fetch(base64String);
      const blob = await base64Response.blob();
      
      // Crear un objeto File
      const file = new File([blob], 'filename.png', { type: 'image/png' });
      
      // Subir el archivo
      return await this.uploadFile(file, path);
    } catch (error) {
      console.error('Error al subir imagen base64:', error);
      throw error;
    }
  }

  // Método para obtener todos los productos con su stock y tienda asociada
  async getAllProductsWithStockAndStore() {
    try {
      const { data: products, error } = await this.getClient()
        .from('products')
        .select('id, name, stock, store_id, price, category')
        .gt('stock', 0);
      if (error) throw error;
      // Obtener tiendas para asociar nombre
      const { data: stores, error: storeError } = await this.getClient()
        .from('stores')
        .select('id, name');
      if (storeError) throw storeError;
      const storeMap = Object.fromEntries((stores || []).map(s => [s.id, s.name]));
      return (products || []).map(p => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        price: p.price,
        store: storeMap[p.store_id] || p.store_id,
        category: p.category || ''
      }));
    } catch (error) {
      console.error('Error al obtener productos con stock y tienda:', error);
      return [];
    }
  }

  // Obtiene todas las categorías de todas las tiendas agrupadas por store_id
  async getAllStoreCategories() {
    try {
      const { data, error } = await this.getClient()
        .from('store_categorie')
        .select('store_id, category');
      if (error) throw error;
      // Agrupar por store_id
      const categoriesByStore: { [key: string]: string[] } = {};
      (data || []).forEach(row => {
        if (!categoriesByStore[row.store_id]) {
          categoriesByStore[row.store_id] = [];
        }
        categoriesByStore[row.store_id].push(row.category);
      });
      return categoriesByStore;
    } catch (error) {
      console.error('Error al obtener categorías de tiendas:', error);
      return {};
    }
  }

  async uploadProfilePhoto(file: File, userId: string): Promise<string> {
    if (!file) {
      throw new Error('No file provided');
    }

    console.log('Uploading profile photo:', {
      userId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${userId}-${this.uuidv4()}.${fileExt}`;
    const filePath = `profile-photos/${fileName}`;

    try {
      // Validate file size and type
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('El archivo es demasiado grande. Máximo 5MB.');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de archivo no permitido. Solo se aceptan JPEG, PNG y GIF.');
      }

      const supabase = this.getClient();

      // Attempt to upload directly
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading profile photo:', uploadError);
        throw uploadError;
      }

      // Construct public URL manually to ensure consistency
      const publicUrl = `${environment.supabase.url}/storage/v1/object/public/profile-photos/${filePath}`;

      console.log('Constructed Public URL:', publicUrl);

      // Validate public URL
      const response = await fetch(publicUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.error('Failed to access uploaded image:', response.status);
        throw new Error('No se pudo acceder a la imagen subida');
      }

      // Update user profile with new photo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          photo_url: publicUrl,
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile with photo URL:', updateError);
      }

      return publicUrl;
    } catch (error) {
      console.error('Comprehensive error in uploadProfilePhoto:', error);
      throw error;
    }
  }

  // Utility method to generate UUID if not already available
  private uuidv4(): string {
    return uuidv4();
  }

  async updateUserProfile(userId: string, updates: { avatar_url?: string, name?: string }): Promise<void> {
    const { error } = await this.getClient()
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // FAVORITES: Añadir a favoritos (producto o tienda)
  async addFavorite(userId: string, id: string, type: 'product' | 'store') {
    const insertObj: any = { user_id: userId };
    if (type === 'product') insertObj.product_id = id;
    if (type === 'store') insertObj.store_id = id;
    const { data, error } = await this.getClient()
      .from('favorites')
      .insert(insertObj);
    if (error) throw error;
    return data;
  }

  // FAVORITES: Quitar de favoritos (producto o tienda)
  async removeFavorite(userId: string, id: string, type: 'product' | 'store') {
    let query = this.getClient().from('favorites').delete().eq('user_id', userId);
    if (type === 'product') query = query.eq('product_id', id);
    if (type === 'store') query = query.eq('store_id', id);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // FAVORITES: Obtener favoritos del usuario (productos o tiendas)
  async getFavorites(userId: string, type: 'product' | 'store') {
    let selectField = type === 'product' ? 'product_id' : 'store_id';
    const { data, error } = await this.getClient()
      .from('favorites')
      .select(selectField)
      .eq('user_id', userId)
      .not(selectField, 'is', null);
    if (error) throw error;
    return data;
  }
}