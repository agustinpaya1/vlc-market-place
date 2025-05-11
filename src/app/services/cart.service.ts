import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ToastController } from '@ionic/angular';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  offerPrice?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItems.asObservable();
  private isAuthenticated = false;
  private userId: string | null = null;

  constructor(
    private authService: AuthService,
    private toastController: ToastController
  ) {
    // Listen for auth state changes
    this.authService.user$.subscribe(user => {
      if (user) {
        this.isAuthenticated = true;
        this.userId = user.id;
        // Load user-specific cart from localStorage
        this.loadUserCart();
      } else {
        this.isAuthenticated = false;
        this.userId = null;
        // Clear cart when user logs out
        this.clearCart();
      }
    });
  }

  private loadUserCart(): void {
    if (this.userId) {
      const savedCart = localStorage.getItem(`cart_${this.userId}`);
      if (savedCart) {
        this.cartItems.next(JSON.parse(savedCart));
      } else {
        this.cartItems.next([]);
      }
    }
  }

  async addToCart(product: any): Promise<boolean> {
    if (!this.isAuthenticated) {
      const toast = await this.toastController.create({
        message: 'Inicia sesión o regístrate para añadir productos al carrito',
        duration: 3000,
        position: 'bottom',
        buttons: [
          {
            text: 'Iniciar sesión',
            handler: () => {
              window.location.href = '/login';
            }
          }
        ]
      });
      await toast.present();
      return false;
    }

    const currentItems = this.cartItems.value;
    const existingItem = currentItems.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
      this.updateCart([...currentItems]);
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        imageUrl: product.imageUrl,
        offerPrice: product.offerPrice !== undefined ? product.offerPrice : undefined
      };
      this.updateCart([...currentItems, newItem]);
    }
    return true;
  }

  removeFromCart(productId: string): void {
    const currentItems = this.cartItems.value;
    const updatedItems = currentItems.filter(item => item.id !== productId);
    this.updateCart(updatedItems);
  }

  updateQuantity(productId: string, quantity: number): void {
    const currentItems = this.cartItems.value;
    const item = currentItems.find(item => item.id === productId);
    
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        this.updateCart([...currentItems]);
      }
    }
  }

  getCartItems(): Observable<CartItem[]> {
    return this.cartItems$;
  }

  getCurrentCartItems(): CartItem[] {
    return this.cartItems.value;
  }

  getTotalItems(): number {
    return this.cartItems.value.reduce((total, item) => total + item.quantity, 0);
  }

  getTotalPrice(): number {
    return this.roundToTwoDecimals(
      this.cartItems.value.reduce((total, item) => {
        const itemPrice = item.offerPrice !== undefined ? item.offerPrice : item.price;
        return total + (itemPrice * item.quantity);
      }, 0)
    );
  }

  clearCart(): void {
    this.cartItems.next([]);
    if (this.userId) {
      localStorage.removeItem(`cart_${this.userId}`);
    } else {
      localStorage.removeItem('cart');
    }
  }

  private updateCart(items: CartItem[]): void {
    this.cartItems.next(items);
    if (this.userId) {
      localStorage.setItem(`cart_${this.userId}`, JSON.stringify(items));
    }
  }

  private roundToTwoDecimals(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }
} 