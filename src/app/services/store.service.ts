import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

export interface Store {
  id: string;
  name: string;
  description?: string;
  owner_id?: string;
  location?: string;
  image_url?: string;
  is_open?: boolean;
  open_time?: string | null;
  created_at?: string;
  updated_at?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  schedule?: any;
  contact_info?: any;
}

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private supabase: SupabaseClient;
  private storeCache: Map<string, Store> = new Map();

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

  async getStoreById(storeId: string): Promise<Store | null> {
    try {
      // Verificar primero en el caché
      if (this.storeCache.has(storeId)) {
        return this.storeCache.get(storeId) || null;
      }

      const { data, error } = await this.supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (error) throw error;
      if (!data) return null;

      const store: Store = {
        id: data.id,
        name: data.name || 'Tienda',
        description: data.description,
        owner_id: data.owner_id,
        location: data.location,
        image_url: data.image_url,
        is_open: data.is_open,
        open_time: data.open_time,
        created_at: data.created_at,
        updated_at: data.updated_at,
        latitude: data.latitude,
        longitude: data.longitude,
        category: data.category,
        schedule: data.schedule,
        contact_info: data.contact_info
      };

      // Guardar en caché
      this.storeCache.set(storeId, store);
      return store;
    } catch (error) {
      console.error('Error al obtener la tienda:', error);
      return null;
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

      // Eliminar propiedades que no existen en la interfaz Store
      const storeToUpdate = { ...store };
      delete (storeToUpdate as any).has_offers;
      delete (storeToUpdate as any).rating;

      const { data, error } = await this.supabase
        .from('stores')
        .update(storeToUpdate)
        .eq('id', store.id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No se pudo actualizar la tienda');

      const updatedStore: Store = {
        id: data.id,
        name: data.name || 'Tienda',
        description: data.description,
        owner_id: data.owner_id,
        location: data.location,
        image_url: data.image_url,
        is_open: data.is_open,
        open_time: data.open_time,
        created_at: data.created_at,
        updated_at: data.updated_at,
        latitude: data.latitude,
        longitude: data.longitude,
        category: data.category,
        schedule: data.schedule,
        contact_info: data.contact_info
      };

      this.storeCache.set(data.id, updatedStore);
      return updatedStore;
    } catch (error) {
      console.error('Error al actualizar la tienda:', error);
      throw error;
    }
  }

  async updateStoreStatus(storeId: string, isOpen: boolean): Promise<void> {
    try {
      const updateData = {
        is_open: isOpen,
        open_time: isOpen ? new Date().toISOString() : null
      };

      const { error } = await this.supabase
        .from('stores')
        .update(updateData)
        .eq('id', storeId);

      if (error) throw error;

      // Actualizar el caché si existe
      const cachedStore = this.storeCache.get(storeId);
      if (cachedStore) {
        this.storeCache.set(storeId, { 
          ...cachedStore, 
          is_open: isOpen,
          open_time: updateData.open_time
        });
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
      const cachedStore = this.storeCache.get(id);
      if (cachedStore) {
        cachedStores.push(cachedStore);
      } else {
        uncachedIds.push(id);
      }
    });

    // Si todos los IDs estaban en caché, retornar de inmediato
    if (uncachedIds.length === 0) {
      return cachedStores;
    }

    try {
      const { data, error } = await this.supabase
        .from('stores')
        .select('*')
        .in('id', uncachedIds);

      if (error) throw error;

      const fetchedStores: Store[] = [];
      if (data) {
        data.forEach(storeData => {
          const store: Store = {
            id: storeData.id,
            name: storeData.name || 'Tienda',
            description: storeData.description,
            owner_id: storeData.owner_id,
            location: storeData.location,
            image_url: storeData.image_url,
            is_open: storeData.is_open,
            open_time: storeData.open_time,
            created_at: storeData.created_at,
            updated_at: storeData.updated_at,
            latitude: storeData.latitude,
            longitude: storeData.longitude,
            category: storeData.category,
            schedule: storeData.schedule,
            contact_info: storeData.contact_info
          };
          this.storeCache.set(store.id, store);
          fetchedStores.push(store);
        });
      }

      // Crear tiendas por defecto para IDs no encontrados
      const fetchedIds = fetchedStores.map(s => s.id);
      const missingIds = uncachedIds.filter(id => !fetchedIds.includes(id));
      
      const defaultStores: Store[] = missingIds.map(id => ({
        id,
        name: 'Tienda'
      }));

      defaultStores.forEach(store => this.storeCache.set(store.id, store));

      return [...cachedStores, ...fetchedStores, ...defaultStores];
    } catch (error) {
      console.error('Error al obtener las tiendas:', error);
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