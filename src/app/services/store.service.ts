import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

export interface Store {
  id: string;
  owner_id: string;
  name: string | null;
  description: string | null;
  created_at: string;
  image_url: string | null;
  open_time: string | null;
  category: string | null;
  has_offers: boolean;
  rating: number;
  location_text: string | null;
  location: any | null; // geometry type
  latitude: number | null;
  longitude: number | null;
  coordinates: any | null; // geometry type
}

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private storeCache: Map<string, Store> = new Map();
  private supabase: SupabaseClient;

  constructor(private supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  async getStores(): Promise<Store[]> {
    try {
      const { data: stores, error } = await this.supabase
        .from('stores')
        .select('*');

      if (error) throw error;

      stores.forEach((store: Store) => this.storeCache.set(store.id, store));
      return stores;
    } catch (error) {
      console.error('Error al obtener las tiendas:', error);
      throw error;
    }
  }

  async getStoreById(id: string): Promise<Store | null> {
    try {
      if (this.storeCache.has(id)) {
        return this.storeCache.get(id)!;
      }

      const { data: store, error } = await this.supabase
        .from('stores')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (store) {
        this.storeCache.set(store.id, store);
      }

      return store;
    } catch (error) {
      console.error('Error al obtener la tienda:', error);
      throw error;
    }
  }

  async getUserStores(userId: string): Promise<Store[]> {
    try {
      console.log('StoreService - Getting stores for user:', userId);
      const { data: stores, error } = await this.supabase
        .from('stores')
        .select('*')
        .eq('owner_id', userId);

      if (error) {
        console.error('StoreService - Error getting user stores:', error);
        throw error;
      }

      if (!stores || stores.length === 0) {
        console.log('StoreService - No stores found for user');
        return [];
      }

      console.log('StoreService - Found stores:', stores);
      stores.forEach((store: Store) => this.storeCache.set(store.id, store));
      return stores;
    } catch (error) {
      console.error('StoreService - Error getting user stores:', error);
      throw error;
    }
  }

  async createStore(store: Partial<Store>): Promise<Store> {
    try {
      console.log('StoreService - Creating store:', store);
      
      // Ensure default values match the database schema
      const storeData = {
        ...store,
        has_offers: store.has_offers ?? false,
        rating: store.rating ?? 4.5,
        created_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('stores')
        .insert([storeData])
        .select()
        .single();

      if (error) {
        console.error('StoreService - Error creating store:', error);
        throw error;
      }

      console.log('StoreService - Store created successfully:', data);
      this.storeCache.set(data.id, data);
      return data;
    } catch (error) {
      console.error('StoreService - Error creating store:', error);
      throw error;
    }
  }

  async updateStore(store: Partial<Store>): Promise<Store> {
    try {
      if (!store.id) throw new Error('Se requiere el ID de la tienda');

      const { data, error } = await this.supabase
        .from('stores')
        .update(store)
        .eq('id', store.id)
        .select()
        .single();

      if (error) throw error;

      this.storeCache.set(data.id, data);
      return data;
    } catch (error) {
      console.error('Error al actualizar la tienda:', error);
      throw error;
    }
  }

  async updateStoreStatus(storeId: string, isOpen: boolean): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('stores')
        .update({ is_open: isOpen })
        .eq('id', storeId);

      if (error) throw error;

      // Actualizar el caché si existe
      const cachedStore = this.storeCache.get(storeId);
      if (cachedStore) {
        this.storeCache.set(storeId, { ...cachedStore, is_open: isOpen });
      }
    } catch (error: any) {
      console.error('Error updating store status:', error);
      throw new Error('Error al actualizar el estado de la tienda: ' + (error.message || 'Error desconocido'));
    }
  }

  async deleteStore(storeId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('stores')
        .delete()
        .eq('id', storeId);

      if (error) throw error;

      this.storeCache.delete(storeId);
    } catch (error) {
      console.error('Error al eliminar la tienda:', error);
      throw error;
    }
  }

  async isUserStoreOwner(userId: string, storeId: string): Promise<boolean> {
    try {
      const store = await this.getStoreById(storeId);
      return store?.owner_id === userId;
    } catch (error) {
      console.error('Error al verificar el propietario de la tienda:', error);
      return false;
    }
  }

  async hasUserStores(userId: string): Promise<boolean> {
    try {
      const { data: stores, error } = await this.supabase
        .from('stores')
        .select('id')
        .eq('owner_id', userId);

      if (error) throw error;

      return stores && stores.length > 0;
    } catch (error) {
      console.error('Error al verificar si el usuario tiene tiendas:', error);
      return false;
    }
  }

  clearCache() {
    this.storeCache.clear();
  }

  /**
   * Obtiene múltiples tiendas por sus IDs (con caché)
   */
  async getStoresByIds(storeIds: string[]): Promise<Store[]> {
    if (!storeIds || storeIds.length === 0) return [];

    // Filtrar IDs que ya están en caché
    const cachedStores: Store[] = [];
    const uncachedIds: string[] = [];

    storeIds.forEach(id => {
      if (this.storeCache.has(id)) {
        const store = this.storeCache.get(id);
        if (store) cachedStores.push(store);
      } else {
        uncachedIds.push(id);
      }
    });

    // Si todos los IDs estaban en caché, retornar de inmediato
    if (uncachedIds.length === 0) {
      return cachedStores;
    }

    // Consultar la base de datos para los IDs que no están en caché
    try {
      const { data, error } = await this.supabase
        .from('stores')
        .select('*')
        .in('id', uncachedIds);

      if (error) {
        console.error('Error al obtener múltiples tiendas:', error);
        // Retornar al menos las tiendas que teníamos en caché
        return cachedStores;
      }

      // Procesar resultados y guardar en caché
      const fetchedStores: Store[] = [];
      if (data && data.length > 0) {
        data.forEach(storeData => {
          const store: Store = {
            ...storeData,
            name: storeData.name || 'Tienda'
          };
          this.storeCache.set(store.id, store);
          fetchedStores.push(store);
        });
      }

      // Crear tiendas "fake" para IDs que no se encontraron
      const fetchedIds = fetchedStores.map(s => s.id);
      const missingIds = uncachedIds.filter(id => !fetchedIds.includes(id));
      
      const defaultStores = missingIds.map(id => {
        const defaultStore = { id, name: 'Tienda' };
        this.storeCache.set(id, defaultStore);
        return defaultStore;
      });

      // Combinar tiendas de caché, las consultadas y las por defecto
      return [...cachedStores, ...fetchedStores, ...defaultStores];
    } catch (err) {
      console.error('Error inesperado al obtener tiendas:', err);
      return cachedStores;
    }
  }

  /**
   * Obtiene todas las tiendas disponibles
   */
  async getAllStores(): Promise<Store[]> {
    try {
      const { data, error } = await this.supabase
        .from('stores')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error al obtener todas las tiendas:', error);
        return [];
      }

      // Actualizar la caché
      if (data && data.length > 0) {
        data.forEach(store => {
          const storeData: Store = {
            ...store,
            name: store.name || 'Tienda'
          };
          this.storeCache.set(store.id, storeData);
        });
      }

      return data || [];
    } catch (err) {
      console.error('Error inesperado al obtener todas las tiendas:', err);
      return [];
    }
  }

  /**
   * Cargar los datos de la tienda principal al inicio
   */
  async preloadStores(): Promise<void> {
    try {
      const stores = await this.getAllStores();
      
      if (stores && stores.length > 0) {
        console.log(`Tiendas precargadas (${stores.length}):`);
        
        // Mostrar detalle de cada tienda
        stores.forEach(store => {
          console.log(`  - ID: ${store.id}, Nombre: ${store.name || 'SIN NOMBRE'}`);
        });
      } else {
        console.warn('No se encontraron tiendas para precargar');
      }
      
      console.log('Cache de tiendas:', this.storeCache.size);
    } catch (error) {
      console.error('Error al precargar tiendas:', error);
    }
  }

  /**
   * Método de diagnóstico para examinar tiendas existentes en Supabase
   */
  async diagnosticAllStores(): Promise<any> {
    try {
      console.log('Ejecutando diagnóstico completo de tiendas...');
      
      // Obtener todas las tiendas de la base de datos sin filtros
      const { data: allStores, error } = await this.supabase
        .from('stores')
        .select('*');
      
      if (error) {
        console.error('Error al consultar tiendas:', error);
        return { error };
      }
      
      // Vaciar la caché primero para forzar consultas nuevas
      this.clearCache();
      
      // Examinar cada tienda individualmente para ver si hay problemas
      const individualChecks = [];
      
      if (allStores && allStores.length > 0) {
        console.log(`Encontradas ${allStores.length} tiendas en la base de datos:`, 
          allStores.map(s => ({ id: s.id, name: s.name || 'SIN NOMBRE' })));
          
        for (const store of allStores) {
          try {
            // Intentar consultar esta tienda específica
            const { data, error } = await this.supabase
              .from('stores')
              .select('*')
              .eq('id', store.id)
              .single();
              
            individualChecks.push({
              id: store.id,
              name: store.name || 'SIN NOMBRE',
              nameInDb: data?.name || 'NO ENCONTRADO',
              error: error ? error.message : null,
              found: !!data
            });
          } catch (err: any) {
            console.error(`Error consultando tienda ${store.id}:`, err);
            individualChecks.push({
              id: store.id,
              name: store.name || 'SIN NOMBRE',
              error: err.message,
              found: false
            });
          }
        }
      } else {
        console.log('No se encontraron tiendas en la base de datos');
      }

      // Examinar ahora pedidos para ver qué store_ids tienen
      const { data: orders, error: ordersError } = await this.supabase
        .from('orders')
        .select('id, store_id');
        
      const orderStoreInfo = ordersError 
        ? { error: ordersError.message }
        : {
            count: orders?.length || 0,
            storeIds: orders?.map(o => o.store_id).filter(Boolean),
            uniqueStoreIds: [...new Set(orders?.map(o => o.store_id).filter(Boolean) || [])]
          };
          
      // Obtener items de pedidos para ver sus store_ids
      const { data: orderItems, error: itemsError } = await this.supabase
        .from('order_items')
        .select('order_id, store_id');
        
      const itemStoreInfo = itemsError
        ? { error: itemsError.message }
        : {
            count: orderItems?.length || 0,
            storeIds: orderItems?.map(i => i.store_id).filter(Boolean),
            uniqueStoreIds: [...new Set(orderItems?.map(i => i.store_id).filter(Boolean) || [])]
          };
      
      // Resultado completo
      return {
        allStores: allStores || [],
        storeCount: allStores?.length || 0,
        individualChecks,
        orderStoreInfo,
        itemStoreInfo
      };
    } catch (err: any) {
      console.error('Error en diagnóstico de tiendas:', err);
      return { error: err.message };
    }
  }
} 