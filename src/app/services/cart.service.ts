import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<Map<number, number>>(new Map());
  cartItems$ = this.cartItems.asObservable();

  constructor() {}

  addToCart(productId: number): void {
    const currentCart = this.cartItems.value;
    const currentQuantity = currentCart.get(productId) || 0;
    currentCart.set(productId, currentQuantity + 1);
    this.cartItems.next(new Map(currentCart));
  }

  removeFromCart(productId: number): void {
    const currentCart = this.cartItems.value;
    const currentQuantity = currentCart.get(productId) || 0;
    if (currentQuantity > 0) {
      currentCart.set(productId, currentQuantity - 1);
      this.cartItems.next(new Map(currentCart));
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