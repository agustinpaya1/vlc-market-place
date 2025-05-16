import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Store {
  id: string;
  name: string;
  description?: string;
  address?: string;
  image_url?: string;
  created_at?: string;
  category?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private storeCache: Map<string, Store> = new Map();

  constructor(private supabase: SupabaseService) {}

  /**
   * Obtiene un almacén por su ID (con caché)
   */
  async getStoreById(storeId: string): Promise<Store | null> {
    // Verificar la caché primero
    if (this.storeCache.has(storeId)) {
      return this.storeCache.get(storeId) || null;
    }

    try {
      const { data, error } = await this.supabase.getClient()
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (error) {
        console.error(`Error al obtener tienda ${storeId}:`, error);
        return null;
      }

      if (data) {
        const store: Store = {
          ...data,
          name: data.name || 'Tienda' // Asegurar que siempre hay un nombre
        };
        
        // Guardar en caché
        this.storeCache.set(storeId, store);
        return store;
      }
      
      return null;
    } catch (err) {
      console.error(`Error al cargar tienda ${storeId}:`, err);
      return null;
    }
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
      const { data, error } = await this.supabase.getClient()
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
      const { data, error } = await this.supabase.getClient()
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
   * Limpiar la caché de tiendas
   */
  clearCache(): void {
    this.storeCache.clear();
  }

  /**
   * Método de diagnóstico para examinar tiendas existentes en Supabase
   */
  async diagnosticAllStores(): Promise<any> {
    try {
      console.log('Ejecutando diagnóstico completo de tiendas...');
      
      // Obtener todas las tiendas de la base de datos sin filtros
      const { data: allStores, error } = await this.supabase.getClient()
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
            const { data, error } = await this.supabase.getClient()
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
      const { data: orders, error: ordersError } = await this.supabase.getClient()
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
      const { data: orderItems, error: itemsError } = await this.supabase.getClient()
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