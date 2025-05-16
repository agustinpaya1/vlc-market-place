import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ToastController } from '@ionic/angular/standalone';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

export interface CartItem {
  id: string;
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
  }

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

  async addToCart(item: CartItem): Promise<boolean> {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      await this.notificationService.show({
        message: 'Inicia sesión o regístrate para añadir productos al carrito',
        type: 'warning',
        duration: 3000,
        action: {
          text: 'Iniciar sesión',
          handler: () => {
            window.location.href = '/login';
          }
        }
      });
      return false;
    }

    const currentItems = this.cartItems.value;
    const existingItem = currentItems.find(i => i.id === item.id);
    
    if (existingItem) {
      existingItem.quantity += item.quantity;
      this.cartItems.next([...currentItems]);
      await this.notificationService.showSuccess(`Cantidad actualizada: ${item.name} (${existingItem.quantity})`);
    } else {
      this.cartItems.next([...currentItems, item]);
      await this.notificationService.showSuccess(`${item.name} añadido al carrito`);
    }
    return true;
  }

  async removeFromCart(productId: string) {
    const user = await this.authService.getCurrentUser();
    const currentItems = this.cartItems.value;
    const updatedItems = currentItems.filter(item => item.id !== productId);
    this.cartItems.next(updatedItems);
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
        if (user) {
          await this.notificationService.showSuccess(`Cantidad actualizada: ${item.name} (${quantity})`);
        }
      }
    }
  }

  clearCart() {
    this.cartItems.next([]);
  }
} 