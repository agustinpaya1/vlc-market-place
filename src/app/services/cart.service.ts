import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<Map<number, number>>(new Map());
  cartItems$ = this.cartItems.asObservable();

  constructor() {
    // Load cart from localStorage on initialization
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedData = JSON.parse(savedCart);
        const cartMap = new Map<number, number>();
        parsedData.forEach(([key, value]: [string, number]) => {
          cartMap.set(Number(key), value);
        });
        this.cartItems.next(cartMap);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        this.cartItems.next(new Map());
      }
    }

    // Save cart to localStorage whenever it changes
    this.cartItems$.subscribe(items => {
      localStorage.setItem('cart', JSON.stringify(Array.from(items.entries())));
    });
  }

  addToCart(productId: number): void {
    console.log('Adding product to cart:', productId);
    const currentCart = this.cartItems.value;
    const currentQuantity = currentCart.get(productId) || 0;
    currentCart.set(productId, currentQuantity + 1);
    this.cartItems.next(new Map(currentCart));
    console.log('Cart updated:', this.cartItems.value);
  }

  removeFromCart(productId: number): void {
    console.log('Removing product from cart:', productId);
    const currentCart = this.cartItems.value;
    const currentQuantity = currentCart.get(productId) || 0;
    if (currentQuantity > 0) {
      currentCart.set(productId, currentQuantity - 1);
      this.cartItems.next(new Map(currentCart));
      console.log('Cart updated:', this.cartItems.value);
    }
  }

  getQuantity(productId: number): number {
    return this.cartItems.value.get(productId) || 0;
  }

  getTotalItems(): number {
    let total = 0;
    this.cartItems.value.forEach(quantity => {
      total += quantity;
    });
    return total;
  }
} 