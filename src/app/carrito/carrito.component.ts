import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonBadge,
  IonButtons,
  IonText,
  IonCardSubtitle,
  IonInput
} from '@ionic/angular/standalone';
import { CartService, CartItem } from '../services/cart.service';
import { ProductService } from '../services/product.service';
import type { Product } from '../services/product.service';
import { addIcons } from 'ionicons';
import { trash, arrowBack, add, remove } from 'ionicons/icons';

@Component({
  selector: 'app-carrito',
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
    IonBadge,
    IonButtons,
    IonText,
    IonCardSubtitle,
    IonInput
  ]
})
export class CarritoComponent implements OnInit {
  cartItems: CartItem[] = [];
  totalItems = 0;
  totalPrice = 0;

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private router: Router
  ) {
    addIcons({ trash, arrowBack, add, remove });
  }

  ngOnInit() {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.totalItems = this.cartService.getTotalItems();
      this.totalPrice = this.cartService.getTotalPrice();
    });
  }

  updateQuantity(item: CartItem, change: number) {
    const newQuantity = item.quantity + change;
    if (newQuantity > 0) {
      this.cartService.updateQuantity(item.id, newQuantity);
    }
  }

  removeItem(productId: number) {
    this.cartService.removeFromCart(productId);
  }

  clearCart() {
    this.cartService.clearCart();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  proceedToCheckout(): void {
    // Aquí implementaremos la lógica de pago más adelante
    console.log('Proceeding to checkout with items:', this.cartItems);
  }
} 