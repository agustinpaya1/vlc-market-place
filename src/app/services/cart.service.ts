import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItems.asObservable();

  constructor() {
    // Initialize cart from localStorage if available
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      this.cartItems.next(JSON.parse(savedCart));
    }
  }

  addToCart(product: any): void {
    const currentItems = this.cartItems.value;
    const existingItem = currentItems.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
      this.updateCart([...currentItems]);
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: this.roundToTwoDecimals(product.price),
        quantity: 1,
        imageUrl: product.imageUrl
      };
      this.updateCart([...currentItems, newItem]);
    }
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
    const total = this.cartItems.value.reduce((total, item) => {
      const itemTotal = item.price * item.quantity;
      return total + itemTotal;
    }, 0);
    return this.roundToTwoDecimals(total);
  }

  clearCart(): void {
    this.updateCart([]);
  }

  private updateCart(items: CartItem[]): void {
    this.cartItems.next(items);
    localStorage.setItem('cart', JSON.stringify(items));
  }

  private roundToTwoDecimals(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }
} 