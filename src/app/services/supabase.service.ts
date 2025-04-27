import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { retry } from 'rxjs/operators';
import { from, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase!: SupabaseClient;
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

  // Método específico para obtener tiendas
  async getStores() {
    const { data, error } = await this.supabase
      .from('stores')
      .select('*');
    
    if (error) throw error;
    console.log('Datos de tiendas recibidos de Supabase:', data);
    // Mapear location_text a location para compatibilidad con la aplicación
    return data.map(store => ({
      ...store,
      location: store.location_text || 'Valencia'
    }));
  }

  // Método para obtener productos de una tienda específica
  async getStoreProducts(storeId: string) {
    console.log('Buscando productos para la tienda ID:', storeId);
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId);
    
    if (error) {
      console.error('Error al obtener productos:', error);
      throw error;
    }
    console.log('Productos encontrados:', data);
    return data;
  }

  // Método para obtener detalles de una tienda específica
  async getStoreById(storeId: string) {
    console.log('Buscando tienda con ID:', storeId);
    const { data, error } = await this.supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();
    
    if (error) {
      console.error('Error al obtener tienda:', error);
      throw error;
    }
    console.log('Tienda encontrada:', data);
    
    // Mapear location_text a location para compatibilidad con la aplicación
    if (data) {
      return {
        ...data,
        location: data.location_text || 'Valencia'
      };
    }
    
    return data;
  }
}