import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private bucketName = 'fotostiendas';

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.key
    );
  }

  // Método para obtener el cliente de Supabase
  getClient(): SupabaseClient {
    return this.supabase;
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
}