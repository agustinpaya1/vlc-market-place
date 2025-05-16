import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { BehaviorSubject, Observable } from 'rxjs';

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
    private authService: AuthService
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

        // Para cada item, cargamos la información del producto
        if (items && items.length > 0) {
          for (const item of items) {
            if (item.product_id) {
              const productInfo = await this.getProductById(item.product_id);
              if (productInfo) {
                item.product_info = productInfo;
              }
            }
          }
        }

        // Obtener información de la tienda o tiendas
        const storeInfo = await this.getStoreInfo(order, items);

        // Formatear la fecha
        const date = new Date(order.created_at || order.date);
        
        // Añadir el pedido con sus items y tienda
        ordersWithItems.push({
          ...order,
          date: date.toISOString(),
          items: items || [],
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

  private async getStoreInfo(order: any, items: any[]): Promise<any> {
    try {
      // Si el pedido ya tiene store_id, usamos ese
      if (order.store_id) {
        try {
          const { data, error } = await this.supabase.getClient()
            .from('stores')
            .select('*')
            .eq('id', order.store_id)
            .single();

          if (error) throw error;
          return data;
        } catch (err) {
          console.error(`Error al obtener info de tienda ${order.store_id}:`, err);
          // Retornar un objeto con un nombre por defecto en caso de error
          return { id: order.store_id, name: 'Tienda' };
        }
      }
      
      // Si no hay store_id en el pedido, intentamos obtenerlo de los items
      // Este es el caso de pedidos multi-tienda
      if (items && items.length > 0) {
        // Primero intentamos obtener store_id de los items
        const storeIds = [...new Set(items.map(item => item.store_id).filter(Boolean))];
        
        // Si no hay store_ids en los items, intentamos obtenerlos de la info de producto
        if (storeIds.length === 0) {
          const productStoreIds = [...new Set(items
            .filter(item => item.product_info && item.product_info.store_id)
            .map(item => item.product_info.store_id))];
            
          if (productStoreIds.length > 0) {
            storeIds.push(...productStoreIds);
          }
        }
        
        if (storeIds.length === 1) {
          // Un solo store
          try {
            const { data, error } = await this.supabase.getClient()
              .from('stores')
              .select('*')
              .eq('id', storeIds[0])
              .single();

            if (error) throw error;
            return data || { id: storeIds[0], name: 'Tienda' };
          } catch (err) {
            console.error(`Error al obtener info de tienda ${storeIds[0]}:`, err);
            return { id: storeIds[0], name: 'Tienda' };
          }
        } else if (storeIds.length > 1) {
          // Multi-store
          try {
            const { data, error } = await this.supabase.getClient()
              .from('stores')
              .select('*')
              .in('id', storeIds);

            if (error) throw error;
            
            // Si no se encontraron tiendas, crear objetos con nombres por defecto
            if (!data || data.length === 0) {
              const defaultStores = storeIds.map(id => ({ id, name: 'Tienda' }));
              return { multiStore: true, stores: defaultStores };
            }
            
            // Asegurarnos de que todas las tiendas tienen un nombre
            const stores = data.map(store => ({
              ...store,
              name: store.name || 'Tienda'
            }));
            
            return { multiStore: true, stores };
          } catch (err) {
            console.error(`Error al obtener info de múltiples tiendas:`, err);
            // Devolver un objeto con tiendas por defecto
            const defaultStores = storeIds.map(id => ({ id, name: 'Tienda' }));
            return { multiStore: true, stores: defaultStores };
          }
        }
      }
      
      // Si no hay información de tienda, devolver un objeto con nombre por defecto
      return { name: 'Tienda sin especificar' };
    } catch (error) {
      console.error('Error al obtener información de tienda:', error);
      return { name: 'Tienda sin especificar' };
    }
  }

  // Método para obtener la lista de tiendas de un pedido
  getStoreList(order: Order): any[] {
    if (!order.store_info) return [];
    
    if (order.store_info.multiStore && order.store_info.stores) {
      return order.store_info.stores;
    } else {
      // Si es una sola tienda, la devolvemos en un array
      return [order.store_info];
    }
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
      const storeInfo = await this.getStoreInfo(data, items || []);

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
} 