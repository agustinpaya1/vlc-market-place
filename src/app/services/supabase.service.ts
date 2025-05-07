import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { from, Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase!: SupabaseClient;
  private bucketName = 'fotostiendas';
  private initAttempted = false;

  constructor() {
    this.initClient();
  }

  private initClient() {
    try {
      this.supabase = createClient(
        environment.supabase.url,
        environment.supabase.key,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true
          },
          global: {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        }
      );
      this.initAttempted = true;
      console.log('Supabase client initialized successfully');
    } catch (error) {
      console.error('Error initializing Supabase client:', error);
    }
  }

  // Método para obtener el cliente de Supabase con reintentos
  getClient(): SupabaseClient {
    if (!this.initAttempted) {
      this.initClient();
    }
    return this.supabase;
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
    const { data, error } = await this.supabase
      .from(table)
      .select('*');
    
    if (error) throw error;
    return data;
  }

  // Ejemplo de método para insertar datos
  async insertData(table: string, data: any) {
    const { data: result, error } = await this.supabase
      .from(table)
      .insert(data)
      .select();
    
    if (error) throw error;
    return result;
  }

  // Método para obtener la URL pública de una imagen del bucket
  private getPublicUrl(path: string | null): string {
    if (!path) {
      return this.getDefaultImageUrl();
    }

    try {
      // Construir la URL usando el endpoint público de Supabase Storage
      const { data } = this.supabase
        .storage
        .from(this.bucketName)
        .getPublicUrl(path);

      console.log('URL generada para', path, ':', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('Error al obtener URL pública:', error);
      return this.getDefaultImageUrl();
    }
  }

  // Método para obtener la URL de la imagen por defecto
  private getDefaultImageUrl(): string {
    try {
      const { data } = this.supabase
        .storage
        .from(this.bucketName)
        .getPublicUrl('default-store.jpg');

      return data.publicUrl;
    } catch (error) {
      console.error('Error al obtener URL de imagen por defecto:', error);
      return ''; // Retornar string vacío si todo falla
    }
  }

  // Método específico para obtener tiendas
  async getStores() {
    try {
      const { data: stores, error } = await this.supabase
        .from('stores')
        .select('*');
      
      if (error) throw error;

      console.log('Datos de tiendas recibidos:', stores);
      
      const mappedStores = stores.map(store => {
        const imageUrl = this.getPublicUrl(store.image_url);
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
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId);
      
      if (error) throw error;
      
      return data.map(product => ({
        ...product,
        imageUrl: this.getPublicUrl(product.image_url)
      }));
    } catch (error) {
      console.error('Error al obtener productos:', error);
      throw error;
    }
  }

  // Método para obtener detalles de una tienda específica
  async getStoreById(storeId: string) {
    try {
      const { data, error } = await this.supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        const imageUrl = this.getPublicUrl(data.image_url);
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
      return this.supabase
        .storage
        .from(this.bucketName)
        .getPublicUrl(path).data.publicUrl;
    } catch (error) {
      console.error('Error al obtener la URL pública de la imagen:', error);
      return '';
    }
  }

  // Método para subir un archivo al bucket
  async uploadFile(file: File, path: string): Promise<string> {
    try {
      const { data, error } = await this.supabase
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
}