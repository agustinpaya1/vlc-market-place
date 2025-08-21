import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

export interface CartItem {
  id: string;
  storeId?: string | null;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  offerPrice?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  private isAuthenticated = false;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.authService.user$.subscribe(user => {
      this.isAuthenticated = !!user;
    });

    // 👇 Recupera carrito del storage y normaliza storeId
    this.loadFromStorage();
  }

  /** === Helpers de storeId y storage === */
  private getStoreIdFromProduct(product: any): string | null {
    return (
      product?.storeId ??
      product?.store_id ??
      product?.store?.id ??
      null
    );
  }

  // <-- Añadir este helper (lo usa addToCart)
  private getStoreId(obj: any): string | null {
    if (!obj) return null;
    return (
      obj?.storeId ??
      obj?.store_id ??
      obj?.store?.id ??
      obj?.product?.storeId ??
      obj?.product?.store_id ??
      obj?.product?.store?.id ??
      this.getStoreIdFromProduct(obj) ??
      null
    );
  }

  private saveToStorage() {
    try { localStorage.setItem('cart', JSON.stringify(this.cartItems.value)); } catch {}
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem('cart') ?? '[]';
      const saved: any[] = JSON.parse(raw);
      const normalized: CartItem[] = saved.map(i => ({
        ...i,
        storeId:
          i?.storeId ??
          i?.store_id ??
          i?.store?.id ??
          i?.product?.storeId ??
          i?.product?.store_id ??
          i?.product?.store?.id ??
          null
      }));
      this.cartItems.next(normalized);
    } catch {}
  }
  /** === Fin helpers === */

  getCartItems(): Observable<CartItem[]> {
    return this.cartItems.asObservable();
  }

  getCurrentCartItems(): CartItem[] {
    return this.cartItems.value;
  }

  getTotalItems(): number {
    return this.cartItems.value.reduce((total, item) => total + item.quantity, 0);
  }

  getTotalPrice(): number {
    return this.cartItems.value.reduce((total, item) => {
      const price = item.offerPrice !== undefined ? item.offerPrice : item.price;
      return total + (price * item.quantity);
    }, 0);
  }

  async addToCart(input: CartItem | any): Promise<boolean> {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      await this.notificationService.showAuthRequired(
        'Inicia sesión o regístrate para añadir productos al carrito',
        () => { window.location.href = '/login'; }
      );
      return false;
    }

    // Normaliza siempre el item para asegurar storeId
    const normalized: CartItem = {
      id: input.id,
      name: input.name ?? input.product?.name ?? input.title ?? 'Producto',
      price: Number(input.offerPrice ?? input.price ?? 0),
      quantity: Number(input.quantity ?? 1),
      imageUrl: input.imageUrl ?? input.image_url ?? input.product?.image_url,
      offerPrice: input.offerPrice !== undefined ? Number(input.offerPrice) : undefined,
      storeId: this.getStoreId(input), // 👈 aquí se resuelve bien
    };

    const current = this.cartItems.value;

    // Evita mezclar el mismo producto de tiendas distintas
    const idx = current.findIndex(i =>
      i.id === normalized.id &&
      (i.storeId ?? null) === (normalized.storeId ?? null)
    );

    if (idx > -1) {
      // Suma cantidad y preserva/establece storeId
      current[idx] = {
        ...current[idx],
        quantity: (current[idx].quantity ?? 0) + (normalized.quantity ?? 1),
        storeId: current[idx].storeId ?? normalized.storeId
      };

      this.cartItems.next([...current]);
      this.saveToStorage();
      await this.notificationService.showSuccess(
        `Cantidad actualizada: ${current[idx].name} (${current[idx].quantity})`,
        { icon: 'cart', duration: 1500 }
      );
    } else {
      this.cartItems.next([...current, normalized]);
      this.saveToStorage();
      await this.notificationService.showSuccess(
        `${normalized.name} añadido al carrito`,
        { icon: 'cart', duration: 1500 }
      );
    }

    return true;
  }

  async removeFromCart(productId: string) {
    const user = await this.authService.getCurrentUser();
    const currentItems = this.cartItems.value;
    const updatedItems = currentItems.filter(item => item.id !== productId);
    this.cartItems.next(updatedItems);
    this.saveToStorage();
    if (user) {
      await this.notificationService.showInfo('Producto eliminado del carrito');
    }
  }

  async updateQuantity(productId: string, quantity: number) {
    const user = await this.authService.getCurrentUser();
    const currentItems = this.cartItems.value;
    const item = currentItems.find(item => item.id === productId);

    if (item) {
      if (quantity <= 0) {
        await this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        this.cartItems.next([...currentItems]);
        this.saveToStorage();
        if (user) {
          await this.notificationService.showSuccess(`Cantidad actualizada: ${item.name} (${quantity})`);
        }
      }
    }
  }

  clearCart() {
    this.cartItems.next([]);
    this.saveToStorage();
  }
}
