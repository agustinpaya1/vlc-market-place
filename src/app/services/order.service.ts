import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { StoreService, Store } from './store.service';

export interface Order {
  id: string;
  user_id: string;
  date: string;
  status: string;
  total_price: number;
  items: OrderItem[];
  store_id?: string;
  store_info?: any;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product_info?: any;
  store_id?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  store_id: string;
  category?: string;
  available: boolean;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  public orders$ = this.ordersSubject.asObservable();
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService,
    private storeService: StoreService
  ) {}

  async getUserOrders(): Promise<Order[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    try {
      const user = await this.authService.getCurrentUser();
      if (!user) {
        this.errorSubject.next('Usuario no autenticado');
        return [];
      }

      // Primero precargar todas las tiendas para tener la información disponible en la caché
      await this.storeService.preloadStores();

      const { data: orders, error } = await this.supabase.getClient()
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al obtener pedidos:', error);
        this.errorSubject.next('Error al cargar pedidos');
        return [];
      }

      // Ahora vamos a obtener los elementos de cada pedido
      const ordersWithItems = await this.getOrdersWithItems(orders);
      
      this.ordersSubject.next(ordersWithItems);
      return ordersWithItems;
    } catch (error) {
      console.error('Error inesperado al obtener pedidos:', error);
      this.errorSubject.next('Error inesperado al cargar pedidos');
      return [];
    } finally {
      this.loadingSubject.next(false);
    }
  }

  private async getOrdersWithItems(orders: any[]): Promise<Order[]> {
    if (!orders || orders.length === 0) return [];

    const ordersWithItems: Order[] = [];

    for (const order of orders) {
      try {
        // Obtener los items de cada pedido
        const { data: items, error } = await this.supabase.getClient()
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        if (error) {
          console.error(`Error al obtener items del pedido ${order.id}:`, error);
          continue;
        }

        // Copiar los items para no modificar la respuesta original
        const processedItems = items ? [...items] : [];

        // Para cada item, cargamos la información del producto
        if (processedItems && processedItems.length > 0) {
          await this.loadProductsForItems(processedItems);
        }

        // Obtener información de la tienda
        const storeInfo = await this.getStoreInfoDirectly(order, processedItems);

        // Formatear la fecha
        const date = new Date(order.created_at || order.date);
        
        // Añadir el pedido con sus items y tienda
        ordersWithItems.push({
          ...order,
          date: date.toISOString(),
          items: processedItems || [],
          store_info: storeInfo
        });
      } catch (err) {
        console.error(`Error procesando pedido ${order.id}:`, err);
      }
    }

    return ordersWithItems;
  }

  // Método público para obtener información de un producto por su ID
  async getProductById(productId: string): Promise<Product | null> {
    try {
      const { data, error } = await this.supabase.getClient()
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (error) throw error;
      return data as Product;
    } catch (err) {
      console.error(`Error al cargar info del producto ${productId}:`, err);
      return null;
    }
  }

  // Método para cargar información de productos para un conjunto de items
  async loadProductsForItems(items: OrderItem[]): Promise<OrderItem[]> {
    if (!items || items.length === 0) return items;

    for (const item of items) {
      if (!item.product_info && item.product_id) {
        const productInfo = await this.getProductById(item.product_id);
        if (productInfo) {
          item.product_info = productInfo;
        }
      }
    }

    return items;
  }

  // Nueva implementación que consulta directamente la tabla stores
  private async getStoreInfoDirectly(order: any, items: any[]): Promise<any> {
    try {
      console.log(`[DEBUG] Obteniendo información de tienda para pedido ${order.id}...`);
      
      // Si el pedido tiene store_id, obtener la información de esa tienda
      if (order.store_id) {
        console.log(`[DEBUG] Pedido tiene store_id: ${order.store_id}`);
        
        // Asegurarnos de devolver el ID como mínimo
        return { 
          id: order.store_id,
          name: 'Tienda',
          _debug_id: order.store_id // Para depuración
        };
      }
      
      // Si no hay store_id en el pedido, intentamos obtenerlo de los items
      // Este es el caso de pedidos multi-tienda
      if (items && items.length > 0) {
        // Recolectar todos los store_ids de los items y productos
        console.log(`[DEBUG] Buscando store_ids en ${items.length} items...`);
        const storeIds = new Set<string>();
        
        // Añadir store_ids directamente de los items
        items.forEach(item => {
          if (item.store_id) {
            storeIds.add(item.store_id);
            console.log(`[DEBUG] Item ${item.id} tiene store_id: ${item.store_id}`);
          }
          
          // También verificar si hay store_id en la info del producto
          if (item.product_info && item.product_info.store_id) {
            storeIds.add(item.product_info.store_id);
            console.log(`[DEBUG] Producto ${item.product_id} tiene store_id: ${item.product_info.store_id}`);
          }
        });
        
        const uniqueStoreIds = Array.from(storeIds);
        console.log(`[DEBUG] IDs de tiendas encontrados: ${uniqueStoreIds.join(', ')}`);
        
        if (uniqueStoreIds.length === 1) {
          // Caso de una sola tienda
          const storeId = uniqueStoreIds[0];
          console.log(`[DEBUG] Un solo store_id: ${storeId}`);
          
          // Devolver al menos el ID
          return { 
            id: storeId,
            name: 'Tienda',
            _debug_id: storeId // Para depuración
          };
        } else if (uniqueStoreIds.length > 1) {
          // Caso de múltiples tiendas
          console.log(`[DEBUG] Múltiples tiendas: ${uniqueStoreIds.length}`);
          
          // Crear objetos con los IDs
          const stores = uniqueStoreIds.map(id => ({ 
            id: id,
            name: 'Tienda',
            _debug_id: id // Para depuración
          }));
          
          return { multiStore: true, stores };
        }
      }
      
      // Si no encontramos información de tienda
      console.log(`[DEBUG] No se encontró información de tienda para el pedido ${order.id}`);
      return { 
        name: 'Tienda',
        _debug_noStore: true // Para depuración
      };
    } catch (error) {
      console.error('[DEBUG] Error al obtener información de tienda:', error);
      return { 
        name: 'Tienda',
        _debug_error: true // Para depuración
      };
    }
  }

  // Método para obtener la lista de tiendas de un pedido
  getStoreList(order: Order): any[] {
    if (!order || !order.store_info) return [];
    
    // Caso de múltiples tiendas
    if (order.store_info.multiStore && Array.isArray(order.store_info.stores)) {
      // Filtramos para evitar tiendas undefined o null
      return order.store_info.stores.filter((store: any) => store);
    } 
    
    // Si es una sola tienda, la devolvemos en un array (asegurándonos que no es null o undefined)
    if (order.store_info && typeof order.store_info === 'object') {
      return [order.store_info];
    }
    
    // Si no hay información válida, retornar array vacío
    return [];
  }

  // Método para marcar un pedido como entregado
  async markOrderAsDelivered(orderId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.getClient()
        .from('orders')
        .update({ status: 'delivered', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) {
        console.error('Error al marcar pedido como entregado:', error);
        throw error;
      }

      // Actualizar el estado local si está en la lista de pedidos
      const currentOrders = this.ordersSubject.getValue();
      const updatedOrders = currentOrders.map(order => {
        if (order.id === orderId) {
          return { ...order, status: 'delivered' };
        }
        return order;
      });
      this.ordersSubject.next(updatedOrders);

      return true;
    } catch (error) {
      console.error('Error inesperado al actualizar estado del pedido:', error);
      return false;
    }
  }

  // Método para obtener un pedido por su ID
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const { data, error } = await this.supabase.getClient()
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Obtener los items
      const { data: items, error: itemsError } = await this.supabase.getClient()
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      // Cargar información de productos para cada item
      if (items && items.length > 0) {
        await this.loadProductsForItems(items);
      }

      // Obtener info de la tienda
      const storeInfo = await this.getStoreInfoDirectly(data, items || []);

      // Formatear la fecha
      const date = new Date(data.created_at || data.date);
      
      return {
        ...data,
        date: date.toISOString(),
        items: items || [],
        store_info: storeInfo
      };
    } catch (error) {
      console.error('Error al obtener pedido por ID:', error);
      return null;
    }
  }

  // Método para depurar un pedido y su información de tiendas
  debugOrderStoreInfo(orderId: string): Promise<any> {
    return new Promise(async (resolve) => {
      try {
        // Obtener el pedido
        const { data: order, error } = await this.supabase.getClient()
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();
        
        if (error) {
          console.error('Error al obtener pedido:', error);
          resolve({ error: 'Error al obtener pedido' });
          return;
        }
        
        // Obtener los items
        const { data: items, error: itemsError } = await this.supabase.getClient()
          .from('order_items')
          .select('*')
          .eq('order_id', orderId);
        
        if (itemsError) {
          console.error('Error al obtener items:', itemsError);
          resolve({ error: 'Error al obtener items', order });
          return;
        }
        
        // Obtener IDs de tiendas
        const storeIds = [
          order.store_id,
          ...items.map(item => item.store_id).filter(Boolean)
        ].filter(Boolean);
        
        const uniqueStoreIds = [...new Set(storeIds)];
        
        // Obtener tiendas usando el StoreService
        const stores = await this.storeService.getStoresByIds(uniqueStoreIds);
        
        // Resultado de diagnóstico
        resolve({
          order,
          items,
          uniqueStoreIds,
          storesFound: stores,
          storeInfoGenerated: await this.getStoreInfoDirectly(order, items)
        });
      } catch (err) {
        console.error('Error en diagnóstico:', err);
        resolve({ error: 'Error inesperado en diagnóstico' });
      }
    });
  }
} 